import { SKILL_CATEGORY, PROFICIENCY } from '../config/constants.js';

const T = SKILL_CATEGORY.TECHNICAL;
const TOOLS = SKILL_CATEGORY.TOOLS;
const DOMAIN = SKILL_CATEGORY.DOMAIN;
const SOFT = SKILL_CATEGORY.SOFT;
const COMM = SKILL_CATEGORY.COMMUNICATION;
const LEAD = SKILL_CATEGORY.LEADERSHIP;

/**
 * Seed skill taxonomy. Aliases capture common synonyms/spellings so the
 * normalization layer can collapse them to a canonical name.
 */
export const SKILLS = [
  { canonicalName: 'JavaScript', category: T, aliases: ['js', 'ecmascript', 'java script'] },
  { canonicalName: 'TypeScript', category: T, aliases: ['ts'] },
  { canonicalName: 'Python', category: T, aliases: ['py'] },
  { canonicalName: 'Java', category: T, aliases: [] },
  { canonicalName: 'C++', category: T, aliases: ['cpp', 'cplusplus'] },
  { canonicalName: 'C#', category: T, aliases: ['csharp', 'c sharp'] },
  { canonicalName: 'Go', category: T, aliases: ['golang'] },
  { canonicalName: 'React', category: T, aliases: ['react.js', 'reactjs'] },
  { canonicalName: 'Angular', category: T, aliases: ['angularjs'] },
  { canonicalName: 'Vue', category: T, aliases: ['vue.js', 'vuejs'] },
  { canonicalName: 'Node.js', category: T, aliases: ['node', 'nodejs'] },
  { canonicalName: 'Express', category: T, aliases: ['express.js', 'expressjs'] },
  { canonicalName: 'Django', category: T, aliases: [] },
  { canonicalName: 'Spring Boot', category: T, aliases: ['spring'] },
  { canonicalName: 'HTML', category: T, aliases: ['html5'] },
  { canonicalName: 'CSS', category: T, aliases: ['css3'] },
  { canonicalName: 'Tailwind CSS', category: T, aliases: ['tailwind', 'tailwindcss'] },
  { canonicalName: 'MongoDB', category: T, aliases: ['mongo'] },
  { canonicalName: 'PostgreSQL', category: T, aliases: ['postgres', 'psql'] },
  { canonicalName: 'MySQL', category: T, aliases: [] },
  { canonicalName: 'SQL', category: T, aliases: [] },
  { canonicalName: 'Redis', category: T, aliases: [] },
  { canonicalName: 'REST APIs', category: T, aliases: ['rest', 'restful', 'rest api'] },
  { canonicalName: 'GraphQL', category: T, aliases: [] },
  { canonicalName: 'Machine Learning', category: DOMAIN, aliases: ['ml'] },
  { canonicalName: 'Deep Learning', category: DOMAIN, aliases: ['dl'] },
  { canonicalName: 'Natural Language Processing', category: DOMAIN, aliases: ['nlp'] },
  { canonicalName: 'TensorFlow', category: TOOLS, aliases: [] },
  { canonicalName: 'PyTorch', category: TOOLS, aliases: [] },
  { canonicalName: 'Pandas', category: TOOLS, aliases: [] },
  { canonicalName: 'Data Structures', category: DOMAIN, aliases: ['dsa', 'data structures and algorithms'] },
  { canonicalName: 'Algorithms', category: DOMAIN, aliases: [] },
  { canonicalName: 'Docker', category: TOOLS, aliases: [] },
  { canonicalName: 'Kubernetes', category: TOOLS, aliases: ['k8s'] },
  { canonicalName: 'AWS', category: TOOLS, aliases: ['amazon web services'] },
  { canonicalName: 'Azure', category: TOOLS, aliases: ['microsoft azure'] },
  { canonicalName: 'Git', category: TOOLS, aliases: ['github', 'version control'] },
  { canonicalName: 'CI/CD', category: TOOLS, aliases: ['cicd', 'continuous integration'] },
  { canonicalName: 'Testing', category: T, aliases: ['unit testing', 'software testing'] },
  { canonicalName: 'Linux', category: TOOLS, aliases: ['unix'] },
  { canonicalName: 'Communication', category: COMM, aliases: ['verbal communication'] },
  { canonicalName: 'Teamwork', category: SOFT, aliases: ['collaboration', 'team work'] },
  { canonicalName: 'Problem Solving', category: SOFT, aliases: ['problem-solving'] },
  { canonicalName: 'Leadership', category: LEAD, aliases: [] },
  { canonicalName: 'Time Management', category: SOFT, aliases: [] },
  { canonicalName: 'Critical Thinking', category: SOFT, aliases: [] },
  { canonicalName: 'Adaptability', category: SOFT, aliases: [] },
  { canonicalName: 'Presentation', category: COMM, aliases: ['presentation skills'] },
];

