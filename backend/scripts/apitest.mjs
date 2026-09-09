/**
 * End-to-end API test harness for the SUTRA backend.
 * Logs in as each seeded demo role and exercises every endpoint, recording
 * status + pass/fail + a short note. Writes API_TEST_REPORT.md.
 *
 * Run the server first (npm start) with a seeded DB (npm run seed:demo).
 * Usage: node scripts/apitest.mjs
 */
import { writeFile } from 'node:fs/promises';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const results = [];
const ctx = {}; // shared ids/tokens

function record(group, method, path, role, status, expect, note = '') {
  const expected = Array.isArray(expect) ? expect : [expect];
  const ok = expected.includes(status);
  results.push({ group, method, path, role, status, expect: expected.join('/'), ok, note });
  const flag = ok ? 'PASS' : 'FAIL';
  console.log(`[${flag}] ${method} ${path} (${role}) -> ${status} (want ${expected.join('/')}) ${note}`);
  return ok;
}

async function call(method, path, { token, body, form, expect = 200, group = 'misc', role = '-', note = '' } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let status = 0;
  let json = null;
  try {
    const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
    status = res.status;
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
  } catch (err) {
    record(group, method, path, role, 0, expect, `request error: ${err.message}. ${note}`);
    return { status: 0, json: null };
  }
  record(group, method, path, role, status, expect, note);
  return { status, json };
}

const tokens = {};
const ids = {};

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123' }),
  });
  const json = await res.json();
  return json?.data;
}

