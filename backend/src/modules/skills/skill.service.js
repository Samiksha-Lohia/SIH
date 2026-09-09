import { Skill } from './skill.model.js';
import { Role } from './role.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { parsePagination, parseSort } from '../../utils/query.js';
import { invalidateNormalizationCache } from './normalization.service.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

// ---------- Skills ----------

export async function listSkills(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.q) {
    const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ canonicalName: rx }, { aliases: rx }];
  }
  const sort = parseSort(query.sort, { canonicalName: 1 });
  const [docs, total] = await Promise.all([
    Skill.find(filter).sort(sort).skip(skip).limit(limit),
    Skill.countDocuments(filter),
  ]);
  return { items: docs.map((d) => d.toJSON()), page, limit, total };
}

export async function getSkill(id) {
  ensureDB();
  const skill = await Skill.findById(id);
  if (!skill) throw ApiError.notFound('Skill not found');
  return skill;
}

export async function createSkill(data) {
  ensureDB();
  const slug = slugify(data.canonicalName);
  const existing = await Skill.findOne({ slug });
  if (existing) throw ApiError.conflict('Skill already exists', { code: 'SKILL_EXISTS' });
  const skill = await Skill.create({
    ...data,
    slug,
    aliases: (data.aliases || []).map((a) => a.toLowerCase().trim()),
  });
  invalidateNormalizationCache();
  return skill;
}

export async function updateSkill(id, data) {
  ensureDB();
  const skill = await Skill.findById(id);
  if (!skill) throw ApiError.notFound('Skill not found');
  if (data.canonicalName) {
    skill.canonicalName = data.canonicalName;
    skill.slug = slugify(data.canonicalName);
  }
  if (data.aliases) skill.aliases = data.aliases.map((a) => a.toLowerCase().trim());
  for (const key of ['category', 'description', 'proficiencyLevels', 'active']) {
    if (data[key] !== undefined) skill[key] = data[key];
  }
  await skill.save();
  invalidateNormalizationCache();
  return skill;
}

export async function deleteSkill(id) {
  ensureDB();
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) throw ApiError.notFound('Skill not found');
  invalidateNormalizationCache();
  return { deleted: true, id };
}

// ---------- Roles ----------

function mapRoleSkills(mappedSkills = []) {
  return mappedSkills.map((s) => ({ ...s, slug: slugify(s.name) }));
}

export async function listRoles(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (query.q) filter.title = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.category) filter.category = query.category;
  const [docs, total] = await Promise.all([
    Role.find(filter).sort({ title: 1 }).skip(skip).limit(limit),
    Role.countDocuments(filter),
  ]);
  return { items: docs.map((d) => d.toJSON()), page, limit, total };
}

export async function getRole(id) {
  ensureDB();
  const role = await Role.findById(id);
  if (!role) throw ApiError.notFound('Role not found');
  return role;
}

/** Look up a role by title or slug (used by matching/skill-gap engines). */
export async function findRoleByTitle(title) {
  ensureDB();
  const slug = slugify(title);
  return Role.findOne({ slug });
}

export async function createRole(data) {
  ensureDB();
  const slug = slugify(data.title);
  const existing = await Role.findOne({ slug });
  if (existing) throw ApiError.conflict('Role already exists', { code: 'ROLE_EXISTS' });
  return Role.create({ ...data, slug, mappedSkills: mapRoleSkills(data.mappedSkills) });
}

export async function updateRole(id, data) {
  ensureDB();
  const role = await Role.findById(id);
  if (!role) throw ApiError.notFound('Role not found');
  if (data.title) {
    role.title = data.title;
    role.slug = slugify(data.title);
  }
  if (data.mappedSkills) role.mappedSkills = mapRoleSkills(data.mappedSkills);
  for (const key of ['category', 'description', 'active']) {
    if (data[key] !== undefined) role[key] = data[key];
  }
  await role.save();
  return role;
}

export async function deleteRole(id) {
  ensureDB();
  const role = await Role.findByIdAndDelete(id);
  if (!role) throw ApiError.notFound('Role not found');
  return { deleted: true, id };
}
