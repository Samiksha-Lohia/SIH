import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME_ROUTES, ROLE_LABELS } from '../../lib/constants.js';

export function UnauthorizedPage() {
  const { role } = useAuth();
  const homeRoute = (role && ROLE_HOME_ROUTES[role]) || '/login';

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={styles.iconCircle}>
          <span style={styles.icon}>!</span>
        </div>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Access Restricted</h2>
        <p style={{ marginBottom: 'var(--space-4)', maxWidth: '400px' }}>
          Your current account role ({role ? ROLE_LABELS[role] || role : 'Guest'}) does not have permission to view this resource.
        </p>
        <Link to={homeRoute} className="btn btn-primary">
          Return to Your Dashboard
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
  },
  card: {
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-burgundy-light)',
    color: 'var(--color-burgundy-red)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-4)',
  },
  icon: {
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'var(--font-family-display)',
  },
};

export default UnauthorizedPage;
