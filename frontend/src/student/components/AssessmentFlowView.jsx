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
            <h3 style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>Skill Assessments & Readiness Benchmarks</h3>
            <p style={styles.description}>
              Attempt assigned institutional evaluations and open skill tests. Real calculated scores feed directly into your verified skill profile and industry readiness score.
            </p>
          </div>
          <button onClick={fetchCatalogData} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
            Refresh
          </button>
        </div>

        {/* Tab switcher: Assigned vs Available vs History */}
        <div style={styles.toolbar}>
          <div className="b2b-tab-bar">
            <button
              onClick={() => { setCatalogTab('assigned'); setPage(1); }}
              className={`b2b-tab ${catalogTab === 'assigned' ? 'active' : ''}`}
            >
              Institution Assignments {assignedAssessments.length > 0 && `(${assignedAssessments.length})`}
            </button>
            <button
              onClick={() => { setCatalogTab('available'); setPage(1); }}
              className={`b2b-tab ${catalogTab === 'available' ? 'active' : ''}`}
            >
              Self-Paced Catalog
            </button>
            <button
              onClick={() => { setCatalogTab('history'); setPage(1); }}
              className={`b2b-tab ${catalogTab === 'history' ? 'active' : ''}`}
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
              <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>No Pending Institutional Assignments</h4>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '460px', margin: '0 0 16px 0', fontSize: 'var(--font-size-xs)' }}>
                Your institution has not assigned any active assessment campaigns to your cohort right now. You can take self-paced tests from the catalog anytime to boost your readiness.
              </p>
              <button onClick={() => setCatalogTab('available')} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
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
                  <div key={item.campaignId} className="card" style={styles.assessmentCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <span className={`status-pill ${isCompleted ? 'status-verified' : isOverdue ? 'status-rejected' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                        <span className="status-pill-dot" />
                        {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending Attempt'}
                      </span>
                      <span className="badge badge-role" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {assess.difficulty || 'General'}
                      </span>
                    </div>

                    <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 2px 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '0 0 8px 0', fontWeight: '500' }}>
                      {item.institution?.name || 'Assigned Institution'}
                      {item.cohort ? ` • Cohort: ${item.cohort}` : ''}
                    </p>

                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', flex: 1, lineHeight: 1.4 }}>
                      {item.description || `Assessment: ${assess.title || 'Institutional Skill Benchmark'}`}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', padding: '8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)' }}>
                      <div>Duration: <strong>{assess.durationMinutes || 30} mins</strong> • Questions: <strong>{assess.questionsCount || 0}</strong></div>
                      <div>Passing Score: <strong>{assess.passingScore || 60}%</strong></div>
                      {item.deadline && (
                        <div style={{ color: isOverdue ? 'var(--color-primary)' : 'inherit' }}>
                          Due Date: <strong>{formatDate(item.deadline)}</strong>
                        </div>
                      )}
                      {isCompleted && item.score !== undefined && (
                        <div style={{ color: item.passed ? 'var(--color-text-main)' : 'var(--color-primary)', fontWeight: '600', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                          Score: {item.score}% ({item.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'})
                        </div>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {isCompleted ? `Submitted ${formatDate(item.completedAt)}` : 'Mandatory Evaluation'}
                      </span>
                      <button
                        onClick={() => startAssessment(assess.id, item)}
                        className={`btn ${isCompleted ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ fontSize: 'var(--font-size-xs)', padding: '4px 12px' }}
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
                    <span className="badge badge-role" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                      {a.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {a.durationMinutes || 30} mins
                    </span>
                  </div>

                  <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 4px 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>{a.title}</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', flex: 1, lineHeight: 1.4 }}>
                    {a.description || 'Test your proficiency and earn verified competencies.'}
                  </p>

                  {a.skillSet?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-3)' }}>
                      {a.skillSet.map((s, idx) => (
                        <span key={idx} className="badge" style={{ fontSize: '10px', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)' }}>{s}</span>
                      ))}
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Passing: <strong>{a.passingScore}%</strong>
                    </span>
                    <button
                      onClick={() => startAssessment(a.id)}
                      className="btn btn-primary"
                      style={{ fontSize: 'var(--font-size-xs)', padding: '4px 12px' }}
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
              <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>No Assessment Attempts Recorded</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', margin: 0 }}>
                You have not completed any skill evaluations yet. Take an assigned or open assessment to start building your verified profile.
              </p>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Outcome</th>
                    <th>Proficiency Level</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttempts.map((att) => (
                    <tr key={att.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-main)' }}>{att.assessmentTitle || 'Skill Assessment'}</strong>
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{att.score} / {att.maxScore}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>{Math.round(att.percentage || 0)}%</td>
                      <td>
                        <span className={`status-pill ${att.passed ? 'status-verified' : 'status-rejected'}`} style={{ fontSize: '10px' }}>
                          <span className="status-pill-dot" />
                          {att.passed ? 'Passed' : 'Needs Review'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-role" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                          {att.level || 'intermediate'}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDate(att.createdAt)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => viewAttemptResult(att.id)}
                          className="btn btn-ghost"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          Breakdown
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
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              Page {meta.page} of {meta.totalPages} ({meta.total} records)
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNextPage || loading}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Next →
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
        <div className="card" style={styles.runnerHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-role" style={{ fontSize: '11px' }}>
                Evaluation Runner
              </span>
              {activeCampaignTitle && (
                <span className="badge" style={{ backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', fontSize: '11px' }}>
                  Campaign: {activeCampaignTitle}
                </span>
              )}
            </div>
            <h4 style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-text-main)' }}>{activeAssessment.title}</h4>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              Progress: <strong style={{ color: 'var(--color-text-main)' }}>{answeredCount} / {totalQ} Answered</strong>
            </span>
            <div style={{ width: '140px', height: '4px', backgroundColor: 'var(--color-mist-light)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / totalQ) * 100}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ ? (
          <div className="card" style={styles.questionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', flexWrap: 'wrap', gap: '4px' }}>
              <span className="badge badge-role" style={{ fontSize: '10px' }}>
                Question {currentQIndex + 1} of {totalQ}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {currentQ.skill && (
                  <span className="badge" style={{ backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)', fontSize: '10px' }}>
                    Skill: <strong>{currentQ.skill}</strong>
                  </span>
                )}
                {currentQ.points && (
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Weight: {currentQ.points} pt{currentQ.points > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <h5 style={{ fontSize: 'var(--font-size-base)', fontWeight: '500', lineHeight: 1.5, marginBottom: 'var(--space-4)', color: 'var(--color-text-main)' }}>
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
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-mist-light)' : 'var(--color-bg-surface)',
                    }}
                  >
                    <div style={{
                      ...styles.optionIndicator,
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-mist-light)',
                      borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                    }}>
                      {opt.key}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', flex: 1, color: isSelected ? 'var(--color-text-main)' : 'var(--color-text-secondary)', fontWeight: isSelected ? '500' : 'normal' }}>
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
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {currentQIndex < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((i) => Math.min(totalQ - 1, i + 1))}
                    className="btn btn-ghost"
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
              <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-base)', fontWeight: '600' }}>Ready to Submit Assessment?</h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalQ}</strong> questions.
              </p>
              {answeredCount < totalQ && (
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Notice: You have {totalQ - answeredCount} unanswered questions. Unanswered questions receive 0 points.
                </div>
              )}
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                Your responses will be graded deterministically, and validated skill proficiencies will be written automatically to your verified skill profile and readiness analytics.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Continue Reviewing
                </button>
                <button
                  onClick={handleSubmitAttempt}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
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
        <div className="card" style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span className={`status-pill ${isPassed ? 'status-verified' : 'status-rejected'}`} style={{ fontSize: '11px' }}>
                <span className="status-pill-dot" />
                {isPassed ? 'Passed Successfully' : 'Evaluation Completed'}
              </span>
              <span className="badge badge-role" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                Proficiency: {latestResult.level || 'intermediate'}
              </span>
            </div>

            <h3 style={{ margin: '0 0 2px 0', fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--color-text-main)' }}>
              {latestResult.assessmentTitle || 'Technical Competency Evaluation'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', margin: 0 }}>
              Deterministic scoring completed against benchmark criteria.
            </p>
          </div>

          <div style={styles.resultKpiGrid}>
            <div className="b2b-kpi-tile">
              <span className="b2b-kpi-label">Final Score</span>
              <span className="b2b-kpi-value" style={{ color: isPassed ? 'var(--color-text-main)' : 'var(--color-primary)' }}>
                {percentage}%
              </span>
              <span className="b2b-kpi-subtext">{latestResult.score} / {latestResult.maxScore} points</span>
            </div>

            <div className="b2b-kpi-tile">
              <span className="b2b-kpi-label">Outcome</span>
              <span className="b2b-kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>
                {isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
              </span>
              <span className="b2b-kpi-subtext">Passing threshold: 60%</span>
            </div>
          </div>

          {/* Skill Linkage Callout Banner */}
          <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)' }}>
            <h5 style={{ margin: '0 0 2px 0', fontSize: 'var(--font-size-xs)', fontWeight: '600' }}>Profile & Readiness Synchronized</h5>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
              Deterministic scores from this assessment have been verified and applied directly to your verified skills profile. Your industry readiness score has updated.
            </p>
          </div>

          {/* Per skill breakdown */}
          {latestResult.perSkillScore && Object.keys(latestResult.perSkillScore).length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>Competency Area Performance</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {Object.entries(latestResult.perSkillScore).map(([skill, stat]) => {
                  const skillPct = stat.max > 0 ? Math.round((stat.score / stat.max) * 100) : 0;
                  return (
                    <div key={skill} style={styles.skillStatRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <strong style={{ color: 'var(--color-text-main)' }}>{skill}</strong>
                        <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{skillPct}% ({stat.score}/{stat.max} pts)</span>
                      </div>
                      <div style={styles.statBar}>
                        <div style={{ height: '100%', width: `${skillPct}%`, backgroundColor: skillPct >= 60 ? 'var(--color-steel-blue)' : 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <button
              onClick={() => { setViewMode('catalog'); setActiveAssessment(null); }}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              ← Back to Hub
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('readiness')}
                className="btn btn-primary"
                style={{ fontSize: 'var(--font-size-xs)' }}
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
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-3)' },
  assessmentCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' },
  runnerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' },
  questionCard: { display: 'flex', flexDirection: 'column' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' },
  optionItem: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  optionIndicator: { width: '22px', height: '22px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' },
  resultKpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' },
  skillStatRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statBar: { width: '100%', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-mist-light)', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'clamp(8px, 2vw, 16px)' },
  modalCard: { maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default AssessmentFlowView;
