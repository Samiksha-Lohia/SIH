import React, { useState, useEffect } from 'react';
import { facultyApi } from '../faculty.api.js';

export default function FacultyCockpitView({ facultyUser, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Data states
  const [mentorships, setMentorships] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [academicStats, setAcademicStats] = useState({ total: 0 });

  // Filters & Modal states
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all'); // all, mentor, mentee

  const [respondModal, setRespondModal] = useState({
    isOpen: false,
    item: null,
    action: 'accepted', // 'accepted' | 'declined'
    message: '',
  });

  const [progressModal, setProgressModal] = useState({
    isOpen: false,
    item: null,
    progress: 0,
  });

  const loadCockpitData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mentorshipRes, enrollRes, oppRes] = await Promise.allSettled([
        facultyApi.listMyMentorships({ limit: 50 }),
        facultyApi.listMyEnrollments({ limit: 50 }),
        facultyApi.listAcademicOpportunities({ limit: 1 }),
      ]);

      if (mentorshipRes.status === 'fulfilled') {
        setMentorships(mentorshipRes.value.mentorships || []);
      } else {
        console.error('Failed to load mentorships:', mentorshipRes.reason);
      }

      if (enrollRes.status === 'fulfilled') {
        setEnrollments(enrollRes.value.enrollments || []);
      } else {
        console.error('Failed to load enrollments:', enrollRes.reason);
      }

      if (oppRes.status === 'fulfilled') {
        setAcademicStats({ total: oppRes.value.meta?.total || 0 });
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize faculty cockpit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCockpitData();
  }, []);

  const handleOpenRespondModal = (item, action) => {
    setRespondModal({
      isOpen: true,
      item,
      action,
      message: action === 'accepted' ? 'Accepted with pleasure. Looking forward to our discussion.' : 'Unfortunately unable to take up this engagement at this time.',
    });
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    if (!respondModal.item) return;

    setActionLoading(true);
    setError(null);
    try {
      await facultyApi.respondMentorship(
        respondModal.item.id,
        respondModal.action,
        respondModal.message
      );
      setSuccessMsg(`Mentorship request successfully ${respondModal.action}!`);
      setRespondModal({ isOpen: false, item: null, action: 'accepted', message: '' });
      await loadCockpitData();
    } catch (err) {
      setError(err.message || 'Failed to respond to mentorship request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteMentorship = async (item) => {
    if (!window.confirm(`Are you sure you want to mark the mentorship with ${item.mentee?.name || 'student'} as completed?`)) return;

    setActionLoading(true);
    setError(null);
    try {
      await facultyApi.completeMentorship(item.id);
      setSuccessMsg('Mentorship engagement marked as completed.');
      await loadCockpitData();
    } catch (err) {
      setError(err.message || 'Failed to mark mentorship as completed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMentorship = async (item) => {
    if (!window.confirm('Are you sure you want to cancel this mentorship session?')) return;

    setActionLoading(true);
    setError(null);
    try {
      await facultyApi.cancelMentorship(item.id);
      setSuccessMsg('Mentorship engagement cancelled.');
      await loadCockpitData();
    } catch (err) {
      setError(err.message || 'Failed to cancel mentorship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenProgressModal = (enrollment) => {
    setProgressModal({
      isOpen: true,
      item: enrollment,
      progress: enrollment.progress || 0,
    });
  };

  const handleUpdateProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModal.item) return;

    setActionLoading(true);
    setError(null);
    try {
      await facultyApi.updateLearningProgress(progressModal.item.id, Number(progressModal.progress));
      setSuccessMsg('Learning / FDP progress updated successfully!');
      setProgressModal({ isOpen: false, item: null, progress: 0 });
      await loadCockpitData();
    } catch (err) {
      setError(err.message || 'Failed to update progress');
    } finally {
      setActionLoading(false);
    }
  };

  // KPIs
  const activeMentorships = mentorships.filter((m) => m.status === 'accepted').length;
  const completedMentorships = mentorships.filter((m) => m.status === 'completed').length;
  const pendingRequests = mentorships.filter((m) => m.status === 'pending').length;
  const enrolledProgramsCount = enrollments.length;
  const completedProgramsCount = enrollments.filter((e) => (e.progress || 0) >= 100 || e.completedAt).length;

  // Filtered Mentorship list
  const filteredMentorships = mentorships.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (roleFilter === 'mentor' && m.mentorId !== facultyUser?.id) return false;
    if (roleFilter === 'mentee' && m.menteeId !== facultyUser?.id) return false;
    return true;
  });

  return (
    <div className="faculty-cockpit-view" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Alert Banners */}
      {error && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4ade80',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cockpit KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            🤝
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Mentorships
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f9fafb' }}>
              {loading ? '...' : activeMentorships}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {pendingRequests} pending requests
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
              Completed Engagements
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f9fafb' }}>
              {loading ? '...' : completedMentorships}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Verified platform sessions
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            📚
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
              FDP & Learning
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f9fafb' }}>
              {loading ? '...' : enrolledProgramsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {completedProgramsCount} finished / verified
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            🏛️
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
              Academic Calls
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f9fafb' }}>
              {loading ? '...' : academicStats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Active grants & training calls
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Mentorship Action Console */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
              Mentorship Engagement Queue & Actions
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
              Review incoming mentee requests, manage ongoing guidance sessions, and mark completed milestones.
            </p>
          </div>

          {/* Action Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#1f2937', borderRadius: '8px', padding: '2px' }}>
              {['all', 'pending', 'accepted', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: statusFilter === status ? '#3b82f6' : 'transparent',
                    color: statusFilter === status ? '#ffffff' : '#9ca3af',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: 500,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={loadCockpitData}
              title="Refresh Queue"
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#d1d5db',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid #374151',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p>Loading engagement records from backend...</p>
          </div>
        ) : filteredMentorships.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px dashed #334155',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#f1f5f9' }}>No mentorship records found</h4>
            <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              {statusFilter !== 'all'
                ? `No mentorship engagements currently matching the "${statusFilter}" filter.`
                : 'You have not initiated or received any mentorship requests yet.'}
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('mentorship')}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Discover Industry Mentors & Connect →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredMentorships.map((item) => {
              const isFacultyMentor = item.mentorId === facultyUser?.id || item.mentor?.email === facultyUser?.email;
              const counterpart = isFacultyMentor ? item.mentee : item.mentor;
              const counterpartRole = isFacultyMentor ? 'Mentee (Student)' : 'Industry Mentor';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>
                          {item.topic || 'General Mentorship Session'}
                        </h4>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor:
                              item.status === 'accepted'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : item.status === 'completed'
                                ? 'rgba(168, 85, 247, 0.2)'
                                : item.status === 'pending'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(107, 114, 128, 0.2)',
                            color:
                              item.status === 'accepted'
                                ? '#4ade80'
                                : item.status === 'completed'
                                ? '#c084fc'
                                : item.status === 'pending'
                                ? '#fbbf24'
                                : '#9ca3af',
                            border: `1px solid ${
                              item.status === 'accepted'
                                ? 'rgba(34, 197, 94, 0.4)'
                                : item.status === 'completed'
                                ? 'rgba(168, 85, 247, 0.4)'
                                : item.status === 'pending'
                                ? 'rgba(245, 158, 11, 0.4)'
                                : 'rgba(107, 114, 128, 0.4)'
                            }`,
                          }}
                        >
                          {item.status}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            backgroundColor: '#0f172a',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          Role: {isFacultyMentor ? 'You (Mentor)' : 'You (Mentee)'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                        <strong>{counterpartRole}:</strong> {counterpart?.name || 'Academician / Student'} ({counterpart?.email || 'N/A'})
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* If faculty is mentor and request is pending -> Accept or Decline */}
                      {isFacultyMentor && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenRespondModal(item, 'accepted')}
                            disabled={actionLoading}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#16a34a',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Accept Request
                          </button>
                          <button
                            onClick={() => handleOpenRespondModal(item, 'declined')}
                            disabled={actionLoading}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}

                      {/* If session is accepted -> Mark complete or cancel */}
                      {item.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleCompleteMentorship(item)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#8b5cf6',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            ★ Mark Completed
                          </button>
                          <button
                            onClick={() => handleCancelMentorship(item)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.45rem 0.9rem',
                              backgroundColor: '#374151',
                              border: '1px solid #4b5563',
                              borderRadius: '6px',
                              color: '#d1d5db',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Message & details */}
                  {item.message && (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        borderLeft: '3px solid #3b82f6',
                      }}
                    >
                      <strong style={{ color: '#e2e8f0' }}>Initial Note: </strong>
                      {item.message}
                    </div>
                  )}

                  {item.responseMessage && (
                    <div
                      style={{
                        backgroundColor: '#0f172a',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#94a3b8',
                        borderLeft: '3px solid #10b981',
                      }}
                    >
                      <strong style={{ color: '#e2e8f0' }}>Response Note: </strong>
                      {item.responseMessage}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      borderTop: '1px solid #334155',
                      paddingTop: '0.5rem',
                    }}
                  >
                    <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.respondedAt && (
                      <span>Responded: {new Date(item.respondedAt).toLocaleDateString()}</span>
                    )}
                    {item.completedAt && (
                      <span style={{ color: '#c084fc', fontWeight: 600 }}>
                        Completed: {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Secondary Section: FDP & Continuous Learning Enrollments */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
              Faculty Development & Continuous Learning Track
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
              Industrial training modules, accredited FDP programs, and technical certifications.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('opportunities')}
              style={{
                padding: '0.45rem 1rem',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Explore New FDP Programs →
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p>Loading enrolled training programs...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px dashed #334155',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📖</div>
            <h4 style={{ margin: '0 0 0.5rem', color: '#f1f5f9' }}>No Active FDP Enrollments</h4>
            <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              You haven't enrolled in any Faculty Development Programs or learning tracks yet.
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('opportunities')}
                style={{
                  padding: '0.5rem 1.25rem',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Browse FDP & Industrial Training Calls
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {enrollments.map((enrollment) => {
              const prog = enrollment.program || {};
              const progress = enrollment.progress || 0;
              const isCompleted = progress >= 100 || !!enrollment.completedAt;

              return (
                <div
                  key={enrollment.id}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.1)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {prog.type || 'FDP Track'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: isCompleted ? '#4ade80' : '#fbbf24',
                          fontWeight: 600,
                        }}
                      >
                        {isCompleted ? '✓ Completed' : `${progress}% In-progress`}
                      </span>
                    </div>

                    <h4 style={{ margin: '0.75rem 0 0.25rem', color: '#f8fafc', fontSize: '1rem' }}>
                      {prog.title || 'Faculty Development Track'}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Provider: <strong>{prog.provider || 'SUTRA Learning Guild'}</strong>
                    </div>
                  </div>

                  <div>
                    {/* Progress Bar */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span>Curriculum Completion</span>
                        <span>{progress}%</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          backgroundColor: '#334155',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Enrolled: {new Date(enrollment.enrolledAt || enrollment.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleOpenProgressModal(enrollment)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: '#334155',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Update Progress ✏️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Respond to Mentorship Request */}
      {respondModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
              {respondModal.action === 'accepted' ? '✓ Accept Mentorship Session' : '✕ Decline Mentorship Request'}
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
              Mentee: <strong>{respondModal.item?.mentee?.name || 'Student'}</strong>
              <br />
              Topic: <em>{respondModal.item?.topic}</em>
            </p>

            <form onSubmit={handleRespondSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                  Response Message to Mentee:
                </label>
                <textarea
                  rows={4}
                  required
                  value={respondModal.message}
                  onChange={(e) => setRespondModal({ ...respondModal, message: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRespondModal({ isOpen: false, item: null, action: 'accepted', message: '' })}
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: respondModal.action === 'accepted' ? '#16a34a' : '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Submitting...' : `Confirm ${respondModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Progress */}
      {progressModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '450px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
              Update Program Completion Progress
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
              {progressModal.item?.program?.title || 'FDP Track'}
            </p>

            <form onSubmit={handleUpdateProgressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Completion Percentage:</label>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{progressModal.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressModal.progress}
                  onChange={(e) => setProgressModal({ ...progressModal, progress: e.target.value })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setProgressModal({ isOpen: false, item: null, progress: 0 })}
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
