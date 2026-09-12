/**
 * Deterministic, rule-based fallbacks used whenever no LLM API key is configured
 * (or a provider call fails). Keeps every AI-backed feature functional offline.
 */

// A modest built-in skill dictionary for keyword extraction. Batch 3's taxonomy
// can supersede/expand this, but this keeps the module self-contained.
// Comprehensive skill dictionary with canonical display capitalization
const CANONICAL_TECH_SKILLS = [
  { match: 'javascript', name: 'JavaScript' },
  { match: 'typescript', name: 'TypeScript' },
  { match: 'python', name: 'Python' },
  { match: 'java', name: 'Java' },
  { match: 'c++', name: 'C++' },
  { match: 'c#', name: 'C#' },
  { match: 'c language', name: 'C' },
  { match: 'go', name: 'Go' },
  { match: 'golang', name: 'Go' },
  { match: 'rust', name: 'Rust' },
  { match: 'php', name: 'PHP' },
  { match: 'ruby', name: 'Ruby' },
  { match: 'kotlin', name: 'Kotlin' },
  { match: 'swift', name: 'Swift' },
  { match: 'dart', name: 'Dart' },
  { match: 'r language', name: 'R' },
  { match: 'react', name: 'React' },
  { match: 'react.js', name: 'React' },
  { match: 'react native', name: 'React Native' },
  { match: 'next.js', name: 'Next.js' },
  { match: 'nextjs', name: 'Next.js' },
  { match: 'angular', name: 'Angular' },
  { match: 'vue', name: 'Vue.js' },
  { match: 'vue.js', name: 'Vue.js' },
  { match: 'svelte', name: 'Svelte' },
  { match: 'node.js', name: 'Node.js' },
  { match: 'nodejs', name: 'Node.js' },
  { match: 'express', name: 'Express.js' },
  { match: 'express.js', name: 'Express.js' },
  { match: 'fastapi', name: 'FastAPI' },
  { match: 'django', name: 'Django' },
  { match: 'flask', name: 'Flask' },
  { match: 'spring', name: 'Spring Boot' },
  { match: 'spring boot', name: 'Spring Boot' },
  { match: '.net', name: '.NET' },
  { match: 'dotnet', name: '.NET' },
  { match: 'laravel', name: 'Laravel' },
  { match: 'html', name: 'HTML5' },
  { match: 'html5', name: 'HTML5' },
  { match: 'css', name: 'CSS3' },
  { match: 'css3', name: 'CSS3' },
  { match: 'tailwind', name: 'Tailwind CSS' },
  { match: 'tailwind css', name: 'Tailwind CSS' },
  { match: 'sass', name: 'Sass' },
  { match: 'bootstrap', name: 'Bootstrap' },
  { match: 'redux', name: 'Redux' },
  { match: 'vite', name: 'Vite' },
  { match: 'webpack', name: 'Webpack' },
  { match: 'mongodb', name: 'MongoDB' },
  { match: 'postgresql', name: 'PostgreSQL' },
  { match: 'postgres', name: 'PostgreSQL' },
  { match: 'mysql', name: 'MySQL' },
  { match: 'redis', name: 'Redis' },
  { match: 'sqlite', name: 'SQLite' },
  { match: 'firebase', name: 'Firebase' },
  { match: 'prisma', name: 'Prisma' },
  { match: 'mongoose', name: 'Mongoose' },
  { match: 'sql', name: 'SQL' },
  { match: 'nosql', name: 'NoSQL' },
  { match: 'docker', name: 'Docker' },
  { match: 'kubernetes', name: 'Kubernetes' },
  { match: 'aws', name: 'AWS' },
  { match: 'amazon web services', name: 'AWS' },
  { match: 'azure', name: 'Microsoft Azure' },
  { match: 'gcp', name: 'Google Cloud Platform' },
  { match: 'git', name: 'Git' },
  { match: 'github', name: 'GitHub' },
  { match: 'gitlab', name: 'GitLab' },
  { match: 'ci/cd', name: 'CI/CD' },
  { match: 'linux', name: 'Linux' },
  { match: 'bash', name: 'Bash' },
  { match: 'machine learning', name: 'Machine Learning' },
  { match: 'deep learning', name: 'Deep Learning' },
  { match: 'artificial intelligence', name: 'Artificial Intelligence' },
  { match: 'nlp', name: 'NLP' },
  { match: 'computer vision', name: 'Computer Vision' },
  { match: 'tensorflow', name: 'TensorFlow' },
  { match: 'pytorch', name: 'PyTorch' },
  { match: 'pandas', name: 'Pandas' },
  { match: 'numpy', name: 'NumPy' },
  { match: 'scikit-learn', name: 'Scikit-Learn' },
  { match: 'opencv', name: 'OpenCV' },
  { match: 'rest', name: 'REST APIs' },
  { match: 'rest api', name: 'REST APIs' },
  { match: 'restful', name: 'REST APIs' },
  { match: 'graphql', name: 'GraphQL' },
  { match: 'microservices', name: 'Microservices' },
  { match: 'system design', name: 'System Design' },
  { match: 'data structures', name: 'Data Structures' },
  { match: 'algorithms', name: 'Algorithms' },
  { match: 'oop', name: 'Object-Oriented Programming' },
  { match: 'testing', name: 'Unit Testing' },
  { match: 'jest', name: 'Jest' },
  { match: 'cypress', name: 'Cypress' },
  { match: 'postman', name: 'Postman' },
  { match: 'figma', name: 'Figma' },
  { match: 'flutter', name: 'Flutter' },
  { match: 'cybersecurity', name: 'Cybersecurity' },
  { match: 'blockchain', name: 'Blockchain' },
  { match: 'solidity', name: 'Solidity' },
];