const { BEGINNER, INTERMEDIATE, ADVANCED } = PROFICIENCY;

/**
 * Seed roles with required/preferred skills and weights, so skill-gap and
 * matching have a competency model to work against out of the box.
 */
export const ROLES_SEED = [
  {
    title: 'Frontend Developer',
    category: 'engineering',
    description: 'Builds user-facing web interfaces.',
    mappedSkills: [
      { name: 'JavaScript', level: ADVANCED, required: true, weight: 3 },
      { name: 'React', level: ADVANCED, required: true, weight: 3 },
      { name: 'HTML', level: INTERMEDIATE, required: true, weight: 1 },
      { name: 'CSS', level: INTERMEDIATE, required: true, weight: 1 },
      { name: 'Git', level: INTERMEDIATE, required: true, weight: 1 },
      { name: 'Testing', level: INTERMEDIATE, required: false, weight: 2 },
      { name: 'TypeScript', level: INTERMEDIATE, required: false, weight: 2 },
    ],
  },
  {
    title: 'Backend Developer',
    category: 'engineering',
    description: 'Builds server-side services and APIs.',
    mappedSkills: [
      { name: 'Node.js', level: ADVANCED, required: true, weight: 3 },
      { name: 'Express', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'MongoDB', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'REST APIs', level: ADVANCED, required: true, weight: 2 },
      { name: 'SQL', level: INTERMEDIATE, required: false, weight: 1 },
      { name: 'Docker', level: BEGINNER, required: false, weight: 1 },
      { name: 'Git', level: INTERMEDIATE, required: true, weight: 1 },
    ],
  },
  {
    title: 'Full Stack Developer',
    category: 'engineering',
    description: 'Works across frontend and backend.',
    mappedSkills: [
      { name: 'JavaScript', level: ADVANCED, required: true, weight: 3 },
      { name: 'React', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'Node.js', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'MongoDB', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'REST APIs', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'Git', level: INTERMEDIATE, required: true, weight: 1 },
    ],
  },
  {
    title: 'Data Scientist',
    category: 'data',
    description: 'Builds models and extracts insights from data.',
    mappedSkills: [
      { name: 'Python', level: ADVANCED, required: true, weight: 3 },
      { name: 'Machine Learning', level: ADVANCED, required: true, weight: 3 },
      { name: 'Pandas', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'Deep Learning', level: INTERMEDIATE, required: false, weight: 2 },
      { name: 'SQL', level: INTERMEDIATE, required: true, weight: 1 },
    ],
  },
  {
    title: 'DevOps Engineer',
    category: 'infrastructure',
    description: 'Automates build, deployment and infrastructure.',
    mappedSkills: [
      { name: 'Docker', level: ADVANCED, required: true, weight: 3 },
      { name: 'Kubernetes', level: INTERMEDIATE, required: true, weight: 3 },
      { name: 'AWS', level: INTERMEDIATE, required: true, weight: 2 },
      { name: 'CI/CD', level: ADVANCED, required: true, weight: 2 },
      { name: 'Linux', level: INTERMEDIATE, required: true, weight: 1 },
    ],
  },
];
