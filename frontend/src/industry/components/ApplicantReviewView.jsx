import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

const STATUS_CONFIG = {
  applied: { label: 'Applied', bg: '#1e293b', text: '#38bdf8' },
  under_review: { label: 'Under Review', bg: '#854d0e', text: '#fde047' },
  shortlisted: { label: 'Shortlisted', bg: '#065f46', text: '#34d399' },
  interview: { label: 'Interview Scheduled', bg: '#0284c7', text: '#bae6fd' },
  selected: { label: 'Selected / Hired', bg: '#047857', text: '#6ee7b7' },
  rejected: { label: 'Rejected', bg: '#7f1d1d', text: '#fca5a5' },
  withdrawn: { label: 'Withdrawn by Student', bg: '#334155', text: '#94a3b8' },
};

export const ApplicantReviewView = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState(null);

  // Status Change Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Notes Drawer / Modal
  const [showNotesApp, setShowNotesApp] = useState(null);
  const [newNote, setNewNote] = useState('');

  // Load opportunities
  const loadOpportunities = async () => {
    try {
      setLoadingOpps(true);
      setError(null);
      const res = await industryApi.listMyOpportunities({ limit: 50 });
      const opps = res.opportunities || [];
      setOpportunities(opps);
      if (opps.length > 0) {
        const id = opps[0].id || opps[0]._id;
        setSelectedOppId(id);
      }
    } catch (err) {
      console.error('Failed to load opportunities for applicant review:', err);
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoadingOpps(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  // Fetch applicants for selected opportunity
  const fetchApplicants = async () => {
    if (!selectedOppId) return;
    try {
      setLoadingApplicants(true);
      setError(null);
      const res = await industryApi.listApplicants(selectedOppId, {
        status: statusFilter || undefined,
        page: currentPage,
        limit: 15,
      });
      setApplicants(res.applications || []);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load applicants:', err);
      setError(err.message || 'Failed to load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    if (selectedOppId) {
      fetchApplicants();
    }
  }, [selectedOppId, statusFilter, currentPage]);

  // Open status modal
  const handleOpenStatusModal = (app, status) => {
    setSelectedApp(app);
    setTargetStatus(status);
    setStatusNote('');
    setActionError('');
  };

  // Submit Status Update
  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp || !targetStatus) return;
    try {
      setActionLoading(true);
      setActionError('');
      const appId = selectedApp.id || selectedApp._id;
      await industryApi.updateApplicationStatus(appId, targetStatus, statusNote.trim() || undefined);
      setSelectedApp(null);
      fetchApplicants();
    } catch (err) {
      console.error('Failed to update status:', err);
      setActionError(err.message || 'Status transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Recruiter Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!showNotesApp || !newNote.trim()) return;
    try {
      setActionLoading(true);
      const appId = showNotesApp.id || showNotesApp._id;
      await industryApi.addApplicationNote(appId, newNote.trim());
      setNewNote('');
      // Refresh single app notes
      const updated = await industryApi.getApplication(appId);
      setShowNotesApp(updated);
      fetchApplicants();
    } catch (err) {
      alert(`Note failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingOpps) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading application review console...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Controls Bar */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              👥 Candidate Applicant Review & Pipeline Funnel
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Review student applications, shortlists, recruiter notes, and hiring stage transitions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedOppId}
              onChange={(e) => { setSelectedOppId(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.55rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', maxWidth: '300px' }}
            >
              {opportunities.map((opp) => {
                const id = opp.id || opp._id;
                return (
                  <option key={id} value={id}>
                    {opp.title}
                  </option>
                );
              })}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.55rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="">All Application Stages</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="selected">Selected / Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Error Loading Applicants</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loadingApplicants && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Fetching applicant records and match evaluations...</p>
        </div>
      )}

      {/* Applicants Table */}
      {!loadingApplicants && !error && (
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          {applicants.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>No student applications found for this opportunity and filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '1rem' }}>Candidate</th>
                    <th style={{ padding: '1rem' }}>Match Compatibility</th>
                    <th style={{ padding: '1rem' }}>Applied On</th>
                    <th style={{ padding: '1rem' }}>Current Stage</th>
                    <th style={{ padding: '1rem' }}>Recruiter Notes</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Stage Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((app) => {
                    const id = app.id || app._id;
                    const applicant = app.applicant || {};
                    const score = app.matchScore || 0;
                    const cfg = STATUS_CONFIG[app.status] || { label: app.status, bg: '#334155', text: '#cbd5e1' };
                    const notesCount = (app.recruiterNotes || []).length;
                    const isWithdrawn = app.status === 'withdrawn';

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                            {applicant.name || 'Student Candidate'}
                          </div>
                          <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            ✉️ {applicant.email || 'N/A'}
                          </div>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: score >= 75 ? '#34d399' : score >= 50 ? '#38bdf8' : '#facc15' }}>
                              {score}%
                            </span>
                            <div style={{ width: '60px', height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${score}%`, background: score >= 75 ? '#34d399' : '#38bdf8' }} />
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: '#94a3b8' }}>
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: cfg.bg, color: cfg.text, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {cfg.label}
                          </span>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => setShowNotesApp(app)}
                            style={{
                              padding: '0.25rem 0.6rem',
                              background: notesCount > 0 ? '#0284c7' : '#0f172a',
                              color: notesCount > 0 ? '#fff' : '#94a3b8',
                              border: '1px solid #334155',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                            }}
                          >
                            📝 {notesCount} Note{notesCount === 1 ? '' : 's'}
                          </button>
                        </td>

                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {isWithdrawn ? (
                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>Withdrawn</span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              {app.status !== 'shortlisted' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'shortlisted')}
                                  style={{ padding: '0.3rem 0.55rem', background: '#065f46', color: '#34d399', border: '1px solid #059669', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  Shortlist
                                </button>
                              )}
                              {app.status !== 'interview' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'interview')}
                                  style={{ padding: '0.3rem 0.55rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Interview
                                </button>
                              )}
                              {app.status !== 'selected' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'selected')}
                                  style={{ padding: '0.3rem 0.55rem', background: '#047857', color: '#a7f3d0', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Select
                                </button>
                              )}
                              {app.status !== 'rejected' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'rejected')}
                                  style={{ padding: '0.3rem 0.55rem', background: '#450a0a', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} applicants)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ padding: '0.35rem 0.75rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{ padding: '0.35rem 0.75rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Update Status Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#f8fafc' }}>
              Update Application Status
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Candidate: <strong>{selectedApp.applicant?.name}</strong> • Move to stage: <span style={{ color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>{targetStatus}</span>
            </p>

            {actionError && (
              <div style={{ padding: '0.5rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '4px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmitStatus}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Recruiter Decision Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add evaluation comments, interview feedback, or rationale..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  style={{ padding: '0.5rem 1rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1.25rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  {actionLoading ? 'Updating...' : 'Confirm Stage Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Notes Drawer / Modal */}
      {showNotesApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                Recruiter Notes: {showNotesApp.applicant?.name}
              </h3>
              <button
                onClick={() => setShowNotesApp(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Notes History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '240px', overflowY: 'auto' }}>
              {(showNotesApp.recruiterNotes || []).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', padding: '1rem 0' }}>
                  No internal notes recorded yet for this candidate.
                </div>
              ) : (
                (showNotesApp.recruiterNotes || []).map((n, idx) => (
                  <div key={idx} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
                    <p style={{ margin: 0, color: '#f8fafc', fontSize: '0.85rem' }}>{n.note}</p>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                      {n.at ? new Date(n.at).toLocaleString() : 'Recorded'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add New Note */}
            <form onSubmit={handleAddNote} style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Add New Recruiter Note
              </label>
              <textarea
                rows={3}
                required
                placeholder="Log candidate interview performance, team fit, or background check..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={actionLoading || !newNote.trim()}
                  style={{ padding: '0.5rem 1.25rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: actionLoading || !newNote.trim() ? 'not-allowed' : 'pointer', opacity: actionLoading || !newNote.trim() ? 0.6 : 1 }}
                >
                  {actionLoading ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantReviewView;
