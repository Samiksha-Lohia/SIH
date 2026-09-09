import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../student.api.js';

export function AssessmentFlowView() {
  // Main view modes: 'catalog' | 'runner' | 'result'
  const [viewMode, setViewMode] = useState('catalog');

  // Catalog state
  const [assessments, setAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [catalogTab, setCatalogTab] = useState('available'); // 'available' | 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Active Runner state
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: [selectedKey] }
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Result state
  const [latestResult, setLatestResult] = useState(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (catalogTab === 'available') {
        const res = await studentApi.listAssessments({
          difficulty: difficultyFilter || undefined,
          page,
          limit: 10,
        });
        setAssessments(res.assessments);
        setMeta(res.meta);
      } else {
        const res = await studentApi.listMyAttempts({ page, limit: 10 });
        setMyAttempts(res.attempts);
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [catalogTab, difficultyFilter, page]);

  useEffect(() => {
    if (viewMode === 'catalog') {
      fetchCatalog();
    }
  }, [viewMode, fetchCatalog]);

  const startAssessment = async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const fullAssessment = await studentApi.getAssessment(assessmentId);
      if (!fullAssessment?.questions || fullAssessment.questions.length === 0) {
        throw new Error('This assessment does not have any questions authored yet.');
      }
      setActiveAssessment(fullAssessment);
      setCurrentQIndex(0);
      setAnswers({});
      setViewMode('runner');
    } catch (err) {
      setError(err.message || 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionKey], // Single choice select
    }));
  };

  const handleSubmitAttempt = async () => {
    if (!activeAssessment) return;
    setSubmitting(true);
    try {
      const formattedAnswers = activeAssessment.questions.map((q) => ({
        questionId: q.id,
        selected: answers[q.id] || [],
      }));

      const attemptResult = await studentApi.submitAssessmentAttempt(activeAssessment.id, {
        answers: formattedAnswers,
        applyToProfile: true,
      });

      setLatestResult(attemptResult);
      setShowSubmitModal(false);
      setViewMode('result');
    } catch (err) {
      setError(err.message || 'Failed to submit assessment');
      setShowSubmitModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const viewAttemptResult = async (attemptId) => {
    setLoading(true);
    try {
      const attempt = await studentApi.getAttemptResult(attemptId);
      setLatestResult(attempt);
      setViewMode('result');
    } catch (err) {
      setError(err.message || 'Failed to fetch result');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return isoString;
    }
  };

  // ---------------- Render Catalog Mode ----------------
  if (viewMode === 'catalog') {
    return (
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h3>Skill Assessments & Certification Engine</h3>
            <p style={styles.description}>
              Validate your technical skills through adaptive quizzes and verified benchmark tests. Results directly update your skill profile and readiness score.
            </p>
          </div>
          <button onClick={fetchCatalog} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)' }}>
            Refresh
          </button>
        </div>

        {/* Tab switcher: Available vs History */}
        <div style={styles.toolbar}>
          <div style={styles.tabPillGroup}>
            <button
              onClick={() => { setCatalogTab('available'); setPage(1); }}
              style={{ ...styles.pillBtn, ...(catalogTab === 'available' ? styles.activePill : {}) }}
            >
              Available Assessments
            </button>
            <button
              onClick={() => { setCatalogTab('history'); setPage(1); }}
              style={{ ...styles.pillBtn, ...(catalogTab === 'history' ? styles.activePill : {}) }}
            >
              My Past Attempts
            </button>
          </div>

          {catalogTab === 'available' && (
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              style={styles.select}
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          )}
        </div>

        {loading ? (
          <div style={styles.stateBox}>
            <div style={styles.spinner}></div>
            <p>Loading assessment catalog...</p>
          </div>
        ) : error ? (
          <div style={styles.stateBox}>
            <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
            <button onClick={fetchCatalog} className="btn btn-primary">Try Again</button>
          </div>
        ) : catalogTab === 'available' ? (
          assessments.length === 0 ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-text-muted)' }}>No assessments currently available under this filter.</p>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {assessments.map((a) => (
                <div key={a.id} className="card" style={styles.assessmentCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                      {a.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      ⏱️ {a.durationMinutes || 30} mins
                    </span>
                  </div>

                  <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-1)' }}>{a.title}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', flex: 1 }}>
                    {a.description || 'Test your proficiency and earn verified credentials.'}
                  </p>

                  {a.skillSet?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-3)' }}>
                      {a.skillSet.map((s, idx) => (
                        <span key={idx} className="badge badge-mist" style={{ fontSize: '10px' }}>{s}</span>
                      ))}
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Passing score: <strong>{a.passingScore}%</strong>
                    </span>
                    <button
                      onClick={() => startAssessment(a.id)}
                      className="btn btn-primary"
                      style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-3)' }}
                    >
                      Take Test →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Past Attempts List */
          myAttempts.length === 0 ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-text-muted)' }}>You have not taken any assessments yet. Choose one from the catalog to begin!</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Assessment</th>
                    <th style={styles.th}>Score Achieved</th>
                    <th style={styles.th}>Percentage</th>
                    <th style={styles.th}>Outcome</th>
                    <th style={styles.th}>Assigned Level</th>
                    <th style={styles.th}>Completed At</th>
                    <th style={styles.th}>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttempts.map((att) => (
                    <tr key={att.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{att.assessmentTitle || 'Skill Assessment'}</strong>
                      </td>
                      <td style={styles.td}>{att.score} / {att.maxScore}</td>
                      <td style={styles.td}><strong>{Math.round(att.percentage || 0)}%</strong></td>
                      <td style={styles.td}>
                        {att.passed ? (
                          <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d' }}>
                            Passed
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' }}>
                            Needs Review
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span className="badge badge-sky" style={{ textTransform: 'capitalize' }}>
                          {att.level || 'intermediate'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {formatDate(att.createdAt)}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => viewAttemptResult(att.id)}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={styles.paginationRow}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage || loading}
              className="btn btn-outline"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Previous
            </button>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Page {meta.page} of {meta.totalPages} ({meta.total} records)
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNextPage || loading}
              className="btn btn-outline"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------------- Render Active Runner Mode ----------------
  if (viewMode === 'runner' && activeAssessment) {
    const questions = activeAssessment.questions || [];
    const currentQ = questions[currentQIndex];
    const totalQ = questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
      <div style={styles.container}>
        {/* Runner Header */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div>
            <span className="badge badge-burgundy" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Active Assessment
            </span>
            <h4 style={{ color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>{activeAssessment.title}</h4>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Progress: <strong>{answeredCount} / {totalQ} Answered</strong>
            </span>
            <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / totalQ) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ ? (
          <div className="card" style={styles.questionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                Question {currentQIndex + 1} of {totalQ}
              </span>
              {currentQ.skill && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Skill: <strong>{currentQ.skill}</strong>
                </span>
              )}
            </div>

            <h5 style={{ fontSize: 'var(--font-size-md)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
              {currentQ.text}
            </h5>

            <div style={styles.optionsList}>
              {currentQ.options?.map((opt) => {
                const isSelected = (answers[currentQ.id] || []).includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectOption(currentQ.id, opt.key)}
                    style={{
                      ...styles.optionItem,
                      ...(isSelected ? styles.optionSelected : {}),
                    }}
                  >
                    <div style={{
                      ...styles.optionIndicator,
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                    }}>
                      {opt.key}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>{opt.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div style={styles.navRow}>
              <button
                onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                disabled={currentQIndex === 0}
                className="btn btn-outline"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                ← Previous Question
              </button>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {currentQIndex < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((i) => Math.min(totalQ - 1, i + 1))}
                    className="btn btn-outline"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    Next Question →
                  </button>
                ) : null}

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Finish & Submit Test
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div style={styles.modalOverlay}>
            <div className="card" style={styles.modalCard}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>Submit Assessment</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalQ}</strong> questions.
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                Once submitted, your answers will be automatically scored and your verified profile skills will be updated accordingly.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="btn btn-outline"
                >
                  Continue Reviewing
                </button>
                <button
                  onClick={handleSubmitAttempt}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting & Scoring...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- Render Result Mode ----------------
  if (viewMode === 'result' && latestResult) {
    const isPassed = latestResult.passed;
    const percentage = Math.round(latestResult.percentage || 0);

    return (
      <div style={styles.container}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>
            {isPassed ? '🎉' : '📈'}
          </div>
          <h3 style={{ color: isPassed ? '#15803d' : 'var(--color-primary)' }}>
            {isPassed ? 'Assessment Passed Successfully!' : 'Assessment Completed'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            {latestResult.assessmentTitle || 'Technical Competency Evaluation'}
          </p>

          <div style={styles.scoreCircle}>
            <span style={{ fontSize: '36px', fontWeight: 'bold', fontFamily: 'var(--font-family-display)' }}>
              {percentage}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Score: {latestResult.score} / {latestResult.maxScore}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <span
              className="badge"
              style={{
                fontSize: '12px',
                backgroundColor: isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isPassed ? '#15803d' : '#b91c1c',
              }}
            >
              Status: {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
            <span className="badge badge-burgundy" style={{ fontSize: '12px', textTransform: 'capitalize' }}>
              Proficiency Level: {latestResult.level || 'intermediate'}
            </span>
          </div>

          {/* Per skill breakdown */}
          {latestResult.perSkillScore && Object.keys(latestResult.perSkillScore).length > 0 && (
            <div style={{ maxWidth: '480px', margin: 'var(--space-6) auto 0', textAlign: 'left' }}>
              <h5 style={{ marginBottom: 'var(--space-2)' }}>Per-Skill Performance Breakdown</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {Object.entries(latestResult.perSkillScore).map(([skill, stat]) => {
                  const skillPct = stat.max > 0 ? Math.round((stat.score / stat.max) * 100) : 0;
                  return (
                    <div key={skill} style={styles.skillStatRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                        <strong>{skill}</strong>
                        <span>{skillPct}% ({stat.score}/{stat.max})</span>
                      </div>
                      <div style={styles.statBar}>
                        <div style={{ height: '100%', width: `${skillPct}%`, backgroundColor: skillPct >= 60 ? '#15803d' : '#b45309' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-8)' }}>
            <button
              onClick={() => { setViewMode('catalog'); setActiveAssessment(null); }}
              className="btn btn-primary"
            >
              Back to Assessments Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' },
  tabPillGroup: { display: 'flex', backgroundColor: 'var(--color-mist-light)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' },
  pillBtn: { padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'transparent', fontSize: 'var(--font-size-xs)', fontWeight: '500', cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all var(--transition-fast)' },
  activePill: { backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-primary)', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' },
  assessmentCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' },
  tableWrapper: { overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' },
  th: { padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid var(--color-border-subtle)' },
  td: { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' },
  questionCard: { backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-6)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' },
  optionItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  optionSelected: { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-sky-light)' },
  optionIndicator: { width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' },
  scoreCircle: { width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--color-primary)', margin: 'var(--space-4) auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-mist-light)' },
  skillStatRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statBar: { width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '420px', width: '100%' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default AssessmentFlowView;
