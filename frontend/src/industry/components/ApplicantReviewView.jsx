import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

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

  const renderStatusPill = (status) => {
    switch (status) {
      case 'shortlisted':
      case 'interview':
      case 'selected':
        return (
          <span className="status-pill status-verified">
            <span className="status-pill-dot" />
            {status === 'interview' ? 'Interview Scheduled' : status === 'selected' ? 'Selected / Hired' : 'Shortlisted'}
          </span>
        );
      case 'under_review':
      case 'applied':
        return (
          <span className="status-pill status-pending">
            <span className="status-pill-dot" />
            {status === 'under_review' ? 'Under Review' : 'Applied'}
          </span>
        );
      case 'rejected':
        return (
          <span className="status-pill status-rejected">
            <span className="status-pill-dot" />
            Rejected
          </span>
        );
      case 'withdrawn':
      default:
        return (
          <span className="status-pill" style={{ background: 'var(--color-border-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <span className="status-pill-dot" style={{ background: 'var(--color-text-muted)' }} />
            {status === 'withdrawn' ? 'Withdrawn' : status}
          </span>
        );
    }
  };

  if (loadingOpps) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading application review console...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Controls Bar */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Candidate Applicant Review & Pipeline Funnel
            </h3>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Review student applications, shortlists, recruiter notes, and hiring stage transitions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedOppId}
              onChange={(e) => { setSelectedOppId(e.target.value); setCurrentPage(1); }}
              style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', maxWidth: '300px' }}
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
              style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
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
        <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-burgundy-red)' }}>
          <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-md)' }}>Error Loading Applicants</h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loadingApplicants && (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Fetching applicant records and match evaluations...</p>
        </div>
      )}

      {/* Applicants Table */}
      {!loadingApplicants && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {applicants.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>No student applications found for this opportunity and filter.</p>
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Match Compatibility</th>
                    <th>Applied On</th>
                    <th>Current Stage</th>
                    <th>Recruiter Notes</th>
                    <th style={{ textAlign: 'right' }}>Stage Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((app) => {
                    const id = app.id || app._id;
                    const applicant = app.applicant || {};
                    const score = app.matchScore || 0;
                    const notesCount = (app.recruiterNotes || []).length;
                    const isWithdrawn = app.status === 'withdrawn';

                    return (
                      <tr key={id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {applicant.name || 'Student Candidate'}
                          </div>
                          <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                            {applicant.email || 'N/A'}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 700, color: score >= 75 ? 'var(--color-emerald)' : score >= 50 ? 'var(--color-steel-blue)' : 'var(--color-amber)' }}>
                              {score}%
                            </span>
                            <div style={{ width: '60px', height: '5px', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${score}%`, background: score >= 75 ? 'var(--color-emerald)' : 'var(--color-steel-blue)' }} />
                            </div>
                          </div>
                        </td>

                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                        </td>

                        <td>
                          {renderStatusPill(app.status)}
                        </td>

                        <td>
                          <button
                            onClick={() => setShowNotesApp(app)}
                            className="btn btn-ghost"
                            style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: notesCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            }}
                          >
                            {notesCount} Note{notesCount === 1 ? '' : 's'}
                          </button>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          {isWithdrawn ? (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontStyle: 'italic' }}>Withdrawn</span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                              {app.status !== 'shortlisted' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'shortlisted')}
                                  className="btn btn-ghost"
                                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-emerald)' }}
                                >
                                  Shortlist
                                </button>
                              )}
                              {app.status !== 'interview' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'interview')}
                                  className="btn btn-ghost"
                                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-steel-blue)' }}
                                >
                                  Interview
                                </button>
                              )}
                              {app.status !== 'selected' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'selected')}
                                  className="btn btn-ghost"
                                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 700 }}
                                >
                                  Select
                                </button>
                              )}
                              {app.status !== 'rejected' && (
                                <button
                                  onClick={() => handleOpenStatusModal(app, 'rejected')}
                                  className="btn btn-ghost"
                                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-burgundy-red)' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} applicants)</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(95vw, 480px)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Update Application Status
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Candidate: <strong style={{ color: 'var(--color-text)' }}>{selectedApp.applicant?.name}</strong> • Move to stage: <span style={{ color: 'var(--color-steel-blue)', textTransform: 'uppercase', fontWeight: 600 }}>{targetStatus}</span>
            </p>

            {actionError && (
              <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-burgundy-red)', borderRadius: 'var(--radius-md)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-xs)' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmitStatus} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>
                  Recruiter Decision Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add evaluation comments, interview feedback, or rationale..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 'min(95vw, 520px)', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
                Recruiter Notes: {showNotesApp.applicant?.name}
              </h3>
              <button
                onClick={() => setShowNotesApp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Notes History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '240px', overflowY: 'auto' }}>
              {(showNotesApp.recruiterNotes || []).length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontStyle: 'italic', padding: 'var(--space-2) 0' }}>
                  No internal notes recorded yet for this candidate.
                </div>
              ) : (
                (showNotesApp.recruiterNotes || []).map((n, idx) => (
                  <div key={idx} style={{ background: 'var(--color-bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}>{n.note}</p>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)', display: 'block' }}>
                      {n.at ? new Date(n.at).toLocaleString() : 'Recorded'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Add New Note */}
            <form onSubmit={handleAddNote} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                Add New Recruiter Note
              </label>
              <textarea
                rows={3}
                required
                placeholder="Log candidate interview performance, team fit, or background check..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-1)' }}>
                <button
                  type="submit"
                  disabled={actionLoading || !newNote.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
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
