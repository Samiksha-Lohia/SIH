import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeGap, severityForGap } from '../src/modules/skillgap/gap.engine.js';

test('severityForGap buckets', () => {
  assert.equal(severityForGap(0), 'met');
  assert.equal(severityForGap(1), 'minor');
  assert.equal(severityForGap(2), 'moderate');
  assert.equal(severityForGap(3), 'critical');
});

test('analyzeGap on the Frontend Developer example', () => {
  const requiredSkills = [
    { name: 'React', level: 'advanced', required: true, weight: 3 },
    { name: 'JavaScript', level: 'advanced', required: true, weight: 3 },
    { name: 'Git', level: 'intermediate', required: true, weight: 1 },
    { name: 'Testing', level: 'intermediate', required: false, weight: 2 },
  ];
  const studentSkills = [
    { name: 'React', level: 'intermediate' },
    { name: 'JavaScript', level: 'advanced' },
    { name: 'Git', level: 'intermediate' },
    { name: 'Testing', level: 'beginner' },
  ];
  const r = analyzeGap({ requiredSkills, studentSkills });
  assert.deepEqual(r.strong.sort(), ['Git', 'JavaScript']);
  assert.deepEqual(r.weak.sort(), ['React', 'Testing']);
  assert.equal(r.missing.length, 0);
  assert.ok(r.readiness > 70 && r.readiness <= 100);
  // React should be the top-priority gap (weight 3, gap 1).
  assert.equal(r.gaps[0].skill, 'React');
});

test('analyzeGap flags a missing required skill as critical', () => {
  const r = analyzeGap({
    requiredSkills: [{ name: 'Kubernetes', level: 'advanced', required: true, weight: 2 }],
    studentSkills: [],
  });
  assert.equal(r.missing[0], 'Kubernetes');
  assert.equal(r.gaps[0].severity, 'critical');
});
