import { PortfolioItem } from './portfolioItem.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { aiService } from '../../services/ai/ai.service.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';
import { ROLES, VERIFICATION_STATUS } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const VERIFIERS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];

export async function createItem(userId, data) {
  ensureDB();
  const item = await PortfolioItem.create({ ...data, user: userId, verificationStatus: VERIFICATION_STATUS.UNVERIFIED });

  // Auto-sync item to StudentProfile so projects, certifications, and skills stay unified
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    if (profile) {
      let changed = false;
      if (data.type === 'project' && data.title) {
        const hasProj = (profile.projects || []).some(
          (p) => p.title?.trim().toLowerCase() === data.title.trim().toLowerCase()
        );
        if (!hasProj) {
          profile.projects.push({
            title: data.title.trim(),
            description: data.description?.trim() || '',
            techStack: Array.isArray(data.skills) ? data.skills : [],
            link: data.link?.trim() || '',
            role: '',
          });
          changed = true;
        }
      } else if (data.type === 'certification' && data.title) {
        const hasCert = (profile.certifications || []).some(
          (c) => c.name?.trim().toLowerCase() === data.title.trim().toLowerCase()
        );
        if (!hasCert) {
          profile.certifications.push({
            name: data.title.trim(),
            issuer: data.issuer?.trim() || '',
            url: data.link?.trim() || '',
          });
          changed = true;
        }
      }

      // Sync skills from portfolio item to profile
      if (Array.isArray(data.skills) && data.skills.length) {
        const existingNames = new Set((profile.skills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase()));
        for (const s of data.skills) {
          if (s && !existingNames.has(s.trim().toLowerCase())) {
            profile.skills.push({ name: s.trim(), level: 'intermediate' });
            existingNames.add(s.trim().toLowerCase());
            changed = true;
          }
        }
      }

      if (changed) {
        await profile.save();
      }
    }
  } catch (err) {
    logger.warn(`Auto-sync portfolio item to student profile failed: ${err.message}`);
  }

  return item;
}