async function run() {
  // ---------- Health & Docs ----------
  await call('GET', '/api/health', { expect: 200, group: 'Health', role: 'public' });
  await call('GET', '/api/docs.json', { expect: 200, group: 'Health', role: 'public', note: 'OpenAPI spec' });

  // ---------- Auth ----------
  const rnd = Date.now();
  await call('POST', '/api/auth/register', {
    body: { name: 'Temp User', email: `temp${rnd}@sutra.dev`, password: 'Password123', role: 'student' },
    expect: 201,
    group: 'Auth',
    role: 'public',
    note: 'register new student',
  });
  await call('POST', '/api/auth/register', {
    body: { email: 'bad', password: 'x' },
    expect: 422,
    group: 'Auth',
    role: 'public',
    note: 'invalid body -> validation',
  });
  await call('POST', '/api/auth/login', {
    body: { email: 'student@sutra.dev', password: 'wrongpass' },
    expect: 401,
    group: 'Auth',
    role: 'public',
    note: 'wrong password',
  });

  // Login each demo role.
  for (const [role, email] of [
    ['student', 'student@sutra.dev'],
    ['faculty', 'faculty@sutra.dev'],
    ['institution', 'institution@sutra.dev'],
    ['industry', 'industry@sutra.dev'],
    ['admin', 'admin@sutra.dev'],
  ]) {
    const data = await login(email);
    tokens[role] = data?.tokens?.accessToken;
    ids[role] = data?.user?.id;
    record('Auth', 'POST', '/api/auth/login', role, tokens[role] ? 200 : 500, 200, `login ${role}`);
    if (role === 'student') ctx.studentRefresh = data?.tokens?.refreshToken;
  }

  await call('GET', '/api/auth/me', { token: tokens.student, expect: 200, group: 'Auth', role: 'student' });
  await call('POST', '/api/auth/refresh', { body: { refreshToken: ctx.studentRefresh }, expect: 200, group: 'Auth', role: 'student' });
  await call('POST', '/api/auth/logout', { token: tokens.student, expect: 200, group: 'Auth', role: 'student' });
  await call('GET', '/api/auth/me', { expect: 401, group: 'Auth', role: 'public', note: 'no token -> 401' });

  // ---------- Profiles ----------
  await call('GET', '/api/profiles/me', { token: tokens.student, expect: 200, group: 'Profiles', role: 'student' });
  await call('GET', `/api/students/${ids.student}`, { token: tokens.student, expect: 200, group: 'Profiles', role: 'student' });
  await call('PUT', `/api/students/${ids.student}`, {
    token: tokens.student,
    body: { branch: 'CSE', semester: 7, skills: [{ name: 'React', level: 'advanced' }] },
    expect: 200,
    group: 'Profiles',
    role: 'student',
    note: 'update profile',
  });
  const voice = await call('POST', `/api/students/${ids.student}/voice-profile`, {
    token: tokens.student,
    body: { transcript: 'I know advanced Python and React, built a Node.js project, want to be a Backend Developer.' },
    expect: 200,
    group: 'Profiles',
    role: 'student',
    note: 'AI voice extraction',
  });
  ctx.voiceSource = voice.json?.data?.source;
  await call('GET', `/api/faculty/${ids.faculty}`, { token: tokens.faculty, expect: 200, group: 'Profiles', role: 'faculty' });
  await call('PUT', `/api/faculty/${ids.faculty}`, { token: tokens.faculty, body: { designation: 'Professor' }, expect: 200, group: 'Profiles', role: 'faculty' });
  await call('GET', `/api/institutions/${ids.institution}`, { token: tokens.institution, expect: 200, group: 'Profiles', role: 'institution' });
  await call('PUT', `/api/institutions/${ids.institution}`, { token: tokens.institution, body: { name: 'Demo Institute', departments: ['CSE', 'ECE'] }, expect: 200, group: 'Profiles', role: 'institution', note: 'name required on first create' });
  await call('GET', `/api/industries/${ids.industry}`, { token: tokens.industry, expect: 200, group: 'Profiles', role: 'industry' });
  await call('PUT', `/api/industries/${ids.industry}`, { token: tokens.industry, body: { sector: 'FinTech' }, expect: 200, group: 'Profiles', role: 'industry' });

  // ---------- Skills & Roles ----------
  const skillsList = await call('GET', '/api/skills', { token: tokens.student, expect: 200, group: 'Skills & Roles', role: 'student' });
  ids.skill = skillsList.json?.data?.skills?.[0]?.id;
  await call('GET', `/api/skills/${ids.skill}`, { token: tokens.student, expect: 200, group: 'Skills & Roles', role: 'student' });
  const norm = await call('POST', '/api/skills/normalize', {
    token: tokens.student,
    body: { skills: ['js', 'nodejs', 'golang'] },
    expect: 200,
    group: 'Skills & Roles',
    role: 'student',
    note: 'alias->canonical',
  });
  ctx.normMatched = (norm.json?.data?.normalized || []).filter((n) => n.matched).length;
  const newSkill = await call('POST', '/api/skills', {
    token: tokens.admin,
    body: { canonicalName: `TestSkill${rnd}`, category: 'technical', aliases: ['tskill'] },
    expect: 201,
    group: 'Skills & Roles',
    role: 'admin',
  });
  ids.newSkill = newSkill.json?.data?.skill?.id;
  await call('PUT', `/api/skills/${ids.newSkill}`, { token: tokens.admin, body: { description: 'x' }, expect: 200, group: 'Skills & Roles', role: 'admin' });
  await call('POST', '/api/skills', { token: tokens.student, body: { canonicalName: 'Nope' }, expect: 403, group: 'Skills & Roles', role: 'student', note: 'RBAC: student blocked' });
  await call('DELETE', `/api/skills/${ids.newSkill}`, { token: tokens.admin, expect: 200, group: 'Skills & Roles', role: 'admin' });
  const rolesList = await call('GET', '/api/roles', { token: tokens.student, expect: 200, group: 'Skills & Roles', role: 'student' });
  ids.role = rolesList.json?.data?.roles?.[0]?.id;
  await call('GET', `/api/roles/${ids.role}`, { token: tokens.student, expect: 200, group: 'Skills & Roles', role: 'student' });
  const newRole = await call('POST', '/api/roles', { token: tokens.admin, body: { title: `TestRole${rnd}`, mappedSkills: [{ name: 'React', level: 'advanced' }] }, expect: 201, group: 'Skills & Roles', role: 'admin' });
  ids.newRole = newRole.json?.data?.role?.id;
  await call('PUT', `/api/roles/${ids.newRole}`, { token: tokens.admin, body: { category: 'eng' }, expect: 200, group: 'Skills & Roles', role: 'admin' });
  await call('DELETE', `/api/roles/${ids.newRole}`, { token: tokens.admin, expect: 200, group: 'Skills & Roles', role: 'admin' });

  // ---------- Assessments ----------
  const aList = await call('GET', '/api/assessments', { token: tokens.student, expect: 200, group: 'Assessments', role: 'student' });
  ids.assessment = aList.json?.data?.assessments?.[0]?.id;
  const aGet = await call('GET', `/api/assessments/${ids.assessment}`, { token: tokens.student, expect: 200, group: 'Assessments', role: 'student', note: 'answers hidden' });
  const qs = aGet.json?.data?.assessment?.questions || [];
  await call('POST', '/api/assessments/questions', {
    token: tokens.admin,
    body: { text: 'Q?', skill: 'React', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }], correctKeys: ['A'] },
    expect: 201,
    group: 'Assessments',
    role: 'admin',
  });
  await call('GET', '/api/assessments/questions', { token: tokens.admin, expect: 200, group: 'Assessments', role: 'admin' });
  // Submit an attempt answering the first option of each question.
  const answers = qs.map((q) => ({ questionId: q.id, selected: [q.options?.[0]?.key].filter(Boolean) }));
  const submit = await call('POST', `/api/assessments/${ids.assessment}/submit`, {
    token: tokens.student,
    body: { answers },
    expect: 201,
    group: 'Assessments',
    role: 'student',
    note: 'submit + score',
  });
  ids.attempt = submit.json?.data?.attempt?.id;
  ctx.attemptScore = submit.json?.data?.attempt?.score;
  await call('GET', `/api/assessments/results/${ids.attempt}`, { token: tokens.student, expect: 200, group: 'Assessments', role: 'student' });
  await call('GET', '/api/assessments/attempts/me', { token: tokens.student, expect: 200, group: 'Assessments', role: 'student' });
  const newA = await call('POST', '/api/assessments', { token: tokens.admin, body: { title: `TmpA${rnd}`, skillSet: ['React'] }, expect: 201, group: 'Assessments', role: 'admin' });
  ids.newAssessment = newA.json?.data?.assessment?.id;
  await call('PUT', `/api/assessments/${ids.newAssessment}`, { token: tokens.admin, body: { passingScore: 60 }, expect: 200, group: 'Assessments', role: 'admin' });
  await call('DELETE', `/api/assessments/${ids.newAssessment}`, { token: tokens.admin, expect: 200, group: 'Assessments', role: 'admin' });

  // ---------- Skill Gap ----------
  await call('GET', `/api/students/${ids.student}/skill-gaps?role=Frontend%20Developer`, { token: tokens.student, expect: 200, group: 'Skill Gap', role: 'student' });
  await call('GET', `/api/students/${ids.student}/readiness?role=Frontend%20Developer`, { token: tokens.student, expect: 200, group: 'Skill Gap', role: 'student' });
  await call('POST', '/api/skill-gap/analyze', { token: tokens.student, body: { role: 'Frontend Developer' }, expect: 200, group: 'Skill Gap', role: 'student' });

  // ---------- Opportunities ----------
  await call('GET', '/api/opportunities', { token: tokens.student, expect: 200, group: 'Opportunities', role: 'student' });
  // Create + publish a fresh opportunity used for the apply flow (avoids the
  // one-application-per-opportunity constraint across repeated test runs).
  const appOpp = await call('POST', '/api/opportunities', {
    token: tokens.industry,
    body: { type: 'internship', title: `AppOpp${rnd}`, requiredSkills: [{ name: 'React', level: 'advanced', weight: 3 }], location: 'Remote', workMode: 'remote' },
    expect: 201,
    group: 'Opportunities',
    role: 'industry',
  });
  ids.appOpp = appOpp.json?.data?.opportunity?.id;
  await call('GET', `/api/opportunities/${ids.appOpp}`, { token: tokens.student, expect: 200, group: 'Opportunities', role: 'student' });
  await call('PUT', `/api/opportunities/${ids.appOpp}`, { token: tokens.industry, body: { stipend: 10000 }, expect: 200, group: 'Opportunities', role: 'industry' });
  const pub = await call('PATCH', `/api/opportunities/${ids.appOpp}/status`, { token: tokens.industry, body: { status: 'published' }, expect: 200, group: 'Opportunities', role: 'industry', note: 'verified company can publish' });
  ctx.publishBadge = pub.json?.data?.opportunity?.verificationBadge;
  // Separate throwaway draft to exercise DELETE.
  const draftOpp = await call('POST', '/api/opportunities', { token: tokens.industry, body: { type: 'job', title: `DraftOpp${rnd}` }, expect: 201, group: 'Opportunities', role: 'industry' });
  await call('DELETE', `/api/opportunities/${draftOpp.json?.data?.opportunity?.id}`, { token: tokens.industry, expect: 200, group: 'Opportunities', role: 'industry' });

  // ---------- Learning ----------
  await call('GET', '/api/learning', { token: tokens.student, expect: 200, group: 'Learning', role: 'student' });
  const newProg = await call('POST', '/api/learning', { token: tokens.industry, body: { title: `TmpProg${rnd}`, skillsCovered: [{ name: 'Testing', level: 'intermediate' }] }, expect: 201, group: 'Learning', role: 'industry' });
  ids.program = newProg.json?.data?.program?.id;
  await call('GET', `/api/learning/${ids.program}`, { token: tokens.student, expect: 200, group: 'Learning', role: 'student' });
  await call('PUT', `/api/learning/${ids.program}`, { token: tokens.industry, body: { duration: '2 weeks' }, expect: 200, group: 'Learning', role: 'industry' });
  await call('POST', `/api/learning/${ids.program}/enroll`, { token: tokens.student, expect: 201, group: 'Learning', role: 'student' });
  await call('PATCH', `/api/learning/${ids.program}/progress`, { token: tokens.student, body: { progress: 50 }, expect: 200, group: 'Learning', role: 'student' });
  await call('POST', `/api/learning/${ids.program}/complete`, { token: tokens.student, expect: 200, group: 'Learning', role: 'student', note: 'triggers PROGRAM_COMPLETION notification' });
  await call('GET', '/api/learning/me/enrollments', { token: tokens.student, expect: 200, group: 'Learning', role: 'student' });
  await call('POST', '/api/learning/recommend', { token: tokens.student, body: { role: 'Frontend Developer' }, expect: 200, group: 'Learning', role: 'student', note: 'gap-based recommendations' });

  // ---------- Matching ----------
  const matchOpp = await call('POST', '/api/matching/opportunities', { token: tokens.student, body: { limit: 5 }, expect: 200, group: 'Matching', role: 'student' });
  ctx.matchCount = matchOpp.json?.data?.recommendations?.length;
  await call('POST', '/api/matching/candidates', { token: tokens.industry, body: { opportunityId: ids.appOpp, limit: 5 }, expect: 200, group: 'Matching', role: 'industry' });

  // ---------- Applications ----------
  const apply = await call('POST', `/api/opportunities/${ids.appOpp}/apply`, { token: tokens.student, body: { coverLetter: 'Keen to join' }, expect: 201, group: 'Applications', role: 'student' });
  ids.application = apply.json?.data?.application?.id;
  ctx.appMatch = apply.json?.data?.application?.matchScore;
  await call('GET', '/api/applications/me', { token: tokens.student, expect: 200, group: 'Applications', role: 'student' });
  await call('GET', `/api/applications/${ids.application}`, { token: tokens.student, expect: 200, group: 'Applications', role: 'student' });
  await call('GET', `/api/applications/opportunity/${ids.appOpp}`, { token: tokens.industry, expect: 200, group: 'Applications', role: 'industry' });
  await call('PATCH', `/api/applications/${ids.application}/status`, { token: tokens.industry, body: { status: 'shortlisted', note: 'good fit' }, expect: 200, group: 'Applications', role: 'industry', note: 'triggers notification+audit' });
  await call('POST', `/api/applications/${ids.application}/notes`, { token: tokens.industry, body: { note: 'called candidate' }, expect: 201, group: 'Applications', role: 'industry' });
  const stage = await call('POST', `/api/applications/${ids.application}/interviews`, { token: tokens.industry, body: { name: 'Round 1', mode: 'remote' }, expect: 201, group: 'Applications', role: 'industry' });
  ids.stage = stage.json?.data?.application?.interviewStages?.[0]?.id;
  await call('PATCH', `/api/applications/${ids.application}/interviews/${ids.stage}`, { token: tokens.industry, body: { status: 'completed', rating: 8 }, expect: 200, group: 'Applications', role: 'industry' });
  await call('POST', `/api/applications/${ids.application}/withdraw`, { token: tokens.student, expect: 200, group: 'Applications', role: 'student' });

  // ---------- Portfolio ----------
  const item = await call('POST', '/api/portfolio', { token: tokens.student, body: { type: 'project', title: 'My Project', skills: ['React'], visibility: 'public' }, expect: 201, group: 'Portfolio', role: 'student' });
  ids.item = item.json?.data?.item?.id;
  await call('GET', '/api/portfolio/me', { token: tokens.student, expect: 200, group: 'Portfolio', role: 'student', note: 'list my items' });
  await call('GET', `/api/portfolio/${ids.item}`, { token: tokens.student, expect: 200, group: 'Portfolio', role: 'student' });
  await call('PUT', `/api/portfolio/${ids.item}`, { token: tokens.student, body: { description: 'updated' }, expect: 200, group: 'Portfolio', role: 'student' });
  await call('PATCH', `/api/portfolio/${ids.item}/verify`, { token: tokens.institution, body: { status: 'verified' }, expect: 200, group: 'Portfolio', role: 'institution', note: 'verifier + audit' });
  await call('GET', `/api/portfolio/share/${ids.student}`, { expect: 200, group: 'Portfolio', role: 'public', note: 'public share view' });
  const resume = await call('POST', '/api/portfolio/resume', { token: tokens.student, expect: 200, group: 'Portfolio', role: 'student', note: 'AI resume gen' });
  ctx.resumeSource = resume.json?.data?.source;
  await call('DELETE', `/api/portfolio/${ids.item}`, { token: tokens.student, expect: 200, group: 'Portfolio', role: 'student' });

  // ---------- Documents (Cloudinary) ----------
  const form = new FormData();
  form.append('type', 'certificate');
  form.append('title', 'Test Cert');
  form.append('access', 'public');
  form.append('file', new Blob([Buffer.from('SUTRA test document content')], { type: 'text/plain' }), 'test.txt');
  const doc = await call('POST', '/api/documents', { token: tokens.student, form, expect: 201, group: 'Documents', role: 'student', note: 'upload -> Cloudinary' });
  ids.doc = doc.json?.data?.document?.id;
  ctx.docProvider = doc.json?.data?.document?.provider;
  await call('GET', '/api/documents/me', { token: tokens.student, expect: 200, group: 'Documents', role: 'student' });
  await call('GET', `/api/documents/${ids.doc}`, { token: tokens.student, expect: 200, group: 'Documents', role: 'student' });
  await call('PATCH', `/api/documents/${ids.doc}/verify`, { token: tokens.institution, body: { status: 'verified' }, expect: 200, group: 'Documents', role: 'institution' });
  await call('DELETE', `/api/documents/${ids.doc}`, { token: tokens.student, expect: 200, group: 'Documents', role: 'student', note: 'removes from Cloudinary' });

  // ---------- Analytics ----------
  await call('GET', '/api/analytics/skills', { token: tokens.student, expect: 200, group: 'Analytics', role: 'student' });
  await call('POST', '/api/analytics/skills/recompute', { token: tokens.admin, expect: 200, group: 'Analytics', role: 'admin' });
  await call('GET', '/api/analytics/institution', { token: tokens.institution, expect: 200, group: 'Analytics', role: 'institution' });
  await call('GET', '/api/analytics/industry', { token: tokens.industry, expect: 200, group: 'Analytics', role: 'industry' });
  await call('GET', '/api/analytics/student', { token: tokens.student, expect: 200, group: 'Analytics', role: 'student' });
  await call('GET', `/api/analytics/student/${ids.student}`, { token: tokens.admin, expect: 200, group: 'Analytics', role: 'admin' });

  // ---------- Mentorship ----------
  await call('GET', '/api/mentorship/mentors', { token: tokens.student, expect: 200, group: 'Mentorship', role: 'student' });
  const m = await call('POST', '/api/mentorship', { token: tokens.student, body: { mentorId: ids.faculty, topic: 'Career guidance' }, expect: 201, group: 'Mentorship', role: 'student', note: 'notifies mentor' });
  ids.mentorship = m.json?.data?.mentorship?.id;
  await call('GET', '/api/mentorship/me', { token: tokens.faculty, expect: 200, group: 'Mentorship', role: 'faculty' });
  await call('PATCH', `/api/mentorship/${ids.mentorship}/respond`, { token: tokens.faculty, body: { status: 'accepted' }, expect: 200, group: 'Mentorship', role: 'faculty' });
  await call('PATCH', `/api/mentorship/${ids.mentorship}/complete`, { token: tokens.faculty, expect: 200, group: 'Mentorship', role: 'faculty' });

  // ---------- Academician Opportunities ----------
  const ao = await call('POST', '/api/academician-opportunities', { token: tokens.industry, body: { type: 'fdp', title: `FDP${rnd}`, areas: ['ML'] }, expect: 201, group: 'Academician Opportunities', role: 'industry' });
  ids.ao = ao.json?.data?.opportunity?.id;
  await call('GET', '/api/academician-opportunities', { token: tokens.faculty, expect: 200, group: 'Academician Opportunities', role: 'faculty' });
  await call('GET', `/api/academician-opportunities/${ids.ao}`, { token: tokens.faculty, expect: 200, group: 'Academician Opportunities', role: 'faculty' });
  await call('PUT', `/api/academician-opportunities/${ids.ao}`, { token: tokens.industry, body: { location: 'Online' }, expect: 200, group: 'Academician Opportunities', role: 'industry' });
  await call('POST', `/api/academician-opportunities/${ids.ao}/interest`, { token: tokens.faculty, body: { message: 'Interested' }, expect: 201, group: 'Academician Opportunities', role: 'faculty' });
  await call('GET', `/api/academician-opportunities/${ids.ao}/interested`, { token: tokens.industry, expect: 200, group: 'Academician Opportunities', role: 'industry' });
  await call('DELETE', `/api/academician-opportunities/${ids.ao}`, { token: tokens.industry, expect: 200, group: 'Academician Opportunities', role: 'industry' });

  // ---------- Notifications ----------
  const notifs = await call('GET', '/api/notifications', { token: tokens.student, expect: 200, group: 'Notifications', role: 'student' });
  ctx.notifCount = notifs.json?.data?.notifications?.length;
  ids.notif = notifs.json?.data?.notifications?.[0]?.id;
  await call('GET', '/api/notifications/unread-count', { token: tokens.student, expect: 200, group: 'Notifications', role: 'student' });
  if (ids.notif) await call('PATCH', `/api/notifications/${ids.notif}/read`, { token: tokens.student, expect: 200, group: 'Notifications', role: 'student' });
  await call('POST', '/api/notifications/read-all', { token: tokens.student, expect: 200, group: 'Notifications', role: 'student' });
  if (ids.notif) await call('DELETE', `/api/notifications/${ids.notif}`, { token: tokens.student, expect: 200, group: 'Notifications', role: 'student' });

  // ---------- Audit ----------
  const audit = await call('GET', '/api/audit', { token: tokens.admin, expect: 200, group: 'Audit', role: 'admin' });
  ctx.auditCount = audit.json?.data?.logs?.length;
  await call('GET', '/api/audit', { token: tokens.student, expect: 403, group: 'Audit', role: 'student', note: 'RBAC: admin only' });

  // ---------- Not found ----------
  await call('GET', '/api/nope', { token: tokens.student, expect: 404, group: 'Misc', role: 'student', note: 'unknown route' });

  await writeReport();
}

