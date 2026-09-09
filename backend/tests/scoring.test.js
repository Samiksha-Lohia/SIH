import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreAttempt, scoreToLevel } from '../src/modules/assessments/scoring.js';

test('scoreToLevel thresholds', () => {
  assert.equal(scoreToLevel(90), 'expert');
  assert.equal(scoreToLevel(70), 'advanced');
  assert.equal(scoreToLevel(50), 'intermediate');
  assert.equal(scoreToLevel(20), 'beginner');
});

test('scoreAttempt computes overall + per-skill and handles multi-select', () => {
  const questions = [
    { _id: 'q1', skill: 'React', points: 1, correctKeys: ['A'] },
    { _id: 'q2', skill: 'React', points: 1, correctKeys: ['B'] },
    { _id: 'q3', skill: 'JavaScript', points: 2, correctKeys: ['C'] },
    { _id: 'q4', skill: 'Testing', points: 1, correctKeys: ['A', 'B'] },
  ];
  const answers = [
    { questionId: 'q1', selected: ['A'] },
    { questionId: 'q2', selected: ['A'] },
    { questionId: 'q3', selected: ['C'] },
    { questionId: 'q4', selected: ['A'] }, // multi-select mismatch
  ];
  const r = scoreAttempt(questions, answers, 50);
  assert.equal(r.rawScore, 3);
  assert.equal(r.maxScore, 5);
  assert.equal(r.score, 60);
  assert.equal(r.passed, true);
  const js = r.skillScores.find((s) => s.skill === 'JavaScript');
  assert.equal(js.score, 100);
  assert.equal(js.level, 'expert');
  const testing = r.skillScores.find((s) => s.skill === 'Testing');
  assert.equal(testing.score, 0);
});

test('scoreAttempt: empty correctKeys is never correct', () => {
  const r = scoreAttempt([{ _id: 'q', skill: 'X', points: 1, correctKeys: [] }], [{ questionId: 'q', selected: [] }], 50);
  assert.equal(r.rawScore, 0);
});
