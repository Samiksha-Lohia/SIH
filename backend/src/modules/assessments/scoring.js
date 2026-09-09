import { PROFICIENCY } from '../../config/constants.js';

/**
 * Convert a percentage score (0-100) into an ordinal proficiency level.
 * Thresholds are intentionally simple and tunable.
 */
export function scoreToLevel(percentage) {
  if (percentage >= 85) return PROFICIENCY.EXPERT;
  if (percentage >= 65) return PROFICIENCY.ADVANCED;
  if (percentage >= 40) return PROFICIENCY.INTERMEDIATE;
  return PROFICIENCY.BEGINNER;
}

/**
 * Compare selected option keys to the correct set. Correct only if the sets are
 * identical (supports single- and multi-select questions).
 */
function isCorrect(selected = [], correctKeys = []) {
  const a = [...new Set(selected.map(String))].sort();
  const b = [...new Set(correctKeys.map(String))].sort();
  // A question with no defined answer key can never be auto-scored as correct.
  if (b.length === 0) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/**
 * Score an attempt.
 * @param {Array} questions - full Question docs (with correctKeys, points, skill)
 * @param {Array} answers   - [{ questionId, selected: [keys] }]
 * @param {number} passingScore - percentage threshold
 * @returns evaluated answers, raw/max/normalized score, per-skill breakdown, passed
 */
export function scoreAttempt(questions, answers, passingScore = 50) {
  const answerMap = new Map(answers.map((a) => [String(a.questionId), a.selected || []]));
  const bySkill = new Map(); // skill -> { correctPts, totalPts, correctCount, total }

  let rawScore = 0;
  let maxScore = 0;
  const evaluated = [];

  for (const q of questions) {
    const qid = String(q._id);
    const selected = answerMap.get(qid) || [];
    const points = q.points ?? 1;
    const correct = isCorrect(selected, q.correctKeys);
    const earned = correct ? points : 0;

    rawScore += earned;
    maxScore += points;

    evaluated.push({ question: q._id, selected, correct, pointsEarned: earned });

    const skill = q.skill || 'general';
    if (!bySkill.has(skill)) bySkill.set(skill, { correctPts: 0, totalPts: 0, correctCount: 0, total: 0 });
    const s = bySkill.get(skill);
    s.totalPts += points;
    s.correctPts += earned;
    s.total += 1;
    if (correct) s.correctCount += 1;
  }

  const score = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;

  const skillScores = [...bySkill.entries()].map(([skill, s]) => {
    const pct = s.totalPts > 0 ? Math.round((s.correctPts / s.totalPts) * 100) : 0;
    return { skill, score: pct, level: scoreToLevel(pct), correct: s.correctCount, total: s.total };
  });

  return {
    evaluated,
    rawScore,
    maxScore,
    score,
    skillScores,
    passed: score >= passingScore,
  };
}