const CANONICAL_SOFT_SKILLS = [
  { match: 'communication', name: 'Communication' },
  { match: 'teamwork', name: 'Teamwork' },
  { match: 'leadership', name: 'Leadership' },
  { match: 'problem solving', name: 'Problem Solving' },
  { match: 'time management', name: 'Time Management' },
  { match: 'adaptability', name: 'Adaptability' },
  { match: 'creativity', name: 'Creativity' },
  { match: 'critical thinking', name: 'Critical Thinking' },
  { match: 'collaboration', name: 'Collaboration' },
  { match: 'presentation', name: 'Presentation' },
  { match: 'agile', name: 'Agile Methodology' },
  { match: 'analytical thinking', name: 'Analytical Thinking' },
  { match: 'conflict resolution', name: 'Conflict Resolution' },
];

const ROLE_KEYWORDS = [
  'frontend developer', 'backend developer', 'full stack developer', 'software engineer',
  'data scientist', 'data analyst', 'machine learning engineer', 'devops engineer',
  'mobile developer', 'ui/ux designer', 'product manager', 'qa engineer', 'cloud engineer',
  'system architect', 'security engineer',
];

const LEVEL_HINTS = [
  { level: 'expert', words: ['expert', 'mastery', 'lead', 'architect', 'specialist'] },
  { level: 'advanced', words: ['advanced', 'proficient', 'strong', 'experienced', 'built production', 'skilled'] },
  { level: 'beginner', words: ['beginner', 'basic', 'learning', 'novice', 'familiar', 'exploring'] },
];

function detectLevel(text) {
  const lower = text.toLowerCase();
  for (const { level, words } of LEVEL_HINTS) {
    if (words.some((w) => lower.includes(w))) return level;
  }
  return 'intermediate';
}

function findMatchesCanonical(text, items) {
  const lower = text.toLowerCase();
  const seen = new Set();
  const results = [];
  for (const item of items) {
    const term = item.match;
    const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    if (re.test(lower)) {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        results.push(item.name);
      }
    }
  }
  return results;
}

function findMatches(text, dictionary) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const term of dictionary) {
    const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
    if (re.test(lower)) found.add(term);
  }
  return [...found];
}

export function fallbackExtractProfile(transcript = '') {
  const level = detectLevel(transcript);
  const skills = findMatchesCanonical(transcript, CANONICAL_TECH_SKILLS).map((name) => ({ name, level }));
  const softSkills = findMatchesCanonical(transcript, CANONICAL_SOFT_SKILLS).map((name) => ({ name, level: 'intermediate' }));
  const targetRoles = findMatches(transcript, ROLE_KEYWORDS).map((r) =>
    r.replace(/\b\w/g, (c) => c.toUpperCase())
  );

  // Extract lightweight projects if mentioned (e.g. "built ... with ...", "project called ...")
  const projects = [];
  const projectRegex = /(?:built|developed|created|worked on|architected)\s+(?:an?\s+)?([a-zA-Z0-9\s\-]+?)(?:\s+(?:using|with|in)\s+([a-zA-Z0-9,\s]+))?(?:\.|\n|$)/gi;
  let match;
  while ((match = projectRegex.exec(transcript)) !== null) {
    const rawTitle = match[1]?.trim();
    if (rawTitle && rawTitle.length > 2 && rawTitle.length < 60) {
      const rawTech = match[2] || '';
      const techStack = findMatchesCanonical(rawTech, CANONICAL_TECH_SKILLS);
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      if (!projects.some((p) => p.title.toLowerCase() === title.toLowerCase())) {
        projects.push({
          title,
          description: `Engineered ${title}${techStack.length ? ` using ${techStack.join(', ')}` : ''}.`,
          techStack,
        });
      }
    }
  }

  // Extract lightweight certifications if mentioned (e.g. "certified in ...", "AWS certified", "Coursera")
  const certifications = [];
  const certKeywords = [
    { match: 'aws certified', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' },
    { match: 'google cloud', name: 'Google Cloud Certified', issuer: 'Google Cloud' },
    { match: 'meta front-end', name: 'Meta Front-End Developer', issuer: 'Meta' },
    { match: 'coursera', name: 'Professional Specialization Certificate', issuer: 'Coursera' },
    { match: 'hackerrank', name: 'Problem Solving & Skills Certification', issuer: 'HackerRank' },
  ];
  for (const c of certKeywords) {
    if (transcript.toLowerCase().includes(c.match)) {
      certifications.push({ name: c.name, issuer: c.issuer });
    }
  }

  const summary = transcript.trim().slice(0, 280);

  return {
    skills,
    softSkills,
    projects,
    certifications,
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
