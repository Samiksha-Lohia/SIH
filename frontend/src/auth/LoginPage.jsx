import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ROLE_HOME_ROUTES } from '../lib/constants.js';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark';

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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-family-body)',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* ---------------- LEFT HERO COLUMN ---------------- */}
      <div
        style={{
          flex: '1 1 450px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(2.5rem, 5.5vw, 5.5rem)',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.3s ease, color 0.3s ease',
          // Light Theme: Deep obsidian slate gradient | Dark Theme: Warm almond sand linen gradient
          background: isDark
            ? 'linear-gradient(145deg, #efe8de 0%, #e5d8ca 50%, #d8c7b5 100%)'
            : 'linear-gradient(145deg, #09171d 0%, #11232b 55%, #182d37 100%)',
        }}
      >
        {/* SUTRA Brand Top */}
        <div>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDark ? '#10232a' : '#ffffff',
              display: 'inline-block',
            }}
          >
            SUTRA
          </span>
        </div>

        {/* Hero Value Proposition Headline & Copy */}
        <div style={{ maxWidth: '540px', margin: 'auto 0' }}>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(2.5rem, 4.5vw, 3.75rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              margin: '0 0 1.75rem 0',
              color: isDark ? '#1a2930' : '#ffffff',
            }}
          >
            Readiness,<br />
            measured.<br />
            <span style={{ color: '#b58863' }}>Placement, aligned.</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)',
              lineHeight: 1.6,
              color: isDark ? '#5d6970' : '#889aa4',
              margin: 0,
              maxWidth: '460px',
            }}
          >
            Smart Unified Talent &amp; Recruitment Alignment Platform — one continuous thread from skill gap to signed offer.
          </p>
        </div>

        {/* Clean bottom spacer (Stats / numbers omitted as instructed) */}
        <div style={{ height: '1.5rem' }} />
      </div>

      {/* ---------------- RIGHT FORM COLUMN ---------------- */}
      <div
        style={{
          flex: '1 1 450px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(2rem, 5vw, 5rem)',
          boxSizing: 'border-box',
          position: 'relative',
          transition: 'background 0.3s ease, color 0.3s ease',
          // Light Theme: Warm light off-white linen | Dark Theme: Deep obsidian charcoal
          backgroundColor: isDark ? '#0e1518' : '#faf8f5',
        }}
      >
        {/* Floating Theme Toggle in Top-Right Corner */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(1.5rem, 3vw, 2.75rem)',
            right: 'clamp(1.5rem, 3vw, 2.75rem)',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '6px',
              border: isDark ? '1px solid #233139' : '1px solid #e5ded7',
              backgroundColor: isDark ? '#142228' : '#ffffff',
              color: isDark ? '#d3c3b9' : '#3d4d55',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            {isDark ? (
              // Sun icon in Dark Mode (click to switch to Light)
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              // Moon icon in Light Mode (click to switch to Dark)
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* Auth Form Container */}
        <div style={{ width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
          {/* Overline & Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isDark ? '#82939c' : '#728189',
                marginBottom: '0.65rem',
              }}
            >
              PLATFORM ACCESS
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '2.15rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: '0 0 0.45rem 0',
                color: isDark ? '#f4ede6' : '#10232a',
              }}
            >
              Sign in
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: isDark ? '#8d9ca4' : '#697880',
              }}
            >
              Use your institutional credentials to continue.
            </p>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: '6px',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
                backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.08)',
                border: isDark ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid rgba(220, 38, 38, 0.25)',
                color: isDark ? '#fca5a5' : '#dc2626',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#8999a2' : '#576770',
                  marginBottom: '0.45rem',
                }}
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@sutra.dev"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 0.95rem',
                  borderRadius: '6px',
                  border: isDark ? '1px solid #293841' : '1px solid #e1d9d1',
                  backgroundColor: isDark ? '#202c32' : '#f0eae4',
                  color: isDark ? '#f5ede6' : '#142228',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b58863';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#293841' : '#e1d9d1';
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isDark ? '#8999a2' : '#576770',
                  marginBottom: '0.45rem',
                }}
              >
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 0.95rem',
                  borderRadius: '6px',
                  border: isDark ? '1px solid #293841' : '1px solid #e1d9d1',
                  backgroundColor: isDark ? '#202c32' : '#f0eae4',
                  color: isDark ? '#f5ede6' : '#142228',
                  fontSize: '0.925rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b58863';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDark ? '#293841' : '#e1d9d1';
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                // In Dark Theme: warm lighter caramel with dark text | In Light Theme: warm caramel with white text
                backgroundColor: isDark ? '#c2946e' : '#ad805b',
                color: isDark ? '#141c20' : '#ffffff',
                fontSize: '0.925rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.75 : 1,
                boxShadow: isDark
                  ? '0 2px 6px rgba(0,0,0,0.3)'
                  : '0 1px 4px rgba(173, 128, 91, 0.25)',
                transition: 'background-color 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = isDark ? '#cea27c' : '#9c714e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = isDark ? '#c2946e' : '#ad805b';
                }
              }}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
              {!isSubmitting && <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>&rarr;</span>}
            </button>
          </form>

          {/* Trouble signing in footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: isDark ? '#6f7e87' : '#7b8a92',
              }}
            >
              Trouble signing in? Contact your placement cell administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
