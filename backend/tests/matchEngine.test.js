import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMatch } from '../src/modules/matching/match.engine.js';

const opportunity = {
  title: 'Frontend Developer Intern',
  role: 'Frontend Developer',
  workMode: 'onsite',
  location: 'Bangalore',
  requiredSkills: [
    { name: 'React', level: 'advanced', weight: 3 },
    { name: 'JavaScript', level: 'advanced', weight: 3 },
    { name: 'Git', level: 'intermediate', weight: 1 },
  ],
  preferredSkills: [],
};

test('computeMatch returns a 0-100 score with breakdown + matched/missing', () => {
  const student = {
    skills: [
      { name: 'React', level: 'intermediate' },
      { name: 'JavaScript', level: 'advanced' },
      { name: 'Git', level: 'intermediate' },
    ],
    education: [{ cgpa: 8 }],
    careerGoals: { targetRoles: ['Frontend Developer'] },
    projects: [{ title: 'x', techStack: ['React'] }],
    certifications: [{ name: 'c' }],
    preferences: { locations: ['Bangalore'] },
  };
  const m = computeMatch(opportunity, student);
  assert.ok(m.score >= 0 && m.score <= 100);
  assert.equal(m.breakdown.skillCompatibility, 100);
  assert.deepEqual(m.missingSkills, []);
  assert.ok(m.breakdown.skillProficiency < 100); // React below required
});

test('computeMatch penalizes missing skills', () => {
  const weak = { skills: [{ name: 'Git', level: 'beginner' }], education: [], careerGoals: {}, projects: [], certifications: [], preferences: {} };
  const strong = {
    skills: [
      { name: 'React', level: 'advanced' },
      { name: 'JavaScript', level: 'advanced' },
      { name: 'Git', level: 'intermediate' },
    ],
    education: [{ cgpa: 9 }],
    careerGoals: { targetRoles: ['Frontend Developer'] },
    projects: [{ title: 'x', techStack: ['React', 'JavaScript'] }],
    certifications: [{ name: 'c' }],
    preferences: { locations: ['Bangalore'] },
  };
  assert.ok(computeMatch(opportunity, strong).score > computeMatch(opportunity, weak).score);
});
