import React from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS, ROLE_HOME_ROUTES } from '../../lib/constants.js';

export function AppLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const homeRoute = (role && ROLE_HOME_ROUTES[role]) || '/';

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div className="container" style={styles.headerContent}>
          <div style={styles.brandGroup}>
            <Link to={homeRoute} style={styles.brandLink}>
              <span style={styles.brandTitle}>SUTRA</span>
              <span style={styles.brandSubtitle}>Platform</span>
            </Link>
          </div>

          <div style={styles.userGroup}>
            {role && (
              <span className="badge badge-role">
                {ROLE_LABELS[role] || role}
              </span>
            )}
            {user && <span style={styles.userName}>{user.name}</span>}
            <button onClick={handleLogout} className="btn btn-outline" style={styles.logoutBtn}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={styles.footer}>
        <div className="container" style={styles.footerContent}>
          <p style={styles.footerText}>
            SUTRA Platform &copy; 2026 — Smart Unified Talent & Recruitment Alignment
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-bg-app)',
  },
  header: {
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '1px solid var(--color-border)',
    paddingTop: 'var(--space-4)',
    paddingBottom: 'var(--space-4)',
    boxShadow: 'var(--shadow-xs)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--space-2)',
    textDecoration: 'none',
  },
  brandTitle: {
    fontFamily: 'var(--font-family-display)',
    fontWeight: 'var(--font-weight-bold)',
    fontSize: 'var(--font-size-2xl)',
    color: 'var(--color-primary)',
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 'var(--font-weight-medium)',
  },
  userGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  userName: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)',
  },
  logoutBtn: {
    fontSize: 'var(--font-size-xs)',
    padding: 'var(--space-1) var(--space-3)',
  },
  main: {
    flex: 1,
    paddingTop: 'var(--space-8)',
    paddingBottom: 'var(--space-12)',
  },
  footer: {
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-surface)',
    paddingTop: 'var(--space-4)',
    paddingBottom: 'var(--space-4)',
  },
  footerContent: {
    textAlign: 'center',
  },
  footerText: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
};

export default AppLayout;