async function writeReport() {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  const groups = [...new Set(results.map((r) => r.group))];

  let md = `# SUTRA Backend — API Test Report\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `Environment: MongoDB Atlas connected, AI = Gemini (\`${process.env.GEMINI_MODEL || 'configured'}\`), Storage = Cloudinary, Email = disabled (intentional).\n\n`;
  md += `**Total: ${results.length} | Passed: ${pass} | Failed: ${fail}**\n\n`;

  md += `## Notable runtime observations\n\n`;
  md += `- Voice profile extraction source: \`${ctx.voiceSource || 'n/a'}\` (gemini = live AI, fallback = rule-based)\n`;
  md += `- Resume generation source: \`${ctx.resumeSource || 'n/a'}\`\n`;
  md += `- Skill normalization matched-to-canonical count (js/nodejs/golang): ${ctx.normMatched ?? 'n/a'} / 3\n`;
  md += `- Assessment attempt score: ${ctx.attemptScore ?? 'n/a'}%\n`;
  md += `- Application match score: ${ctx.appMatch ?? 'n/a'}%\n`;
  md += `- Opportunity match recommendations returned: ${ctx.matchCount ?? 'n/a'}\n`;
  md += `- Published opportunity verification badge: ${ctx.publishBadge ?? 'n/a'}\n`;
  md += `- Document storage provider: \`${ctx.docProvider || 'n/a'}\`\n`;
  md += `- Notifications generated for student: ${ctx.notifCount ?? 'n/a'}\n`;
  md += `- Audit log entries visible to admin: ${ctx.auditCount ?? 'n/a'}\n\n`;

  for (const g of groups) {
    md += `## ${g}\n\n`;
    md += `| Method | Endpoint | Role | Status | Expected | Result | Notes |\n`;
    md += `|--------|----------|------|--------|----------|--------|-------|\n`;
    for (const r of results.filter((x) => x.group === g)) {
      md += `| ${r.method} | \`${r.path}\` | ${r.role} | ${r.status} | ${r.expect} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.note} |\n`;
    }
    md += `\n`;
  }

  await writeFile('API_TEST_REPORT.md', md, 'utf8');
  console.log(`\n=== DONE: ${pass}/${results.length} passed, ${fail} failed. Report written to API_TEST_REPORT.md ===`);
}

run().catch((err) => {
  console.error('Harness error:', err);
  process.exit(1);
});
