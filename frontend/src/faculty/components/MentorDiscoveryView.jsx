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
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              🤝 Industry & Academic Mentor Discovery
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
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
            style={{ flex: 1, minWidth: '260px', padding: '0.55rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            style={{ padding: '0.55rem 1.25rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Filter Mentors
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Discovering available mentors across institutions and industry networks...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Error Discovering Mentors</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Mentors Grid */}
      {!loading && !error && (
        <div>
          {mentors.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>No mentors found matching your expertise filter.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Try searching with broader terms or clear the filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {mentors.map((m) => {
                const expertise = m.expertise || [];
                const slots = m.slots || [];

                return (
                  <div
                    key={m.mentorId}
                    style={{
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>
                            {m.name || 'Verified Academician / Mentor'}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                            {m.designation || 'Faculty'} • {m.institution || 'Demo Institute'}
                          </div>
                        </div>
                        <span style={{ background: '#065f46', color: '#34d399', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          Available
                        </span>
                      </div>

                      {/* Expertise tags */}
                      <div style={{ marginTop: '0.85rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Core Domains:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {expertise.slice(0, 5).map((exp, eIdx) => (
                            <span key={eIdx} style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {exp}
                            </span>
                          ))}
                          {expertise.length > 5 && (
                            <span style={{ color: '#64748b', fontSize: '0.75rem', alignSelf: 'center' }}>+{expertise.length - 5}</span>
                          )}
                          {expertise.length === 0 && <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>General</span>}
                        </div>
                      </div>

                      {/* Schedule preview */}
                      {slots.length > 0 && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                          🗓️ Active Slots: <strong style={{ color: '#f8fafc' }}>{slots[0].day} ({slots[0].from} - {slots[0].to})</strong>
                          {slots.length > 1 && ` +${slots.length - 1} more`}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenModal(m)}
                        style={{
                          padding: '0.45rem 1rem',
                          background: '#38bdf8',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Request Mentorship Session ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} mentors)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ padding: '0.35rem 0.75rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{ padding: '0.35rem 0.75rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                Request Mentorship Connection
              </h3>
              <button
                onClick={() => setSelectedMentor(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Connecting with: <strong style={{ color: '#38bdf8' }}>{selectedMentor.name}</strong> ({selectedMentor.institution})
            </p>

            {requestError && (
              <div style={{ padding: '0.65rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {requestError}
              </div>
            )}

            {requestSuccess && (
              <div style={{ padding: '0.65rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '6px', color: '#a7f3d0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                ✓ {requestSuccess}
              </div>
            )}

            <form onSubmit={handleSendRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Mentorship Topic / Focus Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Research grant guidance, Curriculum design, PhD advisory"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Introduction & Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details about your objectives or specific questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  style={{ padding: '0.5rem 1rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest || !topic.trim()}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: sendingRequest || !topic.trim() ? 'not-allowed' : 'pointer',
                    opacity: sendingRequest || !topic.trim() ? 0.6 : 1,
                  }}
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
