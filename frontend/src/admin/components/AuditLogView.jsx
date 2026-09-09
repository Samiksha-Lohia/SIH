import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

const ACTIONS = [
  'auth.login',
  'application.status_change',
  'portfolio.verify',
  'document.verify',
  'company.verify',
];

export function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Inspector modal
  const [inspectedLog, setInspectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs({
        action: actionFilter || undefined,
        page,
        limit: 20,
      });
      setLogs(res.logs);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>System Audit Trail & Security Logs</h3>
          <p style={styles.description}>
            Immutable log trail of platform events (logins, status alterations, document verifications).
          </p>
        </div>
        <button onClick={fetchLogs} className="btn btn-outline" style={styles.refreshBtn}>
          Refresh Logs
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={styles.toolbar}>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          style={styles.selectInput}
        >
          <option value="">All Action Types</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* States */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading audit trail...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchLogs} className="btn btn-primary">Try Again</button>
        </div>
      ) : logs.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>No audit events recorded under this filter.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Resource & ID</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td>
                    <span className="badge badge-role" style={{ fontSize: '11px', fontWeight: '500' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    {log.actor ? (
                      <div>
                        <strong style={{ color: 'var(--color-text-main)', fontSize: 'var(--font-size-xs)' }}>{log.actor.name || 'User'}</strong>
                        <div style={styles.subtext}>{log.actor.email} • {log.actorRole || log.actor.role}</div>
                      </div>
                    ) : (
                      <span style={styles.subtext}>System / Anonymous</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--font-size-xs)' }}>{log.resource || '—'}</div>
                    {log.resourceId && <div style={{ ...styles.subtext, fontFamily: 'monospace', fontSize: '10px' }}>{log.resourceId}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {log.ip || '127.0.0.1'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.meta && Object.keys(log.meta).length > 0 ? (
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="btn btn-ghost"
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        Inspect
                      </button>
                    ) : (
                      <span style={styles.subtext}>—</span>
                    )}
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
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            Page {meta.page} of {meta.totalPages} ({meta.total} events)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectedLog && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>Audit Event Payload</h4>
              <button onClick={() => setInspectedLog(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>×</button>
            </div>
            <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Action: <strong>{inspectedLog.action}</strong> • Time: {formatDate(inspectedLog.createdAt)}
            </div>
            <pre style={styles.jsonPre}>
              {JSON.stringify(inspectedLog.meta, null, 2)}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
              <button onClick={() => setInspectedLog(null)} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                Dismiss
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
  refreshBtn: { fontSize: 'var(--font-size-xs)' },
  toolbar: { display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' },
  selectInput: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-surface)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
  subtext: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'clamp(8px, 2vw, 16px)' },
  modalCard: { maxWidth: 'min(95vw, 520px)', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  jsonPre: {
    backgroundColor: 'var(--color-bg-app)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '11px',
    fontFamily: 'monospace',
    maxHeight: '300px',
    overflowY: 'auto',
  },
};

export default AuditLogView;
