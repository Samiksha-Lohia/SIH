import React, { useState, useEffect, useCallback } from 'react';
import { institutionApi } from '../institution.api.js';

export function AssessmentCampaignView() {
  const [campaigns, setCampaigns] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Sub-view toggle: 'campaigns' | 'assessments' | 'questions'
  const [subTab, setSubTab] = useState('campaigns');

  // Campaign Modal states
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [selectedMonitorCampaignId, setSelectedMonitorCampaignId] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [loadingMonitor, setLoadingMonitor] = useState(false);
  const [monitorFilter, setMonitorFilter] = useState('all'); // 'all' | 'completed' | 'pending'

  // Question & Assessment Modal states
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Campaign
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    assessmentId: '',
    cohort: 'CSE-2026',
    assignMode: 'all', // 'all' | 'specific'
    selectedStudentIds: [],
    deadline: '',
  });

  // Form states for Assessment
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    role: '',
    difficulty: 'intermediate',
    durationMinutes: 30,
    passingScore: 70,
    description: '',
    questionIds: [],
  });

  // Form states for Question
  const [questionForm, setQuestionForm] = useState({
    text: '',
    skill: '',
    difficulty: 'intermediate',
    type: 'technical',
    options: [
      { key: 'A', text: '', isCorrect: true },
      { key: 'B', text: '', isCorrect: false },
      { key: 'C', text: '', isCorrect: false },
      { key: 'D', text: '', isCorrect: false },
    ],
    points: 2,
    explanation: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campRes, assessRes, questionsRes, studentsList, rolesData] = await Promise.all([
        institutionApi.listCampaigns({ limit: 50 }),
        institutionApi.listAssessments({ limit: 50 }),
        institutionApi.listQuestions({ limit: 100 }),
        institutionApi.listStudentsForCampaign(),
        institutionApi.listRoles(),
      ]);

      setCampaigns(campRes.campaigns || []);
      setAssessments(assessRes.assessments || []);
      setQuestions(questionsRes.questions || []);
      setAvailableStudents(studentsList || []);
      setRoles(rolesData || []);

      if (assessRes.assessments?.length && !campaignForm.assessmentId) {
        setCampaignForm((prev) => ({ ...prev, assessmentId: assessRes.assessments[0].id || assessRes.assessments[0]._id }));
      }
      if (rolesData?.length && !assessmentForm.role) {
        setAssessmentForm((prev) => ({ ...prev, role: rolesData[0].title }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment campaign data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Campaign Creation
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title.trim() || !campaignForm.assessmentId || !campaignForm.deadline) {
      setFeedback({ type: 'error', message: 'Title, Assessment, and Deadline are required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const studentIds =
        campaignForm.assignMode === 'specific'
          ? campaignForm.selectedStudentIds
          : availableStudents.map((s) => s.id);

      if (studentIds.length === 0) {
        throw new Error('Please select at least one student or ensure students are enrolled.');
      }

      const payload = {
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim() || undefined,
        assessmentId: campaignForm.assessmentId,
        cohort: campaignForm.cohort.trim() || 'General Cohort',
        studentIds,
        deadline: new Date(campaignForm.deadline).toISOString(),
      };

      await institutionApi.createCampaign(payload);
      setFeedback({ type: 'success', message: 'Assessment campaign created and assigned successfully!' });
      setShowCreateCampaignModal(false);
      setCampaignForm({
        title: '',
        description: '',
        assessmentId: assessments[0]?.id || '',
        cohort: 'CSE-2026',
        assignMode: 'all',
        selectedStudentIds: [],
        deadline: '',
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create campaign' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Campaign Monitor
  const handleOpenMonitor = async (campaignId) => {
    setSelectedMonitorCampaignId(campaignId);
    setLoadingMonitor(true);
    setMonitorFilter('all');
    try {
      const data = await institutionApi.getCampaign(campaignId);
      setMonitorData(data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load campaign monitor details' });
    } finally {
      setLoadingMonitor(false);
    }
  };

  // Handle Create Assessment
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
        questionIds: assessmentForm.questionIds,
      };
      await institutionApi.createAssessment(payload);
      setFeedback({ type: 'success', message: 'Assessment created successfully in question bank!' });
      setShowCreateAssessmentModal(false);
      setAssessmentForm({
        title: '',
        role: roles[0]?.title || '',
        difficulty: 'intermediate',
        durationMinutes: 30,
        passingScore: 70,
        description: '',
        questionIds: [],
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create assessment' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Question
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.text.trim() || !questionForm.skill.trim()) {
      setFeedback({ type: 'error', message: 'Question text and skill label are required.' });
      return;
    }

    const correctKeys = questionForm.options.filter((o) => o.isCorrect).map((o) => o.key);
    if (correctKeys.length === 0) {
      setFeedback({ type: 'error', message: 'Please mark at least one option as correct.' });
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
        options: questionForm.options.map((o) => ({ key: o.key, text: o.text.trim() })),
        correctKeys,
        points: Number(questionForm.points) || 1,
        explanation: questionForm.explanation.trim() || undefined,
      };

      await institutionApi.createQuestion(payload);
      setFeedback({ type: 'success', message: 'Question authored and added to bank!' });
      setShowCreateQuestionModal(false);
      setQuestionForm({
        text: '',
        skill: '',
        difficulty: 'intermediate',
        type: 'technical',
        options: [
          { key: 'A', text: '', isCorrect: true },
          { key: 'B', text: '', isCorrect: false },
          { key: 'C', text: '', isCorrect: false },
          { key: 'D', text: '', isCorrect: false },
        ],
        points: 2,
        explanation: '',
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to author question' });
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalAssignedStudents = campaigns.reduce((sum, c) => sum + (c.totalAssigned || 0), 0);
  const totalCompletedAttempts = campaigns.reduce((sum, c) => sum + (c.completedCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`,
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="b2b-tab-bar" role="tablist" style={{ marginBottom: 0 }}>
        <button
          role="tab"
          aria-selected={subTab === 'campaigns'}
          className={`b2b-tab ${subTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setSubTab('campaigns')}
        >
          Assessment Campaigns & Monitoring ({campaigns.length})
        </button>

        <button
          role="tab"
          aria-selected={subTab === 'assessments'}
          className={`b2b-tab ${subTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setSubTab('assessments')}
        >
          Question Bank Assessments ({assessments.length})
        </button>

        <button
          role="tab"
          aria-selected={subTab === 'questions'}
          className={`b2b-tab ${subTab === 'questions' ? 'active' : ''}`}
          onClick={() => setSubTab('questions')}
        >
          Question Authoring ({questions.length})
        </button>
      </div>

      {/* ===================== TAB 1: CAMPAIGNS & MONITORING ===================== */}
      {subTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Top Banner & KPI row */}
          <div className="b2b-kpi-grid">
            <div className="b2b-kpi-tile">
              <div className="b2b-kpi-label">Active Campaigns</div>
              <div className="b2b-kpi-value">{activeCampaigns}</div>
              <div className="b2b-kpi-subtext">Out of {totalCampaigns} total</div>
            </div>

            <div className="b2b-kpi-tile">
              <div className="b2b-kpi-label">Total Assigned Students</div>
              <div className="b2b-kpi-value" style={{ color: 'var(--color-steel-blue)' }}>{totalAssignedStudents}</div>
              <div className="b2b-kpi-subtext">Target cohort students</div>
            </div>

            <div className="b2b-kpi-tile">
              <div className="b2b-kpi-label">Completed Attempts</div>
              <div className="b2b-kpi-value" style={{ color: 'var(--color-emerald)' }}>{totalCompletedAttempts}</div>
              <div className="b2b-kpi-subtext">Evaluated with real scores</div>
            </div>

            <div className="b2b-kpi-tile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCreateCampaignModal(true)}
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: 'var(--font-size-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)'
                }}
              >
                Create Assessment Campaign
              </button>
            </div>
          </div>

          {/* Campaigns Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', margin: 0, fontWeight: 700 }}>
              Live Institutional Assessment Drives
            </h3>

            {loading ? (
              <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto var(--space-3)', animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading assessment campaigns from institutional database...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', borderStyle: 'dashed' }}>
                <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-primary)', fontSize: 'var(--font-size-md)' }}>No Assessment Campaigns Created Yet</h4>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', maxWidth: '500px', margin: '0 auto var(--space-4)' }}>
                  Create an assessment campaign to benchmark your students, track skill proficiency gaps, and monitor readiness scores.
                </p>
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Create Your First Campaign →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-4)' }}>
                {campaigns.map((camp) => {
                  const deadlineDate = new Date(camp.deadline);
                  const isOverdue = deadlineDate < new Date();
                  const compRate = camp.completionRate || 0;

                  return (
                    <div
                      key={camp.id}
                      className="card"
                      style={{
                        padding: 'var(--space-5)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--space-4)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                          <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                            Cohort: {camp.cohort || 'All Students'}
                          </span>
                          <span className={`status-pill ${isOverdue ? 'status-rejected' : 'status-verified'}`} style={{ fontSize: '11px' }}>
                            <span className="status-pill-dot" />
                            {isOverdue ? 'Closed / Expired' : 'Active'}
                          </span>
                        </div>

                        <h4 style={{ margin: 'var(--space-1) 0 var(--space-2)', fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {camp.title}
                        </h4>

                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                          Assessment: <strong style={{ color: 'var(--color-text)' }}>{camp.assessment?.title || 'Custom Test'}</strong>
                        </div>

                        {camp.description && (
                          <p style={{ margin: '0 0 var(--space-3)', fontSize: '11px', color: 'var(--color-text-secondary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {camp.description}
                          </p>
                        )}

                        {/* Progress meter */}
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                            <span>Completion ({camp.completedCount || 0}/{camp.totalAssigned || 0})</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{compRate}%</span>
                          </div>
                          <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${compRate}%`, backgroundColor: compRate === 100 ? 'var(--color-emerald)' : 'var(--color-steel-blue)', transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
                          {camp.avgScore !== null && (
                            <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Avg Score: {camp.avgScore}%</span>
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenMonitor(camp.id)}
                          className="btn btn-ghost"
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                          }}
                        >
                          Monitor Campaign & Students →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: QUESTION BANK ASSESSMENTS ===================== */}
      {subTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>Question Bank Assessment Suites</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                Standardized technical and role-aligned evaluations ready to be assigned to campaigns.
              </p>
            </div>
            <button
              onClick={() => setShowCreateAssessmentModal(true)}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
            >
              Author New Assessment
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-4)' }}>
            {assessments.map((a) => (
              <div key={a.id || a._id} className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-steel-blue)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {a.type || 'technical'} • {a.difficulty || 'intermediate'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{a.durationMinutes || 30} mins</span>
                  </div>
                  <h4 style={{ margin: '0 0 var(--space-1)', color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{a.title}</h4>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
                    Target Role: <strong>{a.role || 'General Engineering'}</strong>
                  </div>
                  {a.description && <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2)' }}>{a.description}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(a.skillSet || []).map((sk, i) => (
                      <span key={i} className="badge badge-sky" style={{ fontSize: '10px' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Pass mark: {a.passingScore || 50}%</span>
                  <button
                    onClick={() => {
                      setCampaignForm((prev) => ({ ...prev, assessmentId: a.id || a._id, title: `${a.title} Cohort Benchmark` }));
                      setShowCreateCampaignModal(true);
                    }}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Assign to Cohort →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: QUESTION AUTHORING ===================== */}
      {subTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>Question Bank Repository</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                Canonical questions linked to skill taxonomy. Answers are evaluated via deterministic correctness checks.
              </p>
            </div>
            <button
              onClick={() => setShowCreateQuestionModal(true)}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
            >
              Add New Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {questions.map((q) => (
              <div key={q.id || q._id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                    Skill: {q.skill || 'General'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {q.difficulty} • {q.points || 1} pt(s)
                  </span>
                </div>
                <div style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{q.text}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)', fontSize: '11px' }}>
                  {(q.options || []).map((opt) => {
                    const isCorrect = (q.correctKeys || []).includes(opt.key);
                    return (
                      <div
                        key={opt.key}
                        style={{
                          padding: 'var(--space-2)',
                          backgroundColor: isCorrect ? 'var(--color-success-bg)' : 'var(--color-bg-app)',
                          border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: isCorrect ? 'var(--color-success)' : 'var(--color-text-secondary)'
                        }}
                      >
                        <strong>{opt.key}:</strong> {opt.text} {isCorrect && '✓'}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE ASSESSMENT CAMPAIGN ===================== */}
      {showCreateCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Create Assessment Campaign</h3>
              <button onClick={() => setShowCreateCampaignModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn 2026 Full Stack Core Competency Drive"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Select Assessment from Question Bank *</label>
                <select
                  required
                  value={campaignForm.assessmentId}
                  onChange={(e) => setCampaignForm({ ...campaignForm, assessmentId: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose Assessment --</option>
                  {assessments.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      {a.title} ({a.role || 'Engineering'} • {a.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Target Cohort / Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE-2026"
                    value={campaignForm.cohort}
                    onChange={(e) => setCampaignForm({ ...campaignForm, cohort: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Campaign Deadline *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={campaignForm.deadline}
                    onChange={(e) => setCampaignForm({ ...campaignForm, deadline: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Student Assignment Mode</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="assignMode"
                      value="all"
                      checked={campaignForm.assignMode === 'all'}
                      onChange={() => setCampaignForm({ ...campaignForm, assignMode: 'all' })}
                    />
                    Assign to All Enrolled Students ({availableStudents.length})
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="assignMode"
                      value="specific"
                      checked={campaignForm.assignMode === 'specific'}
                      onChange={() => setCampaignForm({ ...campaignForm, assignMode: 'specific' })}
                    />
                    Select Specific Students
                  </label>
                </div>

                {campaignForm.assignMode === 'specific' && (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-app)' }}>
                    {availableStudents.map((st) => {
                      const isChecked = campaignForm.selectedStudentIds.includes(st.id);
                      return (
                        <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCampaignForm({ ...campaignForm, selectedStudentIds: [...campaignForm.selectedStudentIds, st.id] });
                              } else {
                                setCampaignForm({ ...campaignForm, selectedStudentIds: campaignForm.selectedStudentIds.filter((id) => id !== st.id) });
                              }
                            }}
                          />
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>{st.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>({st.email} • {st.branch})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Description / Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students taking this assessment..."
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="btn btn-ghost"
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
                  {submitting ? 'Creating...' : 'Create & Assign Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MONITOR CAMPAIGN ===================== */}
      {selectedMonitorCampaignId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Campaign Performance Monitor</h3>
                  <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                    {monitorData?.cohort || 'Cohort'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                  Campaign: <strong style={{ color: 'var(--color-text)' }}>{monitorData?.title}</strong> • Assessment: {monitorData?.assessment?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedMonitorCampaignId(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingMonitor ? (
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading real-time student attempt records...</p>
              </div>
            ) : !monitorData ? (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>Failed to load campaign data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Real-time KPI summary */}
                <div className="b2b-kpi-grid">
                  <div className="b2b-kpi-tile">
                    <div className="b2b-kpi-label">Total Assigned</div>
                    <div className="b2b-kpi-value">{monitorData.stats?.totalAssigned || 0}</div>
                  </div>

                  <div className="b2b-kpi-tile">
                    <div className="b2b-kpi-label">Completed</div>
                    <div className="b2b-kpi-value" style={{ color: 'var(--color-emerald)' }}>{monitorData.stats?.completedCount || 0}</div>
                  </div>

                  <div className="b2b-kpi-tile">
                    <div className="b2b-kpi-label">Pending Attempt</div>
                    <div className="b2b-kpi-value" style={{ color: 'var(--color-amber)' }}>{monitorData.stats?.pendingCount || 0}</div>
                  </div>

                  <div className="b2b-kpi-tile">
                    <div className="b2b-kpi-label">Passed (&gt;={monitorData.assessment?.passingScore || 50}%)</div>
                    <div className="b2b-kpi-value" style={{ color: 'var(--color-steel-blue)' }}>{monitorData.stats?.passedCount || 0}</div>
                  </div>

                  <div className="b2b-kpi-tile">
                    <div className="b2b-kpi-label">Average Score</div>
                    <div className="b2b-kpi-value">
                      {monitorData.stats?.avgScore !== null ? `${monitorData.stats.avgScore}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Filter and Student Breakdown Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Student Progress Breakdown</h4>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      {['all', 'completed', 'pending'].map((flt) => (
                        <button
                          key={flt}
                          onClick={() => setMonitorFilter(flt)}
                          className={`btn ${monitorFilter === flt ? 'btn-primary' : 'btn-ghost'}`}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            textTransform: 'capitalize'
                          }}
                        >
                          {flt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Calculated Score</th>
                          <th>Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(monitorData.students || [])
                          .filter((s) => {
                            if (monitorFilter === 'completed') return s.status === 'completed';
                            if (monitorFilter === 'pending') return s.status !== 'completed';
                            return true;
                          })
                          .map((st) => (
                            <tr key={st.studentId}>
                              <td><strong style={{ color: 'var(--color-primary)' }}>{st.name}</strong></td>
                              <td style={{ color: 'var(--color-text-secondary)' }}>{st.email}</td>
                              <td>
                                <span className={`status-pill ${st.status === 'completed' ? 'status-verified' : 'status-pending'}`}>
                                  <span className="status-pill-dot" />
                                  {st.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td>
                                {st.score !== null ? (
                                  <span style={{ fontWeight: 700, color: st.passed ? 'var(--color-emerald)' : 'var(--color-burgundy-red)' }}>
                                    {st.score}% {st.passed ? '(Passed)' : '(Failed)'}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)' }}>Not attempted</span>
                                )}
                              </td>
                              <td style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                                {st.completedAt ? new Date(st.completedAt).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleOpenMonitor(selectedMonitorCampaignId)}
                    className="btn btn-ghost"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    Refresh Live Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE ASSESSMENT ===================== */}
      {showCreateAssessmentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Author New Assessment</h3>
              <button onClick={() => setShowCreateAssessmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAssessment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Cloud Evaluation"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Target Role *</label>
                  <select
                    value={assessmentForm.role}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, role: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  >
                    {roles.map((r) => (
                      <option key={r.id || r._id} value={r.title}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Difficulty</label>
                  <select
                    value={assessmentForm.difficulty}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={assessmentForm.durationMinutes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, durationMinutes: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Passing Score (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={assessmentForm.passingScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, passingScore: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Link Questions from Bank</label>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-app)' }}>
                  {questions.map((q) => {
                    const qId = q.id || q._id;
                    const isChecked = assessmentForm.questionIds.includes(qId);
                    return (
                      <label key={qId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-2)', cursor: 'pointer', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssessmentForm({ ...assessmentForm, questionIds: [...assessmentForm.questionIds, qId] });
                            } else {
                              setAssessmentForm({ ...assessmentForm, questionIds: assessmentForm.questionIds.filter((id) => id !== qId) });
                            }
                          }}
                        />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text)' }}>{q.text.slice(0, 60)}...</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-steel-blue)' }}>({q.skill})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowCreateAssessmentModal(false)} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {submitting ? 'Creating...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE QUESTION ===================== */}
      {showCreateQuestionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Author Question</h3>
              <button onClick={() => setShowCreateQuestionModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Which concurrency primitive in Go is used to prevent race conditions?"
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Skill Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React, Node.js, Python"
                    value={questionForm.skill}
                    onChange={(e) => setQuestionForm({ ...questionForm, skill: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Multiple Choice Options (Check the correct key)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {questionForm.options.map((opt, idx) => (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...questionForm.options];
                          updated[idx].isCorrect = e.target.checked;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)', width: '20px', fontSize: 'var(--font-size-xs)' }}>{opt.key}:</span>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${opt.key} text`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...questionForm.options];
                          updated[idx].text = e.target.value;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                        style={{ flex: 1, padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowCreateQuestionModal(false)} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  {submitting ? 'Authoring...' : 'Save Question to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentCampaignView;
