import React, { useState, useEffect, useCallback } from 'react';
import { institutionApi } from '../institution.api.js';

export function AssessmentCampaignView() {
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Sub-view toggle
  const [subTab, setSubTab] = useState('assessments'); // 'assessments' | 'questions'

  // Modal states
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    role: '',
    difficulty: 'intermediate',
    durationMinutes: 30,
    passingScore: 70,
    description: '',
    questions: [],
  });

  const [questionForm, setQuestionForm] = useState({
    text: '',
    skill: '',
    difficulty: 'intermediate',
    type: 'multiple_choice',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessRes, questionsRes, analyticsData, rolesData] = await Promise.all([
        institutionApi.listAssessments({ limit: 50 }),
        institutionApi.listQuestions({ limit: 50 }),
        institutionApi.getInstitutionAnalytics(),
        institutionApi.listRoles(),
      ]);
      setAssessments(assessRes.assessments || []);
      setQuestions(questionsRes.questions || []);
      setAnalytics(analyticsData);
      setRoles(rolesData || []);
      if (rolesData?.length && !assessmentForm.role) {
        setAssessmentForm((prev) => ({ ...prev, role: rolesData[0].title }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!assessmentForm.title.trim() || !assessmentForm.role.trim()) {
      setFeedback({ type: 'error', message: 'Title and target role are required.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        title: assessmentForm.title.trim(),
        role: assessmentForm.role.trim(),
        difficulty: assessmentForm.difficulty,
        durationMinutes: Number(assessmentForm.durationMinutes),
        passingScore: Number(assessmentForm.passingScore),
        description: assessmentForm.description.trim() || undefined,
        questions: assessmentForm.questions.length ? assessmentForm.questions : undefined,
      };
      await institutionApi.createAssessment(payload);
      setFeedback({ type: 'success', message: 'Assessment created successfully!' });
      setShowCreateAssessmentModal(false);
      setAssessmentForm({
        title: '',
        role: roles[0]?.title || '',
        difficulty: 'intermediate',
        durationMinutes: 30,
        passingScore: 70,
        description: '',
        questions: [],
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create assessment' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssessment = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assessment "${title}"?`)) return;
    try {
      await institutionApi.deleteAssessment(id);
      setFeedback({ type: 'success', message: 'Assessment deleted successfully.' });
      setAssessments((prev) => prev.filter((a) => a._id !== id && a.id !== id));
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete assessment' });
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.text.trim() || !questionForm.skill.trim()) {
      setFeedback({ type: 'error', message: 'Question text and skill label are required.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        text: questionForm.text.trim(),
        skill: questionForm.skill.trim(),
        difficulty: questionForm.difficulty,
        type: questionForm.type,
        options: questionForm.options.filter((o) => o.text.trim()),
      };
      await institutionApi.createQuestion(payload);
      setFeedback({ type: 'success', message: 'Question added to question bank successfully!' });
      setShowCreateQuestionModal(false);
      setQuestionForm({
        text: '',
        skill: '',
        difficulty: 'intermediate',
        type: 'multiple_choice',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create question' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.spinner} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Loading assessment monitoring records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateBox}>
        <p style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>{error}</p>
        <button onClick={loadData} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.heading}>Skill Assessments & Question Bank</h3>
          <p style={styles.subHeading}>
            Configure institutional skill assessments, evaluate student proficiency, and monitor completion rates.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setShowCreateAssessmentModal(true)}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            + Create Assessment
          </button>
          <button
            onClick={() => setShowCreateQuestionModal(true)}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Missing Backend Campaign Entity Notice */}
      <div style={styles.noticeBox}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          <strong>Assessment Campaign Note:</strong> Assessments and institutional completion tracking are fully powered by SUTRA's real{' '}
          <code>/api/assessments</code> and <code>/api/analytics/institution</code> endpoints. Dedicated cohort scheduling campaign routes (
          <code>/api/campaigns</code>) are marked as <em>Backend Missing</em> and not mocked.
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      {/* KPI Monitoring Strip */}
      <div style={styles.kpiGrid}>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Assessed Students</span>
          <span style={styles.kpiValue}>{analytics?.assessedStudents || 0}</span>
          <span style={styles.kpiMeta}>Tested via standardized assessments</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Cohort Average Score</span>
          <span style={{ ...styles.kpiValue, color: 'var(--color-emerald)' }}>
            {analytics?.averageAssessmentScore || 0}%
          </span>
          <span style={styles.kpiMeta}>Average performance across attempts</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Active Assessment Bank</span>
          <span style={styles.kpiValue}>{assessments.length}</span>
          <span style={styles.kpiMeta}>Ready for student deployment</span>
        </div>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Question Bank Size</span>
          <span style={styles.kpiValue}>{questions.length}</span>
          <span style={styles.kpiMeta}>Vetted technical questions</span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          onClick={() => setSubTab('assessments')}
          style={{
            ...styles.tabBtn,
            ...(subTab === 'assessments' ? styles.activeTabBtn : {}),
          }}
        >
          📝 Published Assessments ({assessments.length})
        </button>
        <button
          onClick={() => setSubTab('questions')}
          style={{
            ...styles.tabBtn,
            ...(subTab === 'questions' ? styles.activeTabBtn : {}),
          }}
        >
          💡 Question Bank ({questions.length})
        </button>
      </div>

      {/* Sub-Tab 1: Assessments Table */}
      {subTab === 'assessments' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-mist-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Target Role</th>
                  <th style={styles.th}>Difficulty</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Passing Score</th>
                  <th style={styles.th}>Questions</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a, idx) => (
                  <tr
                    key={a.id || a._id || idx}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      backgroundColor: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'var(--color-bg-app)',
                    }}
                  >
                    <td style={styles.td}>
                      <strong style={{ color: 'var(--color-primary)' }}>{a.title}</strong>
                      {a.description && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {a.description}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span className="badge badge-sky" style={{ fontSize: '10px' }}>
                        {a.role || 'General'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontWeight: '600',
                          color: a.difficulty === 'advanced' ? 'var(--color-danger)' : a.difficulty === 'intermediate' ? 'var(--color-amber)' : 'var(--color-emerald)',
                        }}
                      >
                        {a.difficulty || 'intermediate'}
                      </span>
                    </td>
                    <td style={styles.td}>{a.durationMinutes || 30} mins</td>
                    <td style={styles.td}>{a.passingScore || 70}%</td>
                    <td style={styles.td}>{a.questions?.length || 0} questions</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDeleteAssessment(a.id || a._id, a.title)}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--color-danger)', borderColor: 'var(--color-border)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No assessments created yet. Click "+ Create Assessment" above to deploy an evaluation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Question Bank Table */}
      {subTab === 'questions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-mist-light)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={styles.th}>Question Prompt</th>
                  <th style={styles.th}>Skill Tag</th>
                  <th style={styles.th}>Difficulty</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Answer Options</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr
                    key={q.id || q._id || idx}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      backgroundColor: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'var(--color-bg-app)',
                    }}
                  >
                    <td style={{ ...styles.td, maxWidth: '350px' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{q.text}</strong>
                    </td>
                    <td style={styles.td}>
                      <span className="badge badge-sky" style={{ fontSize: '10px' }}>
                        {q.skill}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {q.type?.replace('_', ' ') || 'multiple choice'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '11px' }}>
                        {q.options?.length || 0} options
                      </span>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      No questions in question bank yet. Click "+ Add Question" to contribute technical questions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Assessment */}
      {showCreateAssessmentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)' }}>
                Create New Skill Assessment
              </h4>
              <button onClick={() => setShowCreateAssessmentModal(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleCreateAssessment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div>
                <label style={styles.label}>Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  placeholder="e.g. Advanced React & TypeScript Benchmark"
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={styles.label}>Target Career Role *</label>
                  <select
                    value={assessmentForm.role}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, role: e.target.value })}
                    style={styles.select}
                  >
                    {roles.map((r) => (
                      <option key={r.slug || r.title} value={r.title}>{r.title}</option>
                    ))}
                    {!roles.some((r) => r.title === assessmentForm.role) && (
                      <option value={assessmentForm.role}>{assessmentForm.role || 'Select Role'}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Difficulty Level</label>
                  <select
                    value={assessmentForm.difficulty}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}
                    style={styles.select}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={styles.label}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={assessmentForm.durationMinutes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, durationMinutes: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Passing Score (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={assessmentForm.passingScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, passingScore: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Assessment Description</label>
                <textarea
                  rows="2"
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  placeholder="Instructions for students taking this assessment..."
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAssessmentModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {submitting ? 'Creating...' : 'Save & Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Question */}
      {showCreateQuestionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)' }}>
                Add Question to Question Bank
              </h4>
              <button onClick={() => setShowCreateQuestionModal(false)} style={styles.modalClose}>×</button>
            </div>

            <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div>
                <label style={styles.label}>Question Prompt *</label>
                <textarea
                  rows="2"
                  required
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  placeholder="Enter the technical challenge or question..."
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={styles.label}>Skill Tag *</label>
                  <input
                    type="text"
                    required
                    value={questionForm.skill}
                    onChange={(e) => setQuestionForm({ ...questionForm, skill: e.target.value })}
                    placeholder="e.g. React, Docker, Python"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    style={styles.select}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Answer Options</label>
                {questionForm.options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = questionForm.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setQuestionForm({ ...questionForm, options: updated });
                      }}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}${idx === 0 ? ' (Correct Answer)' : ''}`}
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...questionForm.options];
                        updated[idx].text = e.target.value;
                        setQuestionForm({ ...questionForm, options: updated });
                      }}
                      style={{ ...styles.input, flex: 1 }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(false)}
                  className="btn btn-outline"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {submitting ? 'Saving...' : 'Add to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' },
  heading: { margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' },
  subHeading: { margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' },
  noticeBox: { padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(141, 161, 185, 0.4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' },
  feedbackBox: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' },
  closeBtn: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' },
  kpiCard: { padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '2px' },
  kpiLabel: { fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase' },
  kpiValue: { fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--color-primary)' },
  kpiMeta: { fontSize: '11px', color: 'var(--color-text-muted)' },
  tabNav: { display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' },
  tabBtn: { padding: 'var(--space-2) var(--space-4)', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' },
  activeTabBtn: { color: 'var(--color-burgundy-red)', borderBottomColor: 'var(--color-burgundy-red)' },
  th: { padding: 'var(--space-3) var(--space-4)', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: '11px' },
  td: { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', maxWidth: '520px', width: '100%', padding: 'var(--space-6)', border: '1px solid var(--color-border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' },
  modalClose: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-muted)' },
  label: { display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' },
  input: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-app)' },
  select: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-app)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default AssessmentCampaignView;
