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
            backgroundColor: 'rgba(114, 16, 16, 0.08)',
            border: '1px solid rgba(114, 16, 16, 0.25)',
            color: 'var(--color-primary, #B58863)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Error:</span>
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="btn-ghost"
            style={{
              padding: '0.2rem 0.5rem',
              color: 'var(--color-primary, #B58863)',
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
            padding: '0.875rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Success:</span>
            <span style={{ fontSize: '0.875rem' }}>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="btn-ghost"
            style={{
              padding: '0.2rem 0.5rem',
              color: '#065f46',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cockpit KPI Grid */}
      <div className="b2b-kpi-grid">
        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Active Mentorships</div>
          <div className="b2b-kpi-value">{loading ? '...' : activeMentorships}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {pendingRequests} pending requests
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Completed Engagements</div>
          <div className="b2b-kpi-value">{loading ? '...' : completedMentorships}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Verified platform sessions
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">FDP & Learning Tracks</div>
          <div className="b2b-kpi-value">{loading ? '...' : enrolledProgramsCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {completedProgramsCount} finished / certified
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Academic Calls</div>
          <div className="b2b-kpi-value">{loading ? '...' : academicStats.total}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active grants & training calls
          </div>
        </div>
      </div>

      {/* Main Section: Mentorship Action Console */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              Mentorship Engagement Queue & Actions
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              Review incoming mentee requests, manage ongoing guidance sessions, and verify completed milestones.
            </p>
          </div>

          {/* Action Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="b2b-tab-bar" style={{ margin: 0, padding: '2px', height: 'auto' }}>
              {['all', 'pending', 'accepted', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`b2b-tab ${statusFilter === status ? 'active' : ''}`}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={loadCockpitData}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading engagement records from backend...</p>
          </div>
        ) : filteredMentorships.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-mist-green, #D3C3B9)',
              borderRadius: '6px',
              border: '1px dashed var(--color-pebble-grey, #A79E9C)',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>No mentorship records found</h4>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              {statusFilter !== 'all'
                ? `No mentorship engagements currently matching the "${statusFilter}" filter.`
                : 'You have not initiated or received any mentorship requests yet.'}
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('mentorship')}
                className="btn-primary"
                style={{ fontSize: '0.8125rem' }}
              >
                Discover Industry Mentors & Connect
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredMentorships.map((item) => {
              const isFacultyMentor = item.mentorId === facultyUser?.id || item.mentor?.email === facultyUser?.email;
              const counterpart = isFacultyMentor ? item.mentee : item.mentor;
              const counterpartRole = isFacultyMentor ? 'Mentee (Student)' : 'Industry Mentor';

              const getStatusClass = (st) => {
                if (st === 'accepted' || st === 'completed') return 'status-verified';
                if (st === 'pending') return 'status-pending';
                return 'status-rejected';
              };

              return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--color-pebble-grey, #A79E9C)',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-bg-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                          {item.topic || 'General Mentorship Session'}
                        </h4>
                        <span className={`status-pill ${getStatusClass(item.status)}`}>
                          <span className="status-pill-dot" />
                          {item.status}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--color-mist-green, #D3C3B9)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                          }}
                        >
                          Role: {isFacultyMentor ? 'Mentor' : 'Mentee'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <strong>{counterpartRole}:</strong> {counterpart?.name || 'Academician / Student'} ({counterpart?.email || 'N/A'})
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isFacultyMentor && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenRespondModal(item, 'accepted')}
                            disabled={actionLoading}
                            className="btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleOpenRespondModal(item, 'declined')}
                            disabled={actionLoading}
                            className="btn-outline"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {item.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleCompleteMentorship(item)}
                            disabled={actionLoading}
                            className="btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleCancelMentorship(item)}
                            disabled={actionLoading}
                            className="btn-ghost"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
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
                        backgroundColor: 'var(--color-mist-green, #D3C3B9)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        borderLeft: '3px solid var(--color-steel-blue, #8DA1B9)',
                      }}
                    >
                      <strong style={{ color: 'var(--text-main)' }}>Initial Note: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{item.message}</span>
                    </div>
                  )}

                  {item.responseMessage && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-mist-green, #D3C3B9)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        borderLeft: '3px solid var(--color-primary, #B58863)',
                      }}
                    >
                      <strong style={{ color: 'var(--text-main)' }}>Response Note: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{item.responseMessage}</span>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--color-pebble-grey, #A79E9C)',
                      paddingTop: '0.5rem',
                    }}
                  >
                    <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.respondedAt && (
                      <span>Responded: {new Date(item.respondedAt).toLocaleDateString()}</span>
                    )}
                    {item.completedAt && (
                      <span style={{ color: 'var(--color-primary, #B58863)', fontWeight: 600 }}>
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
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              Faculty Development & Continuous Learning Track
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              Industrial training modules, accredited FDP programs, and technical certifications.
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('opportunities')}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
            >
              Explore New FDP Programs
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Loading enrolled training programs...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-mist-green, #D3C3B9)',
              borderRadius: '6px',
              border: '1px dashed var(--color-pebble-grey, #A79E9C)',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>No Active FDP Enrollments</h4>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              You have not enrolled in any Faculty Development Programs or learning tracks yet.
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('opportunities')}
                className="btn-primary"
                style={{ fontSize: '0.8125rem' }}
              >
                Browse FDP & Industrial Training Calls
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
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
                    border: '1px solid var(--color-pebble-grey, #A79E9C)',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-bg-surface)',
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
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: 'var(--color-primary, #B58863)',
                          backgroundColor: 'var(--color-mist-green, #D3C3B9)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {prog.type || 'FDP Track'}
                      </span>
                      <span
                        className={`status-pill ${isCompleted ? 'status-verified' : 'status-pending'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        <span className="status-pill-dot" />
                        {isCompleted ? 'Completed' : `${progress}% In-progress`}
                      </span>
                    </div>

                    <h4 style={{ margin: '0.75rem 0 0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>
                      {prog.title || 'Faculty Development Track'}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                          color: 'var(--text-muted)',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span>Curriculum Completion</span>
                        <span>{progress}%</span>
                      </div>
                      <div
                        style={{
                          height: '6px',
                          backgroundColor: 'var(--color-pebble-grey, #A79E9C)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: isCompleted ? '#10b981' : 'var(--color-primary, #B58863)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Enrolled: {new Date(enrollment.enrolledAt || enrollment.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleOpenProgressModal(enrollment)}
                        className="btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        Update Progress
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: 'var(--color-bg-surface)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                {respondModal.action === 'accepted' ? 'Accept Mentorship Session' : 'Decline Mentorship Request'}
              </h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Mentee: <strong>{respondModal.item?.mentee?.name || 'Student'}</strong> &middot; Topic: <em>{respondModal.item?.topic}</em>
              </p>
            </div>

            <form onSubmit={handleRespondSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  Response Note to Mentee:
                </label>
                <textarea
                  rows={4}
                  required
                  value={respondModal.message}
                  onChange={(e) => setRespondModal({ ...respondModal, message: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-pebble-grey, #A79E9C)',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRespondModal({ isOpen: false, item: null, action: 'accepted', message: '' })}
                  disabled={actionLoading}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '450px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              backgroundColor: 'var(--color-bg-surface)',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                Update Program Completion Progress
              </h3>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                {progressModal.item?.program?.title || 'FDP Track'}
              </p>
            </div>

            <form onSubmit={handleUpdateProgressSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Completion Percentage:</label>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary, #B58863)' }}>{progressModal.progress}%</span>
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
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
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