export async function listItems(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = { user: userId };
  if (query.type) filter.type = query.type;
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  const [items, total] = await Promise.all([
    PortfolioItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PortfolioItem.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

async function loadOwned(id, requester) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  const isOwner = String(item.user) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only manage your own portfolio', { code: 'NOT_OWNER' });
  }
  return item;
}

export async function getItem(id, requester) {
  ensureDB();
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  const isOwner = String(item.user) === String(requester?._id);
  const isPrivileged = requester && VERIFIERS.includes(requester.role);
  if (item.visibility === 'private' && !isOwner && !isPrivileged) {
    throw ApiError.forbidden('This portfolio item is private', { code: 'PRIVATE_ITEM' });
  }
  return item;
}

export async function updateItem(id, requester, data) {
  ensureDB();
  const item = await loadOwned(id, requester);
  // Re-verification is required after content edits.
  const contentChanged = ['title', 'description', 'evidence', 'issuer', 'credentialId'].some((k) => k in data);
  Object.assign(item, data);
  if (contentChanged && requester.role === ROLES.STUDENT) {
    item.verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
    item.verifiedBy = undefined;
    item.verifiedAt = undefined;
  }
  await item.save();
  return item;
}

export async function deleteItem(id, requester) {
  ensureDB();
  const item = await loadOwned(id, requester);
  await item.deleteOne();
  return { deleted: true, id };
}

export async function verifyItem(id, status, requester) {
  ensureDB();
  if (!VERIFIERS.includes(requester.role)) {
    throw ApiError.forbidden('Not allowed to verify portfolio items', { code: 'NOT_VERIFIER' });
  }
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  item.verificationStatus = status;
  item.verifiedBy = requester._id;
  item.verifiedAt = status === VERIFICATION_STATUS.VERIFIED ? new Date() : undefined;
  await item.save();
  safeAudit({
    actor: requester._id,
    actorRole: requester.role,
    action: AUDIT_ACTION.PORTFOLIO_VERIFY,
    resource: 'PortfolioItem',
    resourceId: String(item._id),
    meta: { status },
  });
  return item;
}

/**
 * Public share view: the owner's public portfolio items plus a light profile
 * summary. No auth required (optionalAuth on the route).
 */
export async function getShareView(userId) {
  ensureDB();
  const user = await User.findById(userId).select('name role');
  if (!user) throw ApiError.notFound('User not found');

  const items = await PortfolioItem.find({ user: userId, visibility: 'public' }).sort({ createdAt: -1 });
  const profile = await StudentProfile.findOne({ user: userId }).select('skills careerGoals completeness');

  return {
    user: { id: String(user._id), name: user.name, role: user.role },
    summary: profile
      ? {
          completeness: profile.completeness,
          topSkills: (profile.skills || []).slice(0, 10),
          targetRoles: profile.careerGoals?.targetRoles || [],
        }
      : null,
    verifiedCount: items.filter((i) => i.verificationStatus === VERIFICATION_STATUS.VERIFIED).length,
    items: items.map((i) => i.toJSON()),
  };
}

/**
 * AI-assisted resume generation from the student's profile + all portfolio items.
 * Universally unifies projects, certifications, experience, skills, and achievements.
 */
export async function generateResume(userId) {
  ensureDB();
  const [user, profile, items] = await Promise.all([
    User.findById(userId).select('name email phone'),
    StudentProfile.findOne({ user: userId }),
    PortfolioItem.find({ user: userId }),
  ]);
  if (!profile) throw ApiError.badRequest('Complete your profile before generating a resume', { code: 'NO_PROFILE' });

  // 1. Unify and deduplicate all projects from both StudentProfile.projects AND PortfolioItem (type === 'project')
  const unifiedProjects = [];
  const projectTitlesSeen = new Set();

  for (const p of profile.projects || []) {
    if (p && p.title && !projectTitlesSeen.has(p.title.trim().toLowerCase())) {
      projectTitlesSeen.add(p.title.trim().toLowerCase());
      unifiedProjects.push({
        title: p.title.trim(),
        description: p.description?.trim() || '',
        techStack: Array.isArray(p.techStack) ? p.techStack : [],
        link: p.link?.trim() || '',
        verified: false,
      });
    }
  }

  for (const item of items || []) {
    if (item.type === 'project' && item.title && !projectTitlesSeen.has(item.title.trim().toLowerCase())) {
      projectTitlesSeen.add(item.title.trim().toLowerCase());
      unifiedProjects.push({
        title: item.title.trim(),
        description: item.description?.trim() || '',
        techStack: Array.isArray(item.skills) ? item.skills : [],
        link: item.link?.trim() || '',
        verified: item.verificationStatus === VERIFICATION_STATUS.VERIFIED,
      });
    }
  }

  // 2. Unify and deduplicate all certifications from both StudentProfile.certifications AND PortfolioItem (type === 'certification')
  const unifiedCertifications = [];
  const certNamesSeen = new Set();

  for (const c of profile.certifications || []) {
    if (c && c.name && !certNamesSeen.has(c.name.trim().toLowerCase())) {
      certNamesSeen.add(c.name.trim().toLowerCase());
      unifiedCertifications.push({
        name: c.name.trim(),
        issuer: c.issuer?.trim() || '',
        issueDate: c.issueDate || null,
        credentialUrl: c.url || c.credentialUrl || '',
        verified: false,
      });
    }
  }

  for (const item of items || []) {
    if (item.type === 'certification' && item.title && !certNamesSeen.has(item.title.trim().toLowerCase())) {
      certNamesSeen.add(item.title.trim().toLowerCase());
      unifiedCertifications.push({
        name: item.title.trim(),
        issuer: item.issuer?.trim() || '',
        issueDate: item.createdAt || null,
        credentialUrl: item.link?.trim() || '',
        verified: item.verificationStatus === VERIFICATION_STATUS.VERIFIED,
      });
    }
  }

  // 3. Unify all technical skills from StudentProfile.skills AND all portfolio items
  const unifiedTechSkills = [];
  const skillNamesSeen = new Set();

  for (const s of profile.skills || []) {
    const sName = typeof s === 'string' ? s : s?.name;
    if (sName && !skillNamesSeen.has(sName.trim().toLowerCase())) {
      skillNamesSeen.add(sName.trim().toLowerCase());
      unifiedTechSkills.push({
        name: sName.trim(),
        level: s.level || 'intermediate',
        verified: Boolean(s.verified),
      });
    }
  }

  for (const item of items || []) {
    if (Array.isArray(item.skills)) {
      for (const sk of item.skills) {
        if (sk && !skillNamesSeen.has(sk.trim().toLowerCase())) {
          skillNamesSeen.add(sk.trim().toLowerCase());
          unifiedTechSkills.push({
            name: sk.trim(),
            level: 'intermediate',
            verified: item.verificationStatus === VERIFICATION_STATUS.VERIFIED,
          });
        }
      }
    }
  }

  // 4. Soft skills
  const unifiedSoftSkills = (profile.softSkills || []).map((s) => ({
    name: typeof s === 'string' ? s.trim() : s?.name?.trim(),
    level: s.level || 'intermediate',
  })).filter((s) => Boolean(s.name));

  // 5. Experience
  const unifiedExperience = (profile.experience || []).map((exp) => ({
    organization: exp.organization || '',
    role: exp.role || exp.title || '',
    startDate: exp.startDate || null,
    endDate: exp.endDate || null,
    current: Boolean(exp.current),
    description: exp.description || '',
  }));

  for (const item of items || []) {
    if (item.type === 'experience' && item.title) {
      const alreadyHas = unifiedExperience.some(
        (e) => e.organization?.toLowerCase() === item.title.toLowerCase() || e.role?.toLowerCase() === item.title.toLowerCase()
      );
      if (!alreadyHas) {
        unifiedExperience.push({
          organization: item.issuer || item.title,
          role: item.title,
          startDate: null,
          endDate: null,
          current: false,
          description: item.description || '',
        });
      }
    }
  }

  // 6. Achievements / Awards / Hackathons
  const unifiedAchievements = [...(profile.achievements || [])];
  for (const item of items || []) {
    if (['award', 'hackathon', 'publication'].includes(item.type) && item.title) {
      const label = `${item.title}${item.issuer ? ` (${item.issuer})` : ''}`;
      if (!unifiedAchievements.some((a) => a.toLowerCase() === label.toLowerCase())) {
        unifiedAchievements.push(label);
      }
    }
  }

  // 7. Factual Education
  const structuredEducation = (profile.education || []).map((e) => ({
    institution: e.institution || '',
    degree: e.degree || '',
    branch: e.branch || '',
    startYear: e.startYear || null,
    graduationYear: e.graduationYear || null,
    score: e.score || (e.cgpa ? `CGPA ${e.cgpa}` : ''),
  }));

  // Build AI payload for summary & action-verb project descriptions
  const payload = {
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    skills: unifiedTechSkills,
    softSkills: unifiedSoftSkills,
    projects: unifiedProjects,
    experience: unifiedExperience,
    certifications: unifiedCertifications,
    education: structuredEducation,
    careerGoals: profile.careerGoals,
    achievements: unifiedAchievements,
    portfolio: items.map((i) => ({ type: i.type, title: i.title, verified: i.verificationStatus })),
  };

  const aiResult = await aiService.generateResume(payload);

  // Map AI-polished descriptions back to projects
  const aiProjectsMap = new Map();
  if (Array.isArray(aiResult?.projects)) {
    for (const p of aiResult.projects) {
      if (p?.title) aiProjectsMap.set(p.title.trim().toLowerCase(), p.description);
    }
  }

  const structuredProjects = unifiedProjects.map((p, idx) => {
    const polishedDesc =
      aiProjectsMap.get(p.title?.trim().toLowerCase()) ||
      (Array.isArray(aiResult?.projects) && aiResult.projects[idx]?.description) ||
      p.description ||
      '';
    return {
      title: p.title,
      description: polishedDesc,
      techStack: p.techStack,
      link: p.link || '',
      verified: p.verified,
    };
  });

  // Canonical structured resume response
  const structuredResume = {
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    location: (profile.preferences?.locations && profile.preferences.locations[0]) || '',
    targetRole: (profile.careerGoals?.targetRoles && profile.careerGoals.targetRoles[0]) || 'Software Engineer',
    summary:
      aiResult?.summary ||
      profile.careerGoals?.summary ||
      `${user.name} is a dedicated candidate with practical engineering experience, verified competencies, and demonstrated impact across projects and credentials.`,
    skills: {
      technical: unifiedTechSkills,
      soft: unifiedSoftSkills,
    },
    projects: structuredProjects,
    experience: unifiedExperience,
    education: structuredEducation,
    certifications: unifiedCertifications,
    achievements: unifiedAchievements,
    links: {
      github: profile.portfolio?.github || '',
      linkedin: profile.portfolio?.linkedin || '',
      website: profile.portfolio?.website || '',
    },
    _meta: {
      source: aiResult?._meta?.source || aiService.mode,
      generatedAt: new Date().toISOString(),
    },
  };

  return { source: structuredResume._meta.source, resume: structuredResume };
}
