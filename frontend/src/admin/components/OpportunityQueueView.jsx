import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

export function OpportunityQueueView() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal / Confirm state
  const [actionTarget, setActionTarget] = useState(null); // { opp, action: 'status' | 'delete', newStatus? }
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listOpportunities({
        status: statusFilter || undefined,
        q: searchQuery || undefined,
        page,
        limit: 15,
      });
      setOpportunities(res.opportunities);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    setIsProcessing(true);
    try {
      if (actionTarget.action === 'status') {
        await adminApi.updateOpportunityStatus(actionTarget.opp.id, actionTarget.newStatus);
        setActionFeedback({ type: 'success', message: `Opportunity "${actionTarget.opp.title}" updated to ${actionTarget.newStatus}.` });
      } else if (actionTarget.action === 'delete') {
        await adminApi.deleteOpportunity(actionTarget.opp.id);
        setActionFeedback({ type: 'success', message: `Opportunity "${actionTarget.opp.title}" permanently removed.` });
      }
      setActionTarget(null);
      await fetchOpportunities();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Action failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>Content Moderation & Quality-Check Queue</h3>
          <p style={styles.description}>Review, approve, pause, or remove published company opportunities.</p>
        </div>
        <button onClick={fetchOpportunities} className="btn btn-outline" style={styles.refreshBtn}>
          Refresh Queue
        </button>
      </div>

      {actionFeedback && (
        <div style={{ ...styles.feedbackBox, backgroundColor: actionFeedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: actionFeedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          <span>{actionFeedback.message}</span>
          <button onClick={() => setActionFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Search by title, company, or role..."
          style={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={styles.selectInput}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* States: Loading, Error, Empty, or Table */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading opportunities queue...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchOpportunities} className="btn btn-primary">Try Again</button>
        </div>
      ) : opportunities.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>No opportunities found matching your filters.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title & Company</th>
                <th>Type</th>
                <th>Location / Mode</th>
                <th>Status</th>
                <th>Trust Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td>
                    <strong style={styles.titleText}>{opp.title}</strong>
                    <div style={styles.subtext}>{opp.companyName || 'Anonymous Company'}</div>
                  </td>
                  <td>
                    <span style={styles.typeText}>{opp.type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--font-size-xs)' }}>{opp.location || 'Not specified'}</div>
                    <span style={styles.subtext}>{opp.workMode}</span>
                  </td>
                  <td>
                    <span className={`status-pill status-${opp.status || 'draft'}`}>
                      <span className="status-pill-dot" />
                      {opp.status}
                    </span>
                  </td>
                  <td>
                    {opp.verificationBadge ? (
                      <span style={styles.verifiedBadge}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={styles.unverifiedBadge}>
                        Unverified
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={styles.actionRow}>
                      {opp.status !== 'published' ? (
                        <button
                          onClick={() => setActionTarget({ opp, action: 'status', newStatus: 'published' })}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '3px 8px', color: '#1e6b3f' }}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionTarget({ opp, action: 'status', newStatus: 'paused' })}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '3px 8px', color: '#8c5900' }}
                        >
                          Pause
                        </button>
                      )}
                      <button
                        onClick={() => setActionTarget({ opp, action: 'delete' })}
                        className="btn btn-ghost"
                        style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--color-burgundy-red)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Page {meta.page} of {meta.totalPages} ({meta.total} items)
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

      {/* Confirmation Modal */}
      {actionTarget && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4>Confirm Action</h4>
            <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              {actionTarget.action === 'delete' ? (
                <>Are you sure you want to permanently delete <strong>{actionTarget.opp.title}</strong>? This action cannot be undone.</>
              ) : (
                <>Are you sure you want to change status of <strong>{actionTarget.opp.title}</strong> to <strong>{actionTarget.newStatus}</strong>?</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionTarget(null)}
                className="btn btn-outline"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="btn btn-primary"
                disabled={isProcessing}
                style={{ backgroundColor: actionTarget.action === 'delete' ? 'var(--color-danger)' : 'var(--color-primary)' }}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
  },
  description: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  refreshBtn: {
    fontSize: 'var(--font-size-xs)',
  },
  feedbackBox: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 'var(--font-size-xs)',
    border: '1px solid currentColor',
  },
  closeFeedback: {
    fontSize: '16px',
    cursor: 'pointer',
    color: 'inherit',
    border: 'none',
    background: 'none',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
  },
  searchInput: {
    flex: 1,
    minWidth: '220px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  selectInput: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    minWidth: '150px',
    outline: 'none',
  },
  stateBox: {
    padding: 'var(--space-8)',
    textAlign: 'center',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    animation: 'spin 0.8s linear infinite',
  },
  titleText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    display: 'block',
  },
  subtext: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '1px',
  },
  typeText: {
    textTransform: 'capitalize',
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
  },
  verifiedBadge: {
    fontSize: '10px',
    color: '#1e6b3f',
    fontWeight: '600',
  },
  unverifiedBadge: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  actionRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-1)',
    paddingTop: 'var(--space-2)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 24, 20, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-4)',
  },
  modalCard: {
    maxWidth: '440px',
    width: '100%',
    padding: 'var(--space-5)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--radius-md)',
  },
};

export default OpportunityQueueView;
