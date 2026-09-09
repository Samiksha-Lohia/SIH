/**
 * Deterministic, rule-based fallbacks used whenever no LLM API key is configured
 * (or a provider call fails). Keeps every AI-backed feature functional offline.
 */

// A modest built-in skill dictionary for keyword extraction. Batch 3's taxonomy
// can supersede/expand this, but this keeps the module self-contained.
const TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
  'html', 'css', 'tailwind', 'sass', 'bootstrap',
  'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'sqlite', 'sql',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'ci/cd', 'linux',
  'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'rest', 'graphql', 'testing', 'jest', 'cypress', 'data structures', 'algorithms',
];

const SOFT_SKILLS = [
  'communication', 'teamwork', 'leadership', 'problem solving', 'time management',
  'adaptability', 'creativity', 'critical thinking', 'collaboration', 'presentation',
];

const ROLE_KEYWORDS = [
  'frontend developer', 'backend developer', 'full stack developer', 'software engineer',
  'data scientist', 'data analyst', 'machine learning engineer', 'devops engineer',
  'mobile developer', 'ui/ux designer', 'product manager', 'qa engineer', 'cloud engineer',
];

const LEVEL_HINTS = [
  { level: 'expert', words: ['expert', 'mastery', 'lead', 'architect'] },
  { level: 'advanced', words: ['advanced', 'proficient', 'strong', 'experienced'] },
  { level: 'beginner', words: ['beginner', 'basic', 'learning', 'novice', 'familiar'] },
];

function detectLevel(text) {
  const lower = text.toLowerCase();
  for (const { level, words } of LEVEL_HINTS) {
    if (words.some((w) => lower.includes(w))) return level;
  }
  return 'intermediate';
}

function findMatches(text, dictionary) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const term of dictionary) {
    // word-ish boundary check to avoid partial noise
    const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    if (re.test(lower)) found.add(term);
  }
  return [...found];
}

export function fallbackExtractProfile(transcript = '') {
  const level = detectLevel(transcript);
  const skills = findMatches(transcript, TECH_SKILLS).map((name) => ({ name, level }));
  const softSkills = findMatches(transcript, SOFT_SKILLS).map((name) => ({ name, level: 'intermediate' }));
  const targetRoles = findMatches(transcript, ROLE_KEYWORDS);

  const summary = transcript.trim().slice(0, 280);

  return {
    skills,
    softSkills,
    projects: [],
    certifications: [],
    careerGoals: { targetRoles, preferredIndustries: [], summary },
    education: [],
    _meta: { source: 'fallback' },
  };
}

export function fallbackGenerateResume(profile = {}) {
  const name = profile.name || 'Candidate';
  const targetRole = profile.careerGoals?.targetRoles?.[0] || 'Software Professional';
  const skillsList = (profile.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);

  const summary = profile.careerGoals?.summary
    ? profile.careerGoals.summary
    : `${name} is an aspiring ${targetRole} with proven competencies in ${skillsList.slice(0, 4).join(', ') || 'modern software technologies'}. Dedicated to engineering clean, reliable solutions with strong analytical thinking and proactive collaboration.`;

  const projects = (profile.projects || []).map((p) => ({
    title: p.title || 'Featured Project',
    description: p.description
      ? `Engineered ${p.title} leveraging ${(p.techStack || []).join(', ') || 'modern technologies'}. ${p.description}`
      : `Architected and implemented ${p.title} utilizing ${(p.techStack || []).join(', ') || 'industry-standard tools'}, adhering to modern design principles and engineering standards.`,
  }));

  return {
    summary,
    projects,
    _meta: { source: 'fallback' },
  };
}

export function fallbackMatchExplanation({ matched = [], missing = [], score = 0 }) {
  const parts = [];
  parts.push(`Overall compatibility is ${score}%.`);
  if (matched.length) parts.push(`Strong alignment on ${matched.slice(0, 5).join(', ')}.`);
  if (missing.length) parts.push(`Gaps remain in ${missing.slice(0, 5).join(', ')}; targeted learning is recommended before applying.`);
  else parts.push('No major skill gaps detected.');
  return parts.join(' ');
}
