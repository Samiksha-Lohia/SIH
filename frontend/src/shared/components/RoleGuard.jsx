import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Route guard component protecting private role-specific routes.
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Optional array of ROLES permitted to access the route.
 * @param {React.ReactNode} [props.children] - Optional children to render instead of Outlet.
 */
export function RoleGuard({ allowedRoles, children }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Initializing SUTRA session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
}

const styles = {
  loadingContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-4)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-family-display)',
  },
};

export default RoleGuard;
