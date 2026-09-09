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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: feedback.type === 'success' ? '#4ade80' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #1f2937', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSubTab('campaigns')}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: subTab === 'campaigns' ? '#2563eb' : '#1e293b',
            color: subTab === 'campaigns' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>🎯</span> Assessment Campaigns & Cohort Monitoring
          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('assessments')}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: subTab === 'assessments' ? '#2563eb' : '#1e293b',
            color: subTab === 'assessments' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>📋</span> Question Bank Assessments
          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
            {assessments.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('questions')}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: subTab === 'questions' ? '#2563eb' : '#1e293b',
            color: subTab === 'questions' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>❓</span> Question Bank Authoring
          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
            {questions.length}
          </span>
        </button>
      </div>

      {/* ===================== TAB 1: CAMPAIGNS & MONITORING ===================== */}
      {subTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Banner & KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Active Campaigns</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f9fafb', margin: '0.35rem 0 0' }}>{activeCampaigns}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Out of {totalCampaigns} total</div>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Total Assigned Students</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8', margin: '0.35rem 0 0' }}>{totalAssignedStudents}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Target cohort students</div>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Completed Attempts</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34d399', margin: '0.35rem 0 0' }}>{totalCompletedAttempts}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Evaluated with real scores</div>
            </div>

            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCreateCampaignModal(true)}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>➕</span> Create Assessment Campaign
              </button>
            </div>
          </div>

          {/* Campaigns Grid */}
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: '0 0 1rem' }}>Live Institutional Assessment Drives</h3>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #374151', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                <p>Loading assessment campaigns from institutional database...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#111827', borderRadius: '12px', border: '1px dashed #374151' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
                <h4 style={{ margin: '0 0 0.5rem', color: '#f9fafb' }}>No Assessment Campaigns Created Yet</h4>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                  Create an assessment campaign to benchmark your students, track skill proficiency gaps, and monitor readiness scores.
                </p>
                <button
                  onClick={() => setShowCreateCampaignModal(true)}
                  style={{ padding: '0.6rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Your First Campaign →
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {campaigns.map((camp) => {
                  const deadlineDate = new Date(camp.deadline);
                  const isOverdue = deadlineDate < new Date();
                  const compRate = camp.completionRate || 0;

                  return (
                    <div
                      key={camp.id}
                      style={{
                        backgroundColor: '#111827',
                        border: '1px solid #1f2937',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
                            Cohort: {camp.cohort || 'All Students'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isOverdue ? '#f87171' : '#4ade80',
                              backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            {isOverdue ? 'Closed / Expired' : '● Active'}
                          </span>
                        </div>

                        <h4 style={{ margin: '0.35rem 0 0.5rem', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                          {camp.title}
                        </h4>

                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                          Assessment: <strong style={{ color: '#cbd5e1' }}>{camp.assessment?.title || 'Custom Test'}</strong>
                        </div>

                        {camp.description && (
                          <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: '#9ca3af', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {camp.description}
                          </p>
                        )}

                        {/* Progress meter */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                            <span>Completion ({camp.completedCount || 0}/{camp.totalAssigned || 0})</span>
                            <span style={{ fontWeight: 700, color: '#f9fafb' }}>{compRate}%</span>
                          </div>
                          <div style={{ height: '6px', backgroundColor: '#1f2937', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${compRate}%`, backgroundColor: compRate === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
                          <span>Deadline: {deadlineDate.toLocaleDateString()}</span>
                          {camp.avgScore !== null && (
                            <span style={{ color: '#34d399', fontWeight: 600 }}>Avg Score: {camp.avgScore}%</span>
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #1f2937', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenMonitor(camp.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#38bdf8',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <span>📊</span> Monitor Campaign & Students →
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Question Bank Assessment Suites</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>
                Standardized technical and role-aligned evaluations ready to be assigned to campaigns.
              </p>
            </div>
            <button
              onClick={() => setShowCreateAssessmentModal(true)}
              style={{ padding: '0.6rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              ➕ Author New Assessment
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {assessments.map((a) => (
              <div key={a.id || a._id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                      {a.type || 'technical'} • {a.difficulty || 'intermediate'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{a.durationMinutes || 30} mins</span>
                  </div>
                  <h4 style={{ margin: '0 0 0.35rem', color: '#f9fafb', fontSize: '1.05rem' }}>{a.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    Target Role: <strong>{a.role || 'General Engineering'}</strong>
                  </div>
                  {a.description && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem' }}>{a.description}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(a.skillSet || []).map((sk, i) => (
                      <span key={i} style={{ backgroundColor: '#1f2937', color: '#cbd5e1', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1f2937', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pass mark: {a.passingScore || 50}%</span>
                  <button
                    onClick={() => {
                      setCampaignForm((prev) => ({ ...prev, assessmentId: a.id || a._id, title: `${a.title} Cohort Benchmark` }));
                      setShowCreateCampaignModal(true);
                    }}
                    style={{ padding: '0.4rem 0.85rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Assign to Cohort 🚀
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: QUESTION AUTHORING ===================== */}
      {subTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Question Bank Repository</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>
                Canonical questions linked to skill taxonomy. Answers are evaluated via deterministic correctness checks.
              </p>
            </div>
            <button
              onClick={() => setShowCreateQuestionModal(true)}
              style={{ padding: '0.6rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              ➕ Add New Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {questions.map((q) => (
              <div key={q.id || q._id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Skill: {q.skill || 'General'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                    {q.difficulty} • {q.points || 1} pt(s)
                  </span>
                </div>
                <div style={{ color: '#f9fafb', fontSize: '0.95rem', fontWeight: 600, margin: '0.35rem 0 0.5rem' }}>{q.text}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {(q.options || []).map((opt) => {
                    const isCorrect = (q.correctKeys || []).includes(opt.key);
                    return (
                      <div key={opt.key} style={{ padding: '0.4rem 0.6rem', backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.1)' : '#1f2937', border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.4)' : '#374151'}`, borderRadius: '6px', color: isCorrect ? '#4ade80' : '#d1d5db' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>🎯 Create Assessment Campaign</h3>
              <button onClick={() => setShowCreateCampaignModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autumn 2026 Full Stack Core Competency Drive"
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Select Assessment from Question Bank *</label>
                <select
                  required
                  value={campaignForm.assessmentId}
                  onChange={(e) => setCampaignForm({ ...campaignForm, assessmentId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose Assessment --</option>
                  {assessments.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      {a.title} ({a.role || 'Engineering'} • {a.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Target Cohort / Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE-2026"
                    value={campaignForm.cohort}
                    onChange={(e) => setCampaignForm({ ...campaignForm, cohort: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Campaign Deadline *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={campaignForm.deadline}
                    onChange={(e) => setCampaignForm({ ...campaignForm, deadline: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Student Assignment Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="assignMode"
                      value="all"
                      checked={campaignForm.assignMode === 'all'}
                      onChange={() => setCampaignForm({ ...campaignForm, assignMode: 'all' })}
                    />
                    Assign to All Enrolled Students ({availableStudents.length})
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer' }}>
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
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #374151', borderRadius: '6px', padding: '0.5rem', backgroundColor: '#0f172a' }}>
                    {availableStudents.map((st) => {
                      const isChecked = campaignForm.selectedStudentIds.includes(st.id);
                      return (
                        <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem', cursor: 'pointer', borderBottom: '1px solid #1f2937' }}>
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
                          <span style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{st.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({st.email} • {st.branch})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Description / Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Instructions for students taking this assessment..."
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  style={{ padding: '0.55rem 1rem', backgroundColor: '#1f2937', color: '#d1d5db', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.55rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.35rem' }}>📊 Campaign Performance Monitor</h3>
                  <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {monitorData?.cohort || 'Cohort'}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>
                  Campaign: <strong style={{ color: '#f1f5f9' }}>{monitorData?.title}</strong> • Assessment: {monitorData?.assessment?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedMonitorCampaignId(null)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingMonitor ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                <p>Loading real-time student attempt records...</p>
              </div>
            ) : !monitorData ? (
              <p style={{ color: '#f87171' }}>Failed to load campaign data.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Real-time KPI summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Assigned</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{monitorData.stats?.totalAssigned || 0}</div>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Completed</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80' }}>{monitorData.stats?.completedCount || 0}</div>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending / Not Attempted</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24' }}>{monitorData.stats?.pendingCount || 0}</div>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Passed (&gt;={monitorData.assessment?.passingScore || 50}%)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{monitorData.stats?.passedCount || 0}</div>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Average Score</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c084fc' }}>
                      {monitorData.stats?.avgScore !== null ? `${monitorData.stats.avgScore}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Filter and Student Breakdown Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>Student Progress Breakdown</h4>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {['all', 'completed', 'pending'].map((flt) => (
                        <button
                          key={flt}
                          onClick={() => setMonitorFilter(flt)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            backgroundColor: monitorFilter === flt ? '#2563eb' : '#1f2937',
                            color: monitorFilter === flt ? '#fff' : '#9ca3af',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {flt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Calculated Score</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Completed At</th>
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
                            <tr key={st.studentId} style={{ borderBottom: '1px solid #1f2937' }}>
                              <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 600 }}>{st.name}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{st.email}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    backgroundColor:
                                      st.status === 'completed'
                                        ? 'rgba(34, 197, 94, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                    color: st.status === 'completed' ? '#4ade80' : '#fbbf24',
                                  }}
                                >
                                  {st.status === 'completed' ? '✓ Completed' : 'Pending Attempt'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                {st.score !== null ? (
                                  <span style={{ fontWeight: 700, color: st.passed ? '#34d399' : '#f87171' }}>
                                    {st.score}% {st.passed ? '(Passed)' : '(Failed)'}
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b' }}>Not attempted</span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
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
                    style={{ padding: '0.45rem 0.9rem', backgroundColor: '#1f2937', color: '#cbd5e1', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    🔄 Refresh Live Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE ASSESSMENT ===================== */}
      {showCreateAssessmentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>📋 Author New Assessment</h3>
              <button onClick={() => setShowCreateAssessmentModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAssessment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Cloud Evaluation"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Target Role *</label>
                  <select
                    value={assessmentForm.role}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, role: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  >
                    {roles.map((r) => (
                      <option key={r.id || r._id} value={r.title}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Difficulty</label>
                  <select
                    value={assessmentForm.difficulty}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={assessmentForm.durationMinutes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, durationMinutes: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Passing Score (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={assessmentForm.passingScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, passingScore: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Link Questions from Bank</label>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #374151', borderRadius: '6px', padding: '0.5rem', backgroundColor: '#0f172a' }}>
                  {questions.map((q) => {
                    const qId = q.id || q._id;
                    const isChecked = assessmentForm.questionIds.includes(qId);
                    return (
                      <label key={qId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem', cursor: 'pointer', borderBottom: '1px solid #1f2937' }}>
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
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{q.text.slice(0, 60)}...</span>
                        <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>({q.skill})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateAssessmentModal(false)} style={{ padding: '0.55rem 1rem', backgroundColor: '#1f2937', color: '#d1d5db', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  {submitting ? 'Creating...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE QUESTION ===================== */}
      {showCreateQuestionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>❓ Author Question</h3>
              <button onClick={() => setShowCreateQuestionModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Which concurrency primitive in Go is used to prevent race conditions?"
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Skill Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. React, Node.js, Python"
                    value={questionForm.skill}
                    onChange={(e) => setQuestionForm({ ...questionForm, skill: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Multiple Choice Options (Check the correct key)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {questionForm.options.map((opt, idx) => (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...questionForm.options];
                          updated[idx].isCorrect = e.target.checked;
                          setQuestionForm({ ...questionForm, options: updated });
                        }}
                      />
                      <span style={{ fontWeight: 700, color: '#9ca3af', width: '20px' }}>{opt.key}:</span>
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
                        style={{ flex: 1, padding: '0.45rem', backgroundColor: '#0f172a', border: '1px solid #374151', borderRadius: '4px', color: '#fff' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateQuestionModal(false)} style={{ padding: '0.55rem 1rem', backgroundColor: '#1f2937', color: '#d1d5db', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
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
