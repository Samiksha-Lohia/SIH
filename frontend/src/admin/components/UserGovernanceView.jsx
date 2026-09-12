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

  // New user provision modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setCreateError('Full name, email address, and initial password are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const newUser = await adminApi.createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
      });
      setCreateSuccess(`Account for ${newUser.name} (${ROLE_LABELS[newUser.role] || newUser.role}) created successfully.`);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'student',
      });
      fetchUsers();
      setTimeout(() => {
        setShowAddModal(false);
        setCreateSuccess(null);
      }, 1200);
    } catch (err) {
      setCreateError(err.message || 'Failed to create user account');
    } finally {
      setCreating(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => {
              setCreateError(null);
              setCreateSuccess(null);
              setShowAddModal(true);
            }}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            + Add New User / Student
          </button>
          <button onClick={fetchUsers} className="btn btn-outline" style={styles.refreshBtn}>
            Refresh Users
          </button>
        </div>
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
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Loading user directory...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchUsers} className="btn btn-primary">Try Again</button>
        </div>
      ) : users.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>No user accounts found matching your query criteria.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email & Verification</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Last Login</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={styles.userCell}>
                      <div style={styles.avatarBubble}>
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={styles.userNameText}>{u.name || 'Unnamed User'}</strong>
                        {u.phone && <div style={styles.subtext}>{u.phone}</div>}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={styles.emailText}>{u.email}</div>
                    <div style={{ marginTop: '2px' }}>
                      {u.emailVerified ? (
                        <span style={styles.verifiedBadge}>✓ Verified</span>
                      ) : (
                        <span style={styles.unverifiedBadge}>Unverified</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className="badge"
                      style={getRoleBadgeStyle(u.role)}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>

                  <td>
                    <span className={`status-pill status-${u.status || 'pending'}`}>
                      <span className="status-pill-dot" />
                      {u.status}
                    </span>
                  </td>

                  <td style={styles.monoCell}>
                    {formatDate(u.lastLogin)}
                  </td>

                  <td style={styles.monoCell}>
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

      {/* Provision New User / Student Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--color-bg-surface)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>Provision New User Account</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Create and register an active user across SUTRA roles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-ghost"
                style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.8125rem',
                }}
              >
                {createError}
              </div>
            )}

            {createSuccess && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  color: '#065f46',
                  fontSize: '0.8125rem',
                }}
              >
                ✓ {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                  Account Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="student">Student (Academic Learner)</option>
                  <option value="faculty">Faculty (Academician / Mentor)</option>
                  <option value="institution">Institution (College / University Admin)</option>
                  <option value="industry">Industry (Corporate Recruiter)</option>
                  <option value="admin">Administrator (System Governance)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav@sutra.dev"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                  Initial Password * (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                >
                  {creating ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
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
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  avatarBubble: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-steel-light)',
    color: 'var(--color-steel-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '11px',
    flexShrink: 0,
  },
  userNameText: {
    fontSize: '13px',
    color: 'var(--color-text-primary)',
    fontWeight: '600',
    display: 'block',
  },
  emailText: {
    fontSize: '12px',
    color: 'var(--color-text-primary)',
  },
  subtext: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
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
  monoCell: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-1)',
    paddingTop: 'var(--space-2)',
  },
};

export default UserGovernanceView;
