import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

export function AssessmentBankView() {
  const [subTab, setSubTab] = useState('questions'); // 'questions' | 'assessments'

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(true);
  const [qError, setQError] = useState(null);
  const [qPage, setQPage] = useState(1);
  const [qMeta, setQMeta] = useState(null);

  // Assessments State
  const [assessments, setAssessments] = useState([]);
  const [aLoading, setALoading] = useState(true);
  const [aError, setAError] = useState(null);
  const [aPage, setAPage] = useState(1);
  const [aMeta, setAMeta] = useState(null);

  // Modals
  const [showCreateQModal, setShowCreateQModal] = useState(false);
  const [showCreateAModal, setShowCreateAModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Question Form State
  const [qText, setQText] = useState('');
  const [qSkill, setQSkill] = useState('');
  const [qType, setQType] = useState('technical');
  const [qDifficulty, setQDifficulty] = useState('intermediate');
  const [qPoints, setQPoints] = useState(1);
  const [qExplanation, setQExplanation] = useState('');
  const [qOptions, setQOptions] = useState([
    { key: 'A', text: '', isCorrect: false },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ]);

  // Assessment Form State
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aRole, setARole] = useState('');
  const [aSkills, setASkills] = useState('');
  const [aDifficulty, setADifficulty] = useState('intermediate');
  const [aDuration, setADuration] = useState(30);
  const [aPassing, setAPassing] = useState(50);

  const fetchQuestions = useCallback(async () => {
    setQLoading(true);
    setQError(null);
    try {
      const res = await adminApi.listQuestions({ page: qPage, limit: 15 });
      setQuestions(res.questions);
      setQMeta(res.meta);
    } catch (err) {
      setQError(err.message || 'Failed to fetch questions');
    } finally {
      setQLoading(false);
    }
  }, [qPage]);

  const fetchAssessments = useCallback(async () => {
    setALoading(true);
    setAError(null);
    try {
      const res = await adminApi.listAssessments({ page: aPage, limit: 15 });
      setAssessments(res.assessments);
      setAMeta(res.meta);
    } catch (err) {
      setAError(err.message || 'Failed to fetch assessments');
    } finally {
      setALoading(false);
    }
  }, [aPage]);

  useEffect(() => {
    if (subTab === 'questions') fetchQuestions();
    else fetchAssessments();
  }, [subTab, fetchQuestions, fetchAssessments]);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const validOptions = qOptions.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      setFeedback({ type: 'error', message: 'Please provide at least two options.' });
      return;
    }

    const correctKeys = qOptions.filter((o) => o.isCorrect && o.text.trim()).map((o) => o.key);
    if (correctKeys.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one correct option.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createQuestion({
        text: qText.trim(),
        skill: qSkill.trim() || undefined,
        type: qType,
        difficulty: qDifficulty,
        points: Number(qPoints) || 1,
        explanation: qExplanation.trim() || undefined,
        options: validOptions.map((o) => ({ key: o.key, text: o.text.trim() })),
        correctKeys,
      });
      setFeedback({ type: 'success', message: 'Question added to bank.' });
      setShowCreateQModal(false);
      setQText('');
      setQSkill('');
      setQExplanation('');
      setQOptions([
        { key: 'A', text: '', isCorrect: false },
        { key: 'B', text: '', isCorrect: false },
        { key: 'C', text: '', isCorrect: false },
        { key: 'D', text: '', isCorrect: false },
      ]);
      await fetchQuestions();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create question' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!aTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const skillSet = aSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await adminApi.createAssessment({
        title: aTitle.trim(),
        description: aDesc.trim() || undefined,
        role: aRole.trim() || undefined,
        skillSet,
        difficulty: aDifficulty,
        durationMinutes: Number(aDuration) || 30,
        passingScore: Number(aPassing) || 50,
      });
      setFeedback({ type: 'success', message: `Assessment "${aTitle}" created.` });
      setShowCreateAModal(false);
      setATitle('');
      setADesc('');
      setARole('');
      setASkills('');
      await fetchAssessments();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create assessment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await adminApi.deleteAssessment(deleteTarget.id);
      setFeedback({ type: 'success', message: `Assessment "${deleteTarget.title}" deleted.` });
      setDeleteTarget(null);
      await fetchAssessments();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete assessment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>Assessment & Question Bank</h3>
          <p style={styles.description}>Manage technical tests, aptitude evaluations, and the shared question repository.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {subTab === 'questions' ? (
            <button onClick={() => setShowCreateQModal(true)} className="btn btn-primary" style={styles.actionBtn}>
              + Add Question
            </button>
          ) : (
            <button onClick={() => setShowCreateAModal(true)} className="btn btn-primary" style={styles.actionBtn}>
              + New Assessment
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{ ...styles.feedbackBox, backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Subtabs Switcher */}
      <div style={styles.subtabsBar}>
        <button
          onClick={() => setSubTab('questions')}
          style={{ ...styles.subtabBtn, ...(subTab === 'questions' ? styles.activeSubtab : {}) }}
        >
          Question Bank Repository
        </button>
        <button
          onClick={() => setSubTab('assessments')}
          style={{ ...styles.subtabBtn, ...(subTab === 'assessments' ? styles.activeSubtab : {}) }}
        >
          Curated Assessments
        </button>
      </div>

      {/* ---------------- Subtab: Questions ---------------- */}
      {subTab === 'questions' && (
        <>
          {qLoading ? (
            <div style={styles.stateBox}>
              <div style={styles.spinner}></div>
              <p>Loading question bank...</p>
            </div>
          ) : qError ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-danger)' }}>{qError}</p>
              <button onClick={fetchQuestions} className="btn btn-primary">Try Again</button>
            </div>
          ) : questions.length === 0 ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-text-muted)' }}>No questions in the repository yet.</p>
            </div>
          ) : (
            <div style={styles.questionsList}>
              {questions.map((q) => (
                <div key={q.id} className="card" style={styles.questionCard}>
                  <div style={styles.qTopRow}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span className="badge badge-role">{q.skill || 'General'}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                        {q.type} • {q.difficulty} • {q.points || 1} pt(s)
                      </span>
                    </div>
                  </div>
                  <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>{q.text}</h4>
                  <div style={styles.optionsGrid}>
                    {(q.options || []).map((opt) => {
                      const isCorrect = (q.correctKeys || []).includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          style={{
                            ...styles.optionItem,
                            backgroundColor: isCorrect ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)',
                            borderColor: isCorrect ? 'var(--color-success)' : 'var(--color-border)',
                          }}
                        >
                          <span style={{ fontWeight: 'bold' }}>{opt.key}:</span> {opt.text}
                          {isCorrect && <span style={{ marginLeft: 'auto', color: 'var(--color-success)', fontWeight: 'bold' }}>✓ Correct</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={styles.explanationBox}>
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- Subtab: Assessments ---------------- */}
      {subTab === 'assessments' && (
        <>
          {aLoading ? (
            <div style={styles.stateBox}>
              <div style={styles.spinner}></div>
              <p>Loading assessments...</p>
            </div>
          ) : aError ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-danger)' }}>{aError}</p>
              <button onClick={fetchAssessments} className="btn btn-primary">Try Again</button>
            </div>
          ) : assessments.length === 0 ? (
            <div style={styles.stateBox}>
              <p style={{ color: 'var(--color-text-muted)' }}>No assessments configured yet.</p>
            </div>
          ) : (
            <div style={styles.assessmentsGrid}>
              {assessments.map((a) => (
                <div key={a.id} className="card" style={styles.assessmentCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-primary)' }}>{a.title}</h4>
                      <span className="badge badge-role" style={{ marginTop: '4px' }}>
                        {a.role || 'General Role'}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="btn btn-outline"
                      style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}
                    >
                      Delete
                    </button>
                  </div>
                  {a.description && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{a.description}</p>}
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    <span>⏱ {a.durationMinutes || 30} mins</span>
                    <span>🎯 Passing: {a.passingScore || 50}%</span>
                    <span>📝 {a.questionIds?.length || 0} questions</span>
                  </div>
                  {a.skillSet && a.skillSet.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'var(--space-2)' }}>
                      {a.skillSet.map((s) => (
                        <span key={s} className="badge" style={{ backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal: Create Question */}
      {showCreateQModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCardLarge}>
            <h4>Add Question to Bank</h4>
            <form onSubmit={handleCreateQuestion} style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={styles.modalLabel}>Question Text *</label>
                <textarea
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="State the question clearly..."
                  style={{ ...styles.modalInput, minHeight: '60px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Target Skill</label>
                  <input
                    type="text"
                    value={qSkill}
                    onChange={(e) => setQSkill(e.target.value)}
                    placeholder="e.g. JavaScript, React"
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value)}
                    style={styles.modalInput}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.modalLabel}>Options (Check the correct answer)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {qOptions.map((opt, idx) => (
                    <div key={opt.key} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx].isCorrect = e.target.checked;
                          setQOptions(updated);
                        }}
                        title="Mark as correct answer"
                      />
                      <span style={{ fontWeight: 'bold', width: '20px' }}>{opt.key}</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx].text = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${opt.key} text`}
                        style={{ ...styles.modalInput, flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.modalLabel}>Explanation (Shown on result)</label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Why is this answer correct?"
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowCreateQModal(false)} className="btn btn-outline" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Assessment */}
      {showCreateAModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4>Create Curated Assessment</h4>
            <form onSubmit={handleCreateAssessment} style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={styles.modalLabel}>Assessment Title *</label>
                <input
                  type="text"
                  value={aTitle}
                  onChange={(e) => setATitle(e.target.value)}
                  placeholder="e.g. Frontend Fundamentals"
                  style={styles.modalInput}
                  required
                />
              </div>

              <div>
                <label style={styles.modalLabel}>Target Role</label>
                <input
                  type="text"
                  value={aRole}
                  onChange={(e) => setARole(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  style={styles.modalInput}
                />
              </div>

              <div>
                <label style={styles.modalLabel}>Skills Covered (Comma-separated)</label>
                <input
                  type="text"
                  value={aSkills}
                  onChange={(e) => setASkills(e.target.value)}
                  placeholder="e.g. React, JavaScript, HTML"
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Duration (mins)</label>
                  <input
                    type="number"
                    value={aDuration}
                    onChange={(e) => setADuration(e.target.value)}
                    min="5"
                    max="180"
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Passing %</label>
                  <input
                    type="number"
                    value={aPassing}
                    onChange={(e) => setAPassing(e.target.value)}
                    min="10"
                    max="100"
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowCreateAModal(false)} className="btn btn-outline" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4>Delete Assessment</h4>
            <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              Are you sure you want to delete assessment <strong>{deleteTarget.title}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-outline" disabled={isSubmitting}>
                Cancel
              </button>
              <button onClick={handleDeleteAssessment} className="btn btn-primary" disabled={isSubmitting} style={{ backgroundColor: 'var(--color-danger)' }}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  actionBtn: { fontSize: 'var(--font-size-xs)' },
  subtabsBar: { display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' },
  subtabBtn: { padding: 'var(--space-2) var(--space-4)', borderBottom: '2px solid transparent', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: 'var(--font-size-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  activeSubtab: { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: '600' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
  questionsList: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  questionCard: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  qTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' },
  optionItem: { display: 'flex', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)' },
  explanationBox: { marginTop: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' },
  assessmentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' },
  assessmentCard: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '480px', width: '100%' },
  modalCardLarge: { maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalLabel: { display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' },
  modalInput: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-surface)' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
};

export default AssessmentBankView;
