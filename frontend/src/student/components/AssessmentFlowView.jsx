import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../student.api.js';

export function AssessmentFlowView({ onNavigateTab }) {
  // Main view modes: 'catalog' | 'runner' | 'result'
  const [viewMode, setViewMode] = useState('catalog');

  // Catalog state
  const [catalogTab, setCatalogTab] = useState('assigned'); // 'assigned' | 'available' | 'history'
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Active Runner state
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [activeCampaignTitle, setActiveCampaignTitle] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: [selectedKey] }
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Result state
  const [latestResult, setLatestResult] = useState(null);

  const fetchCatalogData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (catalogTab === 'assigned') {
        const res = await studentApi.listMyAssignedAssessments();
        setAssignedAssessments(res.assignments || []);
        setMeta(null);
      } else if (catalogTab === 'available') {
        const res = await studentApi.listAssessments({
          difficulty: difficultyFilter || undefined,
          page,
          limit: 12,
        });
        setAvailableAssessments(res.assessments || []);
        setMeta(res.meta);
      } else {
        const res = await studentApi.listMyAttempts({ page, limit: 12 });
        setMyAttempts(res.attempts || []);
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  }, [catalogTab, difficultyFilter, page]);

  useEffect(() => {
    if (viewMode === 'catalog') {
      fetchCatalogData();
    }
  }, [viewMode, fetchCatalogData]);

  const startAssessment = async (assessmentId, campaign = null) => {
    setLoading(true);
    setError(null);
    try {
      const fullAssessment = await studentApi.getAssessment(assessmentId);
      if (!fullAssessment?.questions || fullAssessment.questions.length === 0) {
        throw new Error('This assessment does not contain any authored questions yet.');
      }
      setActiveAssessment(fullAssessment);
      setActiveCampaignId(campaign?.campaignId || null);
      setActiveCampaignTitle(campaign?.title || null);
      setCurrentQIndex(0);
      setAnswers({});
      setStartTime(new Date().toISOString());
      setViewMode('runner');
    } catch (err) {
      setError(err.message || 'Failed to initialize assessment attempt');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionKey], // Single-choice answer array
    }));
  };

  const handleSubmitAttempt = async () => {
    if (!activeAssessment) return;
    setSubmitting(true);
    try {
      const formattedAnswers = (activeAssessment.questions || []).map((q) => ({
        questionId: q.id,
        selected: answers[q.id] || [],
      }));

      const attemptResult = await studentApi.submitAssessmentAttempt(activeAssessment.id, {
        answers: formattedAnswers,
        campaignId: activeCampaignId || undefined,
        startedAt: startTime || new Date().toISOString(),
        applyToProfile: true,
      });

      setLatestResult(attemptResult);
      setShowSubmitModal(false);
      setViewMode('result');
    } catch (err) {
      setError(err.message || 'Failed to submit assessment attempt');
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
      setError(err.message || 'Failed to fetch assessment score breakdown');
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

  // =========================================================================
  // 1. CATALOG / DASHBOARD MODE
  // =========================================================================
  if (viewMode === 'catalog') {
    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem' }}>Skill Assessments & Readiness Benchmarks</h3>
            <p style={styles.description}>
              Attempt assigned institutional evaluations and open skill tests. Real calculated scores feed directly into your verified skill profile and industry readiness score.
            </p>
          </div>
          <button onClick={fetchCatalogData} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)' }}>
            ↻ Refresh
          </button>
        </div>

        {/* Tab switcher: Assigned vs Available vs History */}
        <div style={styles.toolbar}>
          <div style={styles.tabPillGroup}>
            <button
              onClick={() => { setCatalogTab('assigned'); setPage(1); }}
              style={{ ...styles.pillBtn, ...(catalogTab === 'assigned' ? styles.activePill : {}) }}
            >
              🏢 Institution Assignments {assignedAssessments.length > 0 && `(${assignedAssessments.length})`}
            </button>
            <button
              onClick={() => { setCatalogTab('available'); setPage(1); }}
              style={{ ...styles.pillBtn, ...(catalogTab === 'available' ? styles.activePill : {}) }}
            >
              📚 Self-Paced Catalog
            </button>
            <button
              onClick={() => { setCatalogTab('history'); setPage(1); }}
              style={{ ...styles.pillBtn, ...(catalogTab === 'history' ? styles.activePill : {}) }}
            >
              📋 My Past Attempts
            </button>
          </div>

          {catalogTab === 'available' && (
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              style={styles.select}
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={styles.stateBox}>
            <div style={styles.spinner}></div>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Loading assessment records...</p>
          </div>
        ) : error ? (
          <div style={styles.stateBox}>
            <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
            <button onClick={fetchCatalogData} className="btn btn-primary">Try Again</button>
          </div>
        ) : catalogTab === 'assigned' ? (
          /* Assigned Assessments Tab */
          assignedAssessments.length === 0 ? (
            <div style={styles.stateBox}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
              <h4 style={{ margin: '0 0 6px 0' }}>No Pending Institutional Assignments</h4>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '460px', margin: '0 0 16px 0', fontSize: '0.85rem' }}>
                Your institution has not assigned any active assessment campaigns to your cohort right now. You can take self-paced tests from the catalog anytime to boost your readiness.
              </p>
              <button onClick={() => setCatalogTab('available')} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                Explore Self-Paced Catalog →
              </button>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {assignedAssessments.map((item) => {
                const isCompleted = item.status === 'completed';
                const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !isCompleted;
                const assess = item.assessment || {};

                return (
                  <div key={item.campaignId} className="card" style={{ ...styles.assessmentCard, borderLeft: isCompleted ? '4px solid #22c55e' : isOverdue ? '4px solid #ef4444' : '4px solid #0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.15)' : isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                          color: isCompleted ? '#15803d' : isOverdue ? '#b91c1c' : '#0284c7',
                          fontWeight: 600,
                        }}
                      >
                        {isCompleted ? '✓ Completed' : isOverdue ? '⚠️ Overdue' : '⏳ Pending Attempt'}
                      </span>
                      <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {assess.difficulty || 'General'}
                      </span>
                    </div>

                    <h4 style={{ color: 'var(--color-primary)', margin: '0 0 4px 0', fontSize: '1.05rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 8px 0', fontWeight: 500 }}>
                      🏢 {item.institution?.name || 'Assigned Institution'}
                      {item.cohort ? ` • Cohort: ${item.cohort}` : ''}
                    </p>

                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', flex: 1 }}>
                      {item.description || `Assessment: ${assess.title || 'Institutional Skill Benchmark'}`}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                      <div>⏱️ Duration: <strong>{assess.durationMinutes || 30} mins</strong> • Questions: <strong>{assess.questionsCount || 0}</strong></div>
                      <div>🎯 Passing Criteria: <strong>{assess.passingScore || 60}%</strong></div>
                      {item.deadline && (
                        <div style={{ color: isOverdue ? '#ef4444' : 'inherit' }}>
                          📅 Due Date: <strong>{formatDate(item.deadline)}</strong>
                        </div>
                      )}
                      {isCompleted && item.score !== undefined && (
                        <div style={{ color: item.passed ? '#15803d' : '#b91c1c', fontWeight: 600, marginTop: '2px' }}>
                          🏆 Score Achieved: {item.score}% ({item.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'})
                        </div>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {isCompleted ? `Submitted ${formatDate(item.completedAt)}` : 'Mandatory Evaluation'}
                      </span>
                      <button
                        onClick={() => startAssessment(assess.id, item)}
                        className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
                        style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
                      >
                        {isCompleted ? 'Retake Test →' : 'Start Assessment →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : catalogTab === 'available' ? (
          /* Open Catalog Tab */
          availableAssessments.length === 0 ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-text-muted)' }}>No assessments currently available matching this filter.</p>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {availableAssessments.map((a) => (
                <div key={a.id} className="card" style={styles.assessmentCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                    <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                      {a.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      ⏱️ {a.durationMinutes || 30} mins
                    </span>
                  </div>

                  <h4 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-1)', fontSize: '1.05rem' }}>{a.title}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', flex: 1 }}>
                    {a.description || 'Test your proficiency and earn verified competencies.'}
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
                      style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
                    >
                      Take Test →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Past Attempts Tab */
          myAttempts.length === 0 ? (
            <div style={styles.stateBox}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📝</div>
              <h4 style={{ margin: '0 0 6px 0' }}>No Assessment Attempts Recorded</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                You have not completed any skill evaluations yet. Take an assigned or open assessment to start building your verified profile.
              </p>
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
                    <th style={styles.th}>Proficiency Level</th>
                    <th style={styles.th}>Attempted Date</th>
                    <th style={styles.th}>Actions</th>
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
                          <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', fontWeight: 600 }}>
                            Passed
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c', fontWeight: 600 }}>
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
                          style={{ fontSize: '11px', padding: '4px 10px' }}
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

  // =========================================================================
  // 2. ACTIVE RUNNER MODE
  // =========================================================================
  if (viewMode === 'runner' && activeAssessment) {
    const questions = activeAssessment.questions || [];
    const currentQ = questions[currentQIndex];
    const totalQ = questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
      <div style={styles.container}>
        {/* Runner Header Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '11px' }}>
                Active Evaluation Runner
              </span>
              {activeCampaignTitle && (
                <span className="badge" style={{ backgroundColor: '#334155', color: '#94a3b8', fontSize: '11px' }}>
                  Campaign: {activeCampaignTitle}
                </span>
              )}
            </div>
            <h4 style={{ color: '#f8fafc', margin: '6px 0 0 0', fontSize: '1.2rem' }}>{activeAssessment.title}</h4>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: '#94a3b8' }}>
              Progress: <strong style={{ color: '#fff' }}>{answeredCount} / {totalQ} Answered</strong>
            </span>
            <div style={{ width: '140px', height: '6px', backgroundColor: '#334155', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / totalQ) * 100}%`, backgroundColor: '#38bdf8', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ ? (
          <div className="card" style={styles.questionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
              <span className="badge badge-sky" style={{ fontSize: '11px', fontWeight: 600 }}>
                Question {currentQIndex + 1} of {totalQ}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {currentQ.skill && (
                  <span className="badge badge-mist" style={{ fontSize: '11px' }}>
                    Target Skill: <strong>{currentQ.skill}</strong>
                  </span>
                )}
                {currentQ.points && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Weight: {currentQ.points} pt{currentQ.points > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <h5 style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 'var(--space-5)', color: 'var(--color-text)' }}>
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
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: isSelected ? '#ffffff' : 'var(--color-text)',
                    }}>
                      {opt.key}
                    </div>
                    <span style={{ fontSize: '0.95rem', flex: 1, color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                      {opt.text}
                    </span>
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
                  style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}
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
              <h4 style={{ margin: '0 0 8px 0' }}>Ready to Submit Assessment?</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalQ}</strong> questions.
              </p>
              {answeredCount < totalQ && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#854d0e', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: 'var(--space-3)' }}>
                  ⚠️ You have {totalQ - answeredCount} unanswered questions. Unanswered questions receive 0 points.
                </div>
              )}
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                Your responses will be graded by the deterministic scoring engine, and validated skill proficiencies will be written automatically to your verified skill profile and readiness analytics.
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
                  style={{ fontWeight: 600 }}
                >
                  {submitting ? 'Submitting & Evaluating...' : 'Confirm Submission'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. RESULT VIEW MODE
  // =========================================================================
  if (viewMode === 'result' && latestResult) {
    const isPassed = latestResult.passed;
    const percentage = Math.round(latestResult.percentage || 0);

    return (
      <div style={styles.container}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: '54px', marginBottom: 'var(--space-2)' }}>
            {isPassed ? '🎉' : '📈'}
          </div>
          <h3 style={{ color: isPassed ? '#15803d' : 'var(--color-primary)', margin: '0 0 6px 0', fontSize: '1.6rem' }}>
            {isPassed ? 'Assessment Passed Successfully!' : 'Assessment Attempt Completed'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: '0 0 var(--space-4) 0' }}>
            {latestResult.assessmentTitle || 'Technical Competency Evaluation'}
          </p>

          <div style={styles.scoreCircle}>
            <span style={{ fontSize: '38px', fontWeight: 800, fontFamily: 'var(--font-family-display)', color: isPassed ? '#15803d' : 'var(--color-primary)' }}>
              {percentage}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score: {latestResult.score} / {latestResult.maxScore}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <span
              className="badge"
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                backgroundColor: isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isPassed ? '#15803d' : '#b91c1c',
                fontWeight: 600,
              }}
            >
              Outcome: {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
            <span className="badge badge-burgundy" style={{ fontSize: '12px', padding: '4px 12px', textTransform: 'capitalize' }}>
              Proficiency: {latestResult.level || 'intermediate'}
            </span>
          </div>

          {/* Skill Linkage Callout Banner */}
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#0284c7', fontSize: '0.95rem' }}>Profile & Readiness Synchronized</h5>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  The deterministic scores from this assessment have been verified and applied directly to your <strong>verified skills profile</strong>. Your industry readiness score and skill-gap radar have updated to reflect this performance.
                </p>
              </div>
            </div>
          </div>

          {/* Per skill breakdown */}
          {latestResult.perSkillScore && Object.keys(latestResult.perSkillScore).length > 0 && (
            <div style={{ maxWidth: '520px', margin: 'var(--space-6) auto 0', textAlign: 'left' }}>
              <h5 style={{ marginBottom: 'var(--space-3)', fontSize: '0.95rem' }}>Competency Performance by Skill Area</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Object.entries(latestResult.perSkillScore).map(([skill, stat]) => {
                  const skillPct = stat.max > 0 ? Math.round((stat.score / stat.max) * 100) : 0;
                  return (
                    <div key={skill} style={styles.skillStatRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                        <strong style={{ color: 'var(--color-text)' }}>{skill}</strong>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{skillPct}% ({stat.score}/{stat.max} pts)</span>
                      </div>
                      <div style={styles.statBar}>
                        <div style={{ height: '100%', width: `${skillPct}%`, backgroundColor: skillPct >= 60 ? '#22c55e' : '#f59e0b', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setViewMode('catalog'); setActiveAssessment(null); }}
              className="btn btn-outline"
            >
              ← Back to Assessments Hub
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('readiness')}
                className="btn btn-primary"
                style={{ fontWeight: 600 }}
              >
                Inspect Updated Skill-Gap Radar →
              </button>
            )}
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
  pillBtn: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: 'transparent', fontSize: 'var(--font-size-xs)', fontWeight: '500', cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'all var(--transition-fast)' },
  activePill: { backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-primary)', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' },
  assessmentCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' },
  tableWrapper: { overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' },
  th: { padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid var(--color-border-subtle)' },
  td: { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' },
  questionCard: { backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' },
  optionItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-app)', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  optionSelected: { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-sky-light)' },
  optionIndicator: { width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' },
  scoreCircle: { width: '130px', height: '130px', borderRadius: '50%', border: '4px solid var(--color-primary)', margin: 'var(--space-4) auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-mist-light)' },
  skillStatRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  statBar: { width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border)', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '440px', width: '100%', borderRadius: 'var(--radius-lg)' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default AssessmentFlowView;
