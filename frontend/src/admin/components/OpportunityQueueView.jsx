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
          <p style={{ color: 'var(--color-text-muted)' }}>No opportunities found matching your filters.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title & Company</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Location / Mode</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Trust Badge</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{opp.title}</strong>
                    <div style={styles.subtext}>{opp.companyName || 'Anonymous Company'}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeText}>{opp.type}</span>
                  </td>
                  <td style={styles.td}>
                    <div>{opp.location || 'Not specified'}</div>
                    <span style={styles.subtext}>{opp.workMode}</span>
                  </td>
                  <td style={styles.td}>
                    <span className={`badge ${opp.status === 'published' ? 'badge-role' : 'badge-burgundy'}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {opp.verificationBadge ? (
                      <span style={{ color: 'var(--color-success)', fontWeight: '600', fontSize: 'var(--font-size-xs)' }}>
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        Unverified
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionRow}>
                      {opp.status !== 'published' ? (
                        <button
                          onClick={() => setActionTarget({ opp, action: 'status', newStatus: 'published' })}
                          className="btn btn-outline"
                          style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)' }}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionTarget({ opp, action: 'status', newStatus: 'paused' })}
                          className="btn btn-outline"
                          style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)' }}
                        >
                          Pause
                        </button>
                      )}
                      <button
                        onClick={() => setActionTarget({ opp, action: 'delete' })}
                        className="btn btn-outline"
                        style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}
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
    gap: 'var(--space-4)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-1)',
  },
  refreshBtn: {
    fontSize: 'var(--font-size-xs)',
  },
  toolbar: {
    display: 'flex',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '240px',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-bg-surface)',
  },
  selectInput: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-bg-surface)',
  },
  stateBox: {
    padding: 'var(--space-12)',
    textAlign: 'center',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    animation: 'spin 0.8s linear infinite',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-surface)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: 'var(--font-size-sm)',
  },
  th: {
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-mist-light)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-size-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid var(--color-border-subtle)',
    transition: 'background-color var(--transition-fast)',
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
    verticalAlign: 'middle',
  },
  subtext: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  typeText: {
    textTransform: 'capitalize',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
  },
  actionRow: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-2)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 'var(--space-4)',
  },
  modalCard: {
    maxWidth: '440px',
    width: '100%',
  },
  feedbackBox: {
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 'var(--font-size-sm)',
  },
  closeFeedback: {
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
  },
};

export default OpportunityQueueView;
