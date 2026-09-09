import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../student.api.js';

const STATUS_FILTERS = [
  { value: '', label: 'All Application Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'selected', label: 'Selected / Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const LIFECYCLE_STAGES = ['applied', 'under_review', 'shortlisted', 'interview', 'selected'];

export function ApplicationTrackerView() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Withdraw state
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.listMyApplications({
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setApplications(res.applications);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await studentApi.withdrawApplication(withdrawTarget.id);
      setFeedback({
        type: 'success',
        message: `Application for "${withdrawTarget.opportunity?.title || 'opportunity'}" has been successfully withdrawn.`,
      });
      setWithdrawTarget(null);
      await fetchApplications();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to withdraw application',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'selected':
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'interview':
        return { backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#7e22ce', border: '1px solid rgba(147, 51, 234, 0.3)' };
      case 'shortlisted':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'under_review':
        return { backgroundColor: 'var(--color-sky-light)', color: 'var(--color-steel-dark)', border: '1px solid rgba(141, 161, 185, 0.3)' };
      case 'rejected':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'withdrawn':
        return { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' };
      case 'applied':
      default:
        return { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3>Application Pipeline & Recruitment Tracker</h3>
          <p style={styles.description}>
            Track the end-to-end lifecycle of your submitted job, internship, and project applications in real time.
          </p>
        </div>
        <button onClick={fetchApplications} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)' }}>
          Refresh Tracker
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div style={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={styles.select}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* States */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading application pipeline...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchApplications} className="btn btn-primary">Try Again</button>
        </div>
      ) : applications.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            No applications found under this status filter. Explore the Opportunity Marketplace to apply!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {applications.map((app) => {
            const opp = app.opportunity || {};
            const isTerminal = ['selected', 'rejected', 'withdrawn'].includes(app.status);
            const currentStageIndex = LIFECYCLE_STAGES.indexOf(app.status);

            return (
              <div key={app.id} className="card" style={styles.appCard}>
                <div style={styles.appCardHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <h4 style={{ color: 'var(--color-primary)', margin: 0 }}>{opp.title || 'Corporate Opportunity'}</h4>
                      <span className="badge" style={{ ...getStatusBadgeStyle(app.status), fontSize: '11px', textTransform: 'capitalize' }}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      🏢 {opp.companyName || 'Corporate Partner'} • Applied on: {formatDate(app.createdAt)}
                    </div>
                  </div>

                  {!isTerminal && (
                    <button
                      onClick={() => setWithdrawTarget(app)}
                      className="btn btn-outline"
                      style={{ fontSize: '11px', padding: '2px 8px', color: '#b91c1c', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>

                {/* Status Pipeline Progress Bar */}
                <div style={styles.pipelineContainer}>
                  <div style={styles.pipelineTrack}>
                    {LIFECYCLE_STAGES.map((stg, sIdx) => {
                      const isReached = currentStageIndex >= sIdx && app.status !== 'rejected' && app.status !== 'withdrawn';
                      const isCurrent = app.status === stg;

                      return (
                        <div key={stg} style={styles.stageStep}>
                          <div
                            style={{
                              ...styles.stageDot,
                              backgroundColor: isReached ? 'var(--color-primary)' : 'var(--color-border)',
                              border: isCurrent ? '3px solid var(--color-burgundy-red)' : 'none',
                            }}
                          />
                          <span
                            style={{
                              ...styles.stageLabel,
                              color: isReached ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              fontWeight: isCurrent ? 'bold' : 'normal',
                            }}
                          >
                            {stg.replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interview Stage Detail if scheduled */}
                {app.interviews?.length > 0 && (
                  <div style={styles.interviewBox}>
                    <strong style={{ fontSize: 'var(--font-size-xs)' }}>📅 Interview Scheduled:</strong>
                    {app.interviews.map((iv, idx) => (
                      <div key={idx} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Round: <strong>{iv.roundName || 'Technical Round'}</strong> • Date: {formatDate(iv.scheduledAt)} • Mode: {iv.mode || 'Online Video'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrevPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Page {meta.page} of {meta.totalPages} ({meta.total} applications)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawTarget && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4 style={{ marginBottom: 'var(--space-2)' }}>Confirm Application Withdrawal</h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Are you sure you want to withdraw your application for{' '}
              <strong>{withdrawTarget.opportunity?.title || 'this opportunity'}</strong>?
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              This action will alert the recruiting team that you are no longer in consideration. This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button onClick={() => setWithdrawTarget(null)} disabled={withdrawing} className="btn btn-outline">
                Keep Application
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="btn btn-primary"
                style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c' }}
              >
                {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
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
  toolbar: { display: 'flex', gap: 'var(--space-2)' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-surface)', minWidth: '200px' },
  appCard: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  appCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' },
  pipelineContainer: { backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' },
  pipelineTrack: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  stageStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 },
  stageDot: { width: '12px', height: '12px', borderRadius: '50%' },
  stageLabel: { fontSize: '10px', textTransform: 'capitalize' },
  interviewBox: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(147, 51, 234, 0.08)', border: '1px solid rgba(147, 51, 234, 0.2)' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '440px', width: '100%' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default ApplicationTrackerView;
