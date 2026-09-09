import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';
import { ROLES, ROLE_LABELS } from '../../lib/constants.js';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
];

export function UserGovernanceView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listUsers({
        q: searchQuery || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
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

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return { backgroundColor: 'var(--color-burgundy-red)', color: '#ffffff' };
      case ROLES.INDUSTRY:
        return { backgroundColor: 'var(--color-burgundy-light)', color: 'var(--color-burgundy-red)' };
      case ROLES.INSTITUTION:
        return { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' };
      case ROLES.FACULTY:
        return { backgroundColor: 'var(--color-steel-light)', color: 'var(--color-steel-dark)' };
      case ROLES.STUDENT:
      default:
        return { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-primary)' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d' };
      case 'suspended':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' };
      case 'pending':
      default:
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3>User Identity & Governance Deck</h3>
          <p style={styles.description}>
            Manage, search, and audit user accounts across all platform roles (Students, Faculty, Institutions, Industry recruiters, and Admins).
          </p>
        </div>
        <button onClick={fetchUsers} className="btn btn-outline" style={styles.refreshBtn}>
          Refresh Users
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div style={styles.toolbar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by user name or email..."
          style={styles.searchInput}
        />

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={styles.selectInput}
        >
          <option value="">All User Roles</option>
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r] || r}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={styles.selectInput}
        >
          <option value="">All Account Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {(searchQuery || roleFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('');
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
          <p>Loading user directory...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchUsers} className="btn btn-primary">Try Again</button>
        </div>
      ) : users.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>No user accounts found matching your query criteria.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email & Verification</th>
                <th style={styles.th}>Assigned Role</th>
                <th style={styles.th}>Account Status</th>
                <th style={styles.th}>Last Login</th>
                <th style={styles.th}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.avatarBubble}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{u.name || 'Unnamed User'}</strong>
                        {u.phone && <div style={styles.subtext}>{u.phone}</div>}
                      </div>
                    </div>
                  </td>

                  <td style={styles.td}>
                    <div>{u.email}</div>
                    <div style={{ marginTop: '2px' }}>
                      {u.emailVerified ? (
                        <span style={styles.verifiedBadge}>✓ Email Verified</span>
                      ) : (
                        <span style={styles.unverifiedBadge}>Unverified Email</span>
                      )}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      className="badge"
                      style={{
                        ...styles.roleBadge,
                        ...getRoleBadgeStyle(u.role),
                      }}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <span
                      className="badge"
                      style={{
                        ...styles.statusBadge,
                        ...getStatusBadgeStyle(u.status),
                      }}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td style={{ ...styles.td, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {formatDate(u.lastLogin)}
                  </td>

                  <td style={{ ...styles.td, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {formatDate(u.createdAt)}
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
            Page {meta.page} of {meta.totalPages} ({meta.total} registered users)
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
    minWidth: '160px',
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
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  avatarBubble: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-steel-light)',
    color: 'var(--color-steel-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  subtext: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-block',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-block',
  },
  verifiedBadge: {
    fontSize: '10px',
    color: '#15803d',
    fontWeight: '600',
  },
  unverifiedBadge: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-2)',
  },
};

export default UserGovernanceView;
