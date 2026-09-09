import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

const VERIFICATION_OPTIONS = [
  { value: 'unverified', label: 'Unverified' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

export function InstitutionGovernanceView() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Verification modal state
  const [modalTarget, setModalTarget] = useState(null); // { institution, targetStatus: 'verified' | 'rejected' }
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listInstitutions({
        q: searchQuery || undefined,
        verificationStatus: statusFilter || undefined,
        page,
        limit: 15,
      });
      setInstitutions(res.institutions);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch institutions');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const handleConfirmVerify = async () => {
    if (!modalTarget) return;
    setIsProcessing(true);
    try {
      const updated = await adminApi.verifyInstitution(modalTarget.institution.id, modalTarget.targetStatus);
      setFeedback({
        type: 'success',
        message: `Institution "${updated.name || modalTarget.institution.name}" has been marked as ${modalTarget.targetStatus}.`,
      });
      setModalTarget(null);
      // Refresh the row / data
      await fetchInstitutions();
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
          <h3>Institution Governance & Accreditation Desk</h3>
          <p style={styles.description}>
            Review college & university profiles, inspect institutional credentials, and approve or reject verification requests.
          </p>
        </div>
        <button onClick={fetchInstitutions} className="btn btn-outline" style={styles.refreshBtn}>
          Refresh Institutions
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
          placeholder="Search by institution name, location, or department..."
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
          <p>Loading institutions directory...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchInstitutions} className="btn btn-primary">Try Again</button>
        </div>
      ) : institutions.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>No institutions found matching current filter criteria.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Location</th>
                <th>Departments</th>
                <th>Verification Status</th>
                <th>Verified By</th>
                <th>Completeness</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <div>
                      <strong style={styles.nameText}>{inst.name}</strong>
                      {inst.website && (
                        <div>
                          <a
                            href={inst.website.startsWith('http') ? inst.website : `https://${inst.website}`}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.link}
                          >
                            {inst.website.replace(/^https?:\/\//, '')} ↗
                          </a>
                        </div>
                      )}
                      {inst.user && (
                        <div style={styles.subtext}>
                          Admin: {inst.user.name} ({inst.user.email})
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: 'var(--font-size-xs)' }}>{inst.location || '—'}</div>
                    {inst.address && <div style={styles.subtext}>{inst.address}</div>}
                  </td>

                  <td>
                    {inst.departments && inst.departments.length > 0 ? (
                      <div style={styles.tagsWrap}>
                        {inst.departments.slice(0, 2).map((dep, idx) => (
                          <span key={idx} className="badge badge-role" style={{ fontSize: '10px' }}>
                            {dep}
                          </span>
                        ))}
                        {inst.departments.length > 2 && (
                          <span style={styles.subtext}>+{inst.departments.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span style={styles.subtext}>—</span>
                    )}
                  </td>

                  <td>
                    <span className={`status-pill status-${inst.verificationStatus || 'unverified'}`}>
                      <span className="status-pill-dot" />
                      {inst.verificationStatus || 'unverified'}
                    </span>
                  </td>

                  <td>
                    {inst.verifiedBy ? (
                      <div>
                        <strong style={{ fontSize: '12px' }}>{inst.verifiedBy.name || 'Admin'}</strong>
                        <div style={styles.subtext}>{formatDate(inst.verifiedAt)}</div>
                      </div>
                    ) : (
                      <span style={styles.subtext}>Unverified</span>
                    )}
                  </td>

                  <td>
                    <div style={styles.completenessWrap}>
                      <div style={styles.progressBarBg}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${inst.completeness || 0}%`,
                            backgroundColor:
                              (inst.completeness || 0) >= 80
                                ? '#207246'
                                : (inst.completeness || 0) >= 50
                                ? '#946000'
                                : 'var(--color-burgundy-red)',
                          }}
                        />
                      </div>
                      <span style={styles.completenessText}>{inst.completeness || 0}%</span>
                    </div>
                  </td>

                  <td>
                    <div style={styles.actionButtons}>
                      {inst.verificationStatus !== 'verified' && (
                        <button
                          onClick={() => setModalTarget({ institution: inst, targetStatus: 'verified' })}
                          className="btn btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Verify
                        </button>
                      )}
                      {inst.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => setModalTarget({ institution: inst, targetStatus: 'rejected' })}
                          className="btn btn-ghost"
                          style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--color-burgundy-red)' }}
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
            Page {meta.page} of {meta.totalPages} ({meta.total} institutions)
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
              Confirm Institution {modalTarget.targetStatus === 'verified' ? 'Verification' : 'Rejection'}
            </h4>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Are you sure you want to set the verification status of{' '}
              <strong>{modalTarget.institution.name}</strong> to{' '}
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
                ? 'Verification unlocks official institutional analytics and establishes platform trust badges.'
                : 'Rejecting marks this institution unapproved, withholding trusted verification badges.'}
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
    flex: '1',
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
    minWidth: '170px',
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
  nameText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    display: 'block',
  },
  link: {
    fontSize: '11px',
    color: 'var(--color-steel-dark)',
    textDecoration: 'none',
  },
  subtext: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '1px',
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
  },
  completenessWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  progressBarBg: {
    width: '60px',
    height: '4px',
    backgroundColor: 'var(--color-mist-light)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  completenessText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  actionButtons: {
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

export default InstitutionGovernanceView;
