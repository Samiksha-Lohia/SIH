import React, { useState, useEffect } from 'react';
import { facultyApi } from '../faculty.api.js';

export const MentorDiscoveryView = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchExpertise, setSearchExpertise] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  // Request Mentorship Modal
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  const fetchMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await facultyApi.discoverMentors({
        expertise: searchExpertise || undefined,
        page: currentPage,
        limit: 12,
      });
      setMentors(res.mentors || []);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to discover mentors:', err);
      setError(err.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMentors();
  };

  const handleOpenModal = (mentor) => {
    setSelectedMentor(mentor);
    setTopic('');
    setMessage('');
    setRequestSuccess('');
    setRequestError('');
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;
    try {
      setSendingRequest(true);
      setRequestError('');
      await facultyApi.requestMentorship({
        mentorId: selectedMentor.mentorId,
        topic: topic.trim(),
        message: message.trim() || undefined,
        slots: selectedMentor.slots || [],
      });
      setRequestSuccess(`Mentorship connection request sent successfully to ${selectedMentor.name}!`);
      setTimeout(() => {
        setSelectedMentor(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to request mentorship:', err);
      setRequestError(err.message || 'Failed to submit request.');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              Industry & Academic Mentor Discovery
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Connect with senior faculty researchers, industry technical leaders, and specialized subject-matter experts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by expertise (e.g. Machine Learning, Cloud, VLSI, Cybersecurity)..."
            value={searchExpertise}
            onChange={(e) => setSearchExpertise(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '0.55rem 0.85rem',
              border: '1px solid var(--color-taupe-grey, #A79E9C)',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.55rem 1.25rem' }}
          >
            Filter Mentors
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Discovering available mentors across institutions and industry networks...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '6px',
            color: '#dc2626',
          }}
        >
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>Error Discovering Mentors</h4>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{error}</p>
        </div>
      )}

      {/* Mentors Grid */}
      {!loading && !error && (
        <div>
          {mentors.length === 0 ? (
            <div
              style={{
                padding: '3.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                borderRadius: '6px',
                border: '1px dashed var(--color-taupe-grey, #A79E9C)',
                color: 'var(--text-muted)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No mentors found matching your expertise filter.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Try searching with broader terms or clear the filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
              {mentors.map((m) => {
                const expertise = m.expertise || [];
                const slots = m.slots || [];

                return (
                  <div
                    key={m.mentorId}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1.25rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                            {m.name || 'Verified Academician / Mentor'}
                          </h4>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {m.designation || 'Faculty'} &middot; {m.institution || 'Configured Institute'}
                          </div>
                        </div>
                        <span className="status-pill status-verified" style={{ fontSize: '0.7rem' }}>
                          <span className="status-pill-dot" />
                          Available
                        </span>
                      </div>

                      {/* Expertise tags */}
                      <div style={{ marginTop: '0.85rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Core Domains:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {expertise.slice(0, 5).map((exp, eIdx) => (
                            <span
                              key={eIdx}
                              style={{
                                backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                                color: 'var(--text-main)',
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                              }}
                            >
                              {exp}
                            </span>
                          ))}
                          {expertise.length > 5 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', alignSelf: 'center' }}>+{expertise.length - 5}</span>
                          )}
                          {expertise.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>General</span>}
                        </div>
                      </div>

                      {/* Schedule preview */}
                      {slots.length > 0 && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Active Slots: <strong style={{ color: 'var(--text-main)' }}>{slots[0].day} ({slots[0].from} - {slots[0].to})</strong>
                          {slots.length > 1 && ` +${slots.length - 1} more`}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenModal(m)}
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                      >
                        Request Mentorship Session
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} mentors)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Mentorship Modal */}
      {selectedMentor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 'min(95vw, 480px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: 'var(--color-bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                Request Mentorship Connection
              </h3>
              <button
                onClick={() => setSelectedMentor(null)}
                className="btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Connecting with: <strong style={{ color: 'var(--text-main)' }}>{selectedMentor.name}</strong> ({selectedMentor.institution})
            </p>

            {requestError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '6px',
                  color: '#dc2626',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                {requestError}
              </div>
            )}

            {requestSuccess && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  color: '#065f46',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                ✓ {requestSuccess}
              </div>
            )}

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  Mentorship Topic / Focus Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Research grant guidance, Curriculum design, PhD advisory"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    border: '1px solid var(--color-taupe-grey, #A79E9C)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  Introduction & Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details about your objectives or specific questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    border: '1px solid var(--color-taupe-grey, #A79E9C)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest || !topic.trim()}
                  className="btn-primary"
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDiscoveryView;
