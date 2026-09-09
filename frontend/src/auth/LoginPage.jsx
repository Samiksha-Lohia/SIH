import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME_ROUTES } from '../lib/constants.js';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const user = await login({ email, password });
      const targetRoute = from || ROLE_HOME_ROUTES[user.role] || '/';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>SUTRA</h1>
          <p style={styles.subtitle}>Smart Unified Talent & Recruitment Alignment Platform</p>
        </div>

        {errorMessage && (
          <div style={styles.errorBox}>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={styles.submitBtn}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-app)',
    padding: 'var(--space-6)',
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    padding: 'var(--space-8)',
    boxShadow: 'var(--shadow-md)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 'var(--space-6)',
  },
  title: {
    color: 'var(--color-primary)',
    fontSize: 'var(--font-size-3xl)',
    letterSpacing: '-0.02em',
    marginBottom: 'var(--space-1)',
  },
  subtitle: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  errorBox: {
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(114, 16, 16, 0.2)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    marginBottom: 'var(--space-4)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  label: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg-surface)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  submitBtn: {
    width: '100%',
    padding: 'var(--space-3)',
    fontSize: 'var(--font-size-base)',
    marginTop: 'var(--space-2)',
  },
};

export default LoginPage;
