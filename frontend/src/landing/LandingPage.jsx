import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ROLE_HOME_ROUTES } from '../lib/constants.js';
import './LandingPage.css';

export function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  // Smooth scroll reveal effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleRoleLogin = (roleKey) => {
    if (isAuthenticated && role) {
      navigate(ROLE_HOME_ROUTES[role] || '/');
    } else {
      navigate(`/login?role=${roleKey}`);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="sutra-landing">
      {/* ══════════════════════════════════════════════════════════
           HEADER
      ══════════════════════════════════════════════════════════ */}
      <header className="landing-header">
        <a
          className="landing-logo"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M25 25 L75 75 M25 75 L75 25 M35 15 L85 65 M15 35 L65 85"
              stroke="var(--color-primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="25" cy="25" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="75" cy="75" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="25" cy="75" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="75" cy="25" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="35" cy="15" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="85" cy="65" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="15" cy="35" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
            <circle cx="65" cy="85" r="4" fill="var(--color-bg-subtle)" stroke="var(--color-primary)" strokeWidth="3" />
          </svg>
          <div className="landing-logo-text">
            <span className="brand">SUTRA</span>
            <span className="tagline">Talent &amp; Recruitment Platform</span>
          </div>
        </a>

        <nav className="landing-nav">
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About SUTRA</a>
          <a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>Role Ecosystem</a>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Platform Features</a>
          <a href="#impact" onClick={(e) => { e.preventDefault(); scrollToSection('impact'); }}>Impact Metrics</a>
        </nav>

        <div className="landing-header-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <button
              className="btn-landing-primary"
              onClick={() => navigate(ROLE_HOME_ROUTES[role] || '/')}
            >
              Go to Workspace
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              className="btn-landing-primary"
              onClick={() => scrollToSection('roles')}
            >
              Get Started
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
           HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="landing-hero">
        <div className="landing-hero-grid">
          {/* Left: Content */}
          <div className="landing-hero-content reveal">
            <div className="landing-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Smart Unified Talent &amp; Recruitment Alignment
            </div>

            <h1 className="landing-hero-title">
              Bridge the Gap Between{' '}
              <span className="title-highlight">Academic Potential</span> &amp; Industry Needs.
            </h1>

            <p className="landing-hero-sub">
              SUTRA is an intelligent, multi-sided ecosystem that unifies{' '}
              <strong>Students</strong>, <strong>Academicians</strong>, <strong>Recruiters</strong>, and{' '}
              <strong>Institutions</strong>. We analyze skill gaps, track readiness, and match candidates directly to open opportunities.
            </p>

            <div className="landing-hero-ctas">
              <button
                className="btn-hero-launch"
                onClick={() => scrollToSection('roles')}
              >
                Launch SUTRA Workspace
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                className="btn-hero-secondary"
                onClick={() => scrollToSection('about')}
              >
                Learn How It Works
              </button>
            </div>

            <div className="landing-hero-stats">
              <div>
                <span className="landing-stat-num">94%</span>
                <span className="landing-stat-label">Skill Match Precision</span>
              </div>
              <div>
                <span className="landing-stat-num">10k+</span>
                <span className="landing-stat-label">Verified Profiles</span>
              </div>
              <div>
                <span className="landing-stat-num">3.5x</span>
                <span className="landing-stat-label">Faster Hiring Drives</span>
              </div>
            </div>
          </div>

          {/* Right: Card Visual */}
          <div className="landing-hero-visual reveal" style={{ transitionDelay: '0.15s' }}>
            <div className="landing-blob-1" />
            <div className="landing-blob-2" />

            <div className="landing-hero-card">
              {/* Card Header */}
              <div className="landing-card-header">
                <div className="landing-card-user">
                  <div className="landing-avatar">S</div>
                  <div>
                    <h3>Target Role Alignment</h3>
                    <p>Frontend Software Engineer</p>
                  </div>
                </div>
                <span className="readiness-badge">92% Readiness</span>
              </div>

              {/* Skill Bars */}
              <div className="skill-bars">
                <div className="skill-row">
                  <div className="skill-label-row">
                    <span>React &amp; Modern Web Architecture</span>
                    <span style={{ color: 'var(--color-primary)' }}>95%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: '95%', background: 'var(--color-primary)' }} />
                  </div>
                </div>

                <div className="skill-row">
                  <div className="skill-label-row">
                    <span>TypeScript &amp; Data Structures</span>
                    <span style={{ color: 'var(--color-secondary)' }}>88%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: '88%', background: 'var(--color-secondary)' }} />
                  </div>
                </div>

                <div className="skill-row">
                  <div className="skill-label-row">
                    <span>API Integration &amp; State Management</span>
                    <span style={{ color: 'var(--color-success)' }}>91%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: '91%', background: 'var(--color-success)' }} />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="landing-hero-status">
                <div className="landing-status-left">
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>
                    <span>AI Candidate Verification</span>
                    <small>Shortlisted for Northstar Labs</small>
                  </div>
                </div>
                <span className="active-pill">Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           ABOUT SUTRA — THEORETICAL FOUNDATION
      ══════════════════════════════════════════════════════════ */}
      <section id="about">
        <div className="container">
          <div className="landing-section-header reveal">
            <span className="landing-badge">Theoretical Framework</span>
            <h2 className="landing-section-title">The SUTRA Talent Alignment Architecture</h2>
            <p className="landing-section-sub">
              SUTRA (Smart Unified Talent &amp; Recruitment Alignment) solves the structural divide between university engineering curricula and evolving industry tech stacks. By replacing static, unverified resumes with an active data layer of verified competencies, SUTRA establishes an objective benchmark for employability.
            </p>
          </div>

          <div className="pillars-grid">
            {/* Pillar 1 */}
            <div className="pillar-card reveal">
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>Canonical Skill Taxonomy</h3>
              <p>Standardizes 200+ canonical technical, domain, and soft skills with aliases, proficiency tiers (Beginner to Expert), and role-to-skill competency models mapped to industry demand.</p>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
              </div>
              <h3>Continuous Skill Gap Analysis</h3>
              <p>Compares verified student competencies directly against target role specifications, calculating gap severity and categorizing proficiencies into strong, weak, and missing skills.</p>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3>Live Employability Portfolio</h3>
              <p>Replaces static PDFs with live verified profiles syncing dynamic voice-assisted onboarding, verified GitHub and project proof, institution-approved certifications, and auto-generated resumes.</p>
            </div>

            {/* Pillar 4 */}
            <div className="pillar-card reveal" style={{ transitionDelay: '0.3s' }}>
              <div className="pillar-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3>Algorithmic Matchmaking Engine</h3>
              <p>Evaluates weighted skill compatibility, eligibility criteria, and candidate readiness to deliver high-precision talent pipelines to recruiters and placement cells.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           ROLE ECOSYSTEM
      ══════════════════════════════════════════════════════════ */}
      <section id="roles">
        <div className="container">
          <div className="landing-section-header reveal">
            <span className="landing-badge">Role Ecosystem</span>
            <h2 className="landing-section-title">Tailored Experiences for Every Role</h2>
            <p className="landing-section-sub">Select a role to see how SUTRA transforms daily workflows and unlocks value across the career spectrum.</p>
          </div>

          <div className="roles-grid">
            {/* Student */}
            <div className="role-card reveal">
              <div>
                <div className="role-icon caramel">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <h3>Candidates &amp; Students</h3>
                <p className="role-desc">Build verified skill portfolios, benchmark your readiness against dream jobs, and apply directly to matching roles.</p>
                <ul className="role-features">
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Target role gap evaluation
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Interactive learning paths
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    One-click verified application
                  </li>
                </ul>
              </div>
              <button className="role-btn" onClick={() => handleRoleLogin('student')}>
                Login as Candidate
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Faculty */}
            <div className="role-card reveal" style={{ transitionDelay: '0.1s' }}>
              <div>
                <div className="role-icon steel">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                </div>
                <h3>Academicians &amp; Faculty</h3>
                <p className="role-desc">Monitor student cohort performance, manage mentorship sessions, and co-author R&amp;D projects with industry leaders.</p>
                <ul className="role-features">
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Cohort skill gap tracking
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Structured mentorship desk
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Industry collaboration ops
                  </li>
                </ul>
              </div>
              <button className="role-btn" onClick={() => handleRoleLogin('faculty')}>
                Login as Academician
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Recruiter */}
            <div className="role-card reveal" style={{ transitionDelay: '0.2s' }}>
              <div>
                <div className="role-icon caramel">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3>Industry Recruiters</h3>
                <p className="role-desc">Access pre-vetted candidate pools, automate AI shortlisting, schedule interview loops, and host talent drives.</p>
                <ul className="role-features">
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    AI candidate shortlisting
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Custom opportunity creation
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Integrated interview scheduling
                  </li>
                </ul>
              </div>
              <button className="role-btn" onClick={() => handleRoleLogin('industry')}>
                Login as Recruiter
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Institution */}
            <div className="role-card reveal" style={{ transitionDelay: '0.3s' }}>
              <div>
                <div className="role-icon steel">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h3>Institutions &amp; Colleges</h3>
                <p className="role-desc">Gain macro placement insights, launch department assessment campaigns, and align curriculum with market demand.</p>
                <ul className="role-features">
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Placement rate analytics
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Assessment campaign desk
                  </li>
                  <li className="role-feature">
                    <svg className="check-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Training program deployment
                  </li>
                </ul>
              </div>
              <button className="role-btn" onClick={() => handleRoleLogin('institution')}>
                Login as Institution
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           PLATFORM FEATURES — EXACT CORE CAPABILITIES
      ══════════════════════════════════════════════════════════ */}
      <section id="features">
        <div className="container">
          <div className="landing-section-header reveal">
            <span className="landing-badge">Core Platform Capabilities</span>
            <h2 className="landing-section-title">Engineered for Verification, Precision &amp; Outcomes</h2>
            <p className="landing-section-sub">
              Every capability in SUTRA directly eliminates bottlenecks in student skill development, institutional tracking, and industry recruitment.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item reveal">
              <div className="feature-num">1</div>
              <div>
                <h4>AI Voice-Assisted Onboarding &amp; Resume Sync</h4>
                <p>Students can speak naturally or describe career achievements; AI extracts structured technical skills, project milestones, and certifications, instantly synchronizing them with your verified profile and ATS-ready resume.</p>
              </div>
            </div>

            <div className="feature-item reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="feature-num">2</div>
              <div>
                <h4>Deterministic Skill Assessment Engine</h4>
                <p>Role-targeted question banks with automated anti-cheat validation, multi-select scoring, and raw point-to-percentage normalization feeding directly into verified student skill profiles.</p>
              </div>
            </div>

            <div className="feature-item reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="feature-num">3</div>
              <div>
                <h4>Automated Skill Gap Analyzer &amp; Readiness Score</h4>
                <p>Compares student competencies against real industry job profiles (e.g., Full Stack, Cloud, AI/ML), computing real-time industry readiness scores, critical gap highlights, and targeted training recommendations.</p>
              </div>
            </div>

            <div className="feature-item reveal" style={{ transitionDelay: '0.05s' }}>
              <div className="feature-num">4</div>
              <div>
                <h4>Institutional Assessment Campaigns &amp; Cohort Analytics</h4>
                <p>Colleges launch cohort-wide skill evaluation campaigns, tracking department completion rates, placement pipelines, and curriculum alignment data in real-time.</p>
              </div>
            </div>

            <div className="feature-item reveal" style={{ transitionDelay: '0.15s' }}>
              <div className="feature-num">5</div>
              <div>
                <h4>Opportunity Marketplace with Weighted Matchmaking</h4>
                <p>Recruiters publish jobs, internships, apprenticeships, and live projects with strict required vs. preferred skill criteria, automatically receiving compatibility-ranked candidate pipelines.</p>
              </div>
            </div>

            <div className="feature-item reveal" style={{ transitionDelay: '0.25s' }}>
              <div className="feature-num">6</div>
              <div>
                <h4>Multi-Role Governance &amp; 5-Stage Recruitment Funnel</h4>
                <p>Full audit trail, institution document verification queues, and transparent application tracking from Applied to Under Review, Shortlisted, Interview, and Selected.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           CTA BANNER
      ══════════════════════════════════════════════════════════ */}
      <section id="impact">
        <div className="container">
          <div className="cta-banner reveal">
            <div className="cta-left">
              <span className="cta-badge">Get Started Today</span>
              <h2>Ready to Align Skills with Opportunity?</h2>
              <p>Join thousands of students, faculty members, recruiters, and educational leaders building the future of talent alignment on SUTRA.</p>
            </div>
            <div className="cta-right">
              <button
                className="btn-cta"
                onClick={() => scrollToSection('roles')}
              >
                Access SUTRA Portal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="cta-blob" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M25 25 L75 75 M25 75 L75 25 M35 15 L85 65 M15 35 L65 85"
                stroke="var(--color-primary)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
            <span>SUTRA Alignment Platform &copy; 2026</span>
          </div>

          <div className="footer-links">
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
            <a href="#roles" onClick={(e) => { e.preventDefault(); scrollToSection('roles'); }}>Ecosystem</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <button className="sign-in" onClick={() => scrollToSection('roles')}>Sign In</button>
            <button onClick={toggleTheme} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
