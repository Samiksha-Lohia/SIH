import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

const VERIFICATION_OPTIONS = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

export function CompanyGovernanceView() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Verification modal state
  const [modalTarget, setModalTarget] = useState(null); // { industry, targetStatus: 'verified' | 'rejected' }
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchIndustries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend returns data.industries (and data.companies alias); we use data.industries
      const res = await adminApi.listIndustries({
        q: searchQuery || undefined,
        verificationStatus: statusFilter || undefined,
        page,
        limit: 15,
      });
      setIndustries(res.industries);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  const handleConfirmVerify = async () => {
    if (!modalTarget) return;
    setIsProcessing(true);
    try {
      const updated = await adminApi.verifyIndustry(modalTarget.industry.id, modalTarget.targetStatus);
      setFeedback({
        type: 'success',
        message: `Company "${updated.companyName || modalTarget.industry.companyName}" has been marked as ${modalTarget.targetStatus}.`,
      });
      setModalTarget(null);
      // Refresh the row / data
      await fetchIndustries();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Verification update failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'verified':
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'rejected':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'pending':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'unverified':
      default:
        return { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3>Company & Recruiter Governance Desk</h3>
          <p style={styles.description}>
            Verify corporate employer profiles, grant opportunity publishing rights, and review enterprise recruiter trust status.
          </p>
        </div>
        <button onClick={fetchIndustries} className="btn btn-outline" style={styles.refreshBtn}>
          Refresh Companies
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

      {/* Toolbar / Filters */}
      <div style={styles.toolbar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by company name, sector, or location..."
          style={styles.searchInput}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={styles.selectInput}
        >
          <option value="">All Verification Statuses</option>
          {VERIFICATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setPage(1);
            }}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content States */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading companies directory...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchIndustries} className="btn btn-primary">Try Again</button>
        </div>
      ) : industries.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>No companies found matching current query criteria.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Sector & Size</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Verification Status</th>
                <th style={styles.th}>Verified By</th>
                <th style={styles.th}>Completeness</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((ind) => (
                <tr key={ind.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div>
                      <strong>{ind.companyName}</strong>
                      {ind.website && (
                        <div>
                          <a
                            href={ind.website.startsWith('http') ? ind.website : `https://${ind.website}`}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.link}
                          >
                            {ind.website.replace(/^https?:\/\//, '')} ↗
                          </a>
                        </div>
                      )}
                      {ind.user && (
                        <div style={styles.subtext}>
                          Account: {ind.user.name} ({ind.user.email})
                        </div>
                      )}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div>{ind.sector || 'General'}</div>
                    {ind.size && (
                      <span className="badge badge-mist" style={{ fontSize: '11px', marginTop: '2px' }}>
                        {ind.size} employees
                      </span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <div>{ind.location || '—'}</div>
                  </td>

                  <td style={styles.td}>
                    <span
                      className="badge"
                      style={{
                        ...styles.statusBadge,
                        ...getStatusBadgeStyle(ind.verificationStatus),
                      }}
                    >
                      {ind.verificationStatus || 'unverified'}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {ind.verifiedBy ? (
                      <div>
                        <strong>{ind.verifiedBy.name || 'Admin'}</strong>
                        <div style={styles.subtext}>{ind.verifiedBy.email}</div>
                        <div style={{ ...styles.subtext, marginTop: '2px' }}>{formatDate(ind.verifiedAt)}</div>
                      </div>
                    ) : (
                      <span style={styles.subtext}>Not verified yet</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.completenessWrap}>
                      <div style={styles.progressBarBg}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${ind.completeness || 0}%`,
                            backgroundColor:
                              (ind.completeness || 0) >= 80
                                ? '#15803d'
                                : (ind.completeness || 0) >= 50
                                ? '#b45309'
                                : '#b91c1c',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{ind.completeness || 0}%</span>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {ind.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => setModalTarget({ industry: ind, targetStatus: 'verified' })}
                          className="btn btn-outline"
                          style={styles.verifyBtn}
                        >
                          Verify
                        </button>
                      )}
                      {ind.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => setModalTarget({ industry: ind, targetStatus: 'rejected' })}
                          className="btn btn-outline"
                          style={styles.rejectBtn}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
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
            Page {meta.page} of {meta.totalPages} ({meta.total} companies)
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
      {modalTarget && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4 style={{ marginBottom: 'var(--space-2)' }}>
              Confirm Company {modalTarget.targetStatus === 'verified' ? 'Verification' : 'Rejection'}
            </h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Are you sure you want to set the verification status of{' '}
              <strong>{modalTarget.industry.companyName}</strong> to{' '}
              <span
                style={{
                  fontWeight: 'bold',
                  color: modalTarget.targetStatus === 'verified' ? '#15803d' : '#b91c1c',
                }}
              >
                "{modalTarget.targetStatus.toUpperCase()}"
              </span>
              ?
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              {modalTarget.targetStatus === 'verified'
                ? 'Verified companies can publish high-impact opportunities and receive AI candidate recommendations.'
                : 'Rejecting marks this company unapproved and restricts platform publishing privileges.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setModalTarget(null)}
                disabled={isProcessing}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  backgroundColor:
                    modalTarget.targetStatus === 'verified'
                      ? '#15803d'
                      : 'var(--color-burgundy-red)',
                  borderColor:
                    modalTarget.targetStatus === 'verified'
                      ? '#15803d'
                      : 'var(--color-burgundy-red)',
                }}
              >
                {isProcessing
                  ? 'Updating...'
                  : modalTarget.targetStatus === 'verified'
                  ? 'Confirm Verification'
                  : 'Confirm Rejection'}
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
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-3)',
    alignItems: 'center',
  },
  searchInput: {
    flex: '1',
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
    minWidth: '180px',
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
  },
  td: {
    padding: 'var(--space-3) var(--space-4)',
    verticalAlign: 'middle',
  },
  link: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-primary)',
    textDecoration: 'none',
  },
  subtext: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-block',
  },
  completenessWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  progressBarBg: {
    width: '70px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: 'var(--color-border)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width var(--transition-base)',
  },
  actionButtons: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  verifyBtn: {
    fontSize: '11px',
    padding: '2px 8px',
    color: '#15803d',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  rejectBtn: {
    fontSize: '11px',
    padding: '2px 8px',
    color: '#b91c1c',
    borderColor: 'rgba(239, 68, 68, 0.4)',
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
};

export default CompanyGovernanceView;
