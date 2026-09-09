import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { studentApi } from './student.api.js';

import StudentProfileView from './components/StudentProfileView.jsx';
import SkillGapDashboardView from './components/SkillGapDashboardView.jsx';
import AssessmentFlowView from './components/AssessmentFlowView.jsx';
import OpportunityMarketplaceView from './components/OpportunityMarketplaceView.jsx';
import ApplicationTrackerView from './components/ApplicationTrackerView.jsx';
import DigitalPortfolioView from './components/DigitalPortfolioView.jsx';

export function StudentHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Top-Right Notifications Dropdown State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef(null);

  const [overviewStats, setOverviewStats] = useState({
    applicationsCount: 0,
    portfolioCount: 0,
    readinessScore: null,
    loading: true
  });

  const loadHeaderData = useCallback(async () => {
    try {
      const [profRes, unreadRes] = await Promise.allSettled([
        studentApi.getMyProfile(),
        studentApi.getUnreadNotificationCount()
      ]);

      let prof = null;
      if (profRes.status === 'fulfilled' && profRes.value) {
        prof = profRes.value.profile || profRes.value.student || profRes.value;
        setProfileData(prof);
      }

      if (unreadRes.status === 'fulfilled' && unreadRes.value) {
        setUnreadCount(unreadRes.value.count || 0);
      }

      // Fetch quick stats for overview
      const activeUserId = user?.id || user?._id || prof?.user;
      const targetRole = prof?.careerGoals?.targetRoles?.[0] || 'Frontend Developer';
      const [appsRes, portRes, readyRes] = await Promise.allSettled([
        studentApi.getMyApplications({ limit: 1 }),
        studentApi.getMyPortfolio(),
        activeUserId ? studentApi.getReadiness(activeUserId, { role: targetRole }) : Promise.reject()
      ]);

      setOverviewStats({
        applicationsCount: appsRes.status === 'fulfilled' ? (appsRes.value?.meta?.total || (Array.isArray(appsRes.value?.data) ? appsRes.value.data.length : 0)) : 0,
        portfolioCount: portRes.status === 'fulfilled' && Array.isArray(portRes.value?.data) ? portRes.value.data.length : 0,
        readinessScore: readyRes.status === 'fulfilled' ? Math.round(readyRes.value?.readiness ?? readyRes.value?.data?.readiness ?? 0) : null,
        loading: false
      });
    } catch {
      setOverviewStats(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    loadHeaderData();
  }, [loadHeaderData]);

  // Load notifications when dropdown opens
  const fetchNotificationList = async () => {
    setLoadingNotifications(true);
    try {
      const res = await studentApi.listNotifications({ limit: 15 });
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      fetchNotificationList();
    }
    setShowNotifications((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await studentApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await studentApi.markNotificationRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  const handleDeleteNotification = async (id, wasUnread) => {
    try {
      await studentApi.deleteNotification(id);
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const completeness = profileData?.completeness ?? profileData?.profileCompleteness ?? 0;

  const TABS = [
    { id: 'overview', label: 'Cockpit Overview' },
    { id: 'profile', label: 'Profile & Onboarding' },
    { id: 'readiness', label: 'Skill-Gap & Readiness' },
    { id: 'assessments', label: 'Skill Assessments' },
    { id: 'opportunities', label: 'Opportunity Marketplace' },
    { id: 'applications', label: 'My Applications' },
    { id: 'portfolio', label: 'Digital Portfolio' },
  ];

  return (
    <div style={styles.container}>
      {/* Student Identity Header */}
      <div className="card" style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div style={styles.userProfileRow}>
            <div style={styles.avatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={styles.nameRow}>
                <h2 style={styles.userName}>{user?.name || 'Student Portal'}</h2>
                <span className="badge badge-role" style={{ fontSize: '11px' }}>Student</span>
                {profileData?.department && (
                  <span className="badge" style={styles.deptBadge}>{profileData.department}</span>
                )}
              </div>
              <p style={styles.userMeta}>
                {user?.email} {profileData?.institution?.name ? `• ${profileData.institution.name}` : ''}
              </p>
            </div>
          </div>

          <div style={styles.headerRightActions}>
            <div style={styles.onboardingMeter}>
              <div style={styles.meterLabels}>
                <span>Profile Onboarding</span>
                <span style={styles.meterPct}>{completeness}%</span>
              </div>
              <div style={styles.meterTrack}>
                <div
                  style={{
                    ...styles.meterFill,
                    width: `${Math.min(100, Math.max(0, completeness))}%`,
                    backgroundColor: completeness >= 80 ? 'var(--color-primary)' : 'var(--color-steel-blue)'
                  }}
                />
              </div>
            </div>

            {/* Notification Popover Trigger */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                onClick={toggleNotifications}
                style={{
                  ...styles.notifBtn,
                  backgroundColor: showNotifications ? 'var(--color-mist-light)' : 'var(--color-bg-surface)',
                }}
                title="Notifications & Alerts"
                aria-label="Toggle notifications"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span style={styles.notifCountBadge}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Top-Right Dropdown Popover */}
              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: 'var(--font-size-xs)' }}>Notifications</strong>
                      {unreadCount > 0 && (
                        <span className="badge badge-burgundy" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={styles.textActionBtn}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        style={styles.closeBtn}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div style={styles.notifList}>
                    {loadingNotifications ? (
                      <p style={styles.notifEmpty}>Loading alerts...</p>
                    ) : notifications.length === 0 ? (
                      <p style={styles.notifEmpty}>
                        No notifications recorded.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            style={{
                              ...styles.notifItem,
                              backgroundColor: notif.isRead ? 'var(--color-bg-surface)' : 'var(--color-mist-light)',
                              borderColor: notif.isRead ? 'var(--color-border-subtle)' : 'var(--color-steel-blue)',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: notif.isRead ? '500' : '600',
                                color: 'var(--color-text-main)',
                                fontSize: 'var(--font-size-xs)',
                                marginBottom: '2px'
                              }}>
                                {notif.title}
                              </div>
                              <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', lineHeight: 1.4 }}>
                                {notif.message}
                              </div>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block', fontVariantNumeric: 'tabular-nums' }}>
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {!notif.isRead && (
                                <button
                                  onClick={() => handleMarkSingleRead(notif.id)}
                                  className="btn btn-ghost"
                                  style={{ padding: '2px 6px', fontSize: '11px' }}
                                  title="Mark as read"
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notif.id, !notif.isRead)}
                                className="btn btn-ghost"
                                style={{ padding: '2px 6px', fontSize: '12px' }}
                                title="Dismiss"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation (<640px) */}
        <div className="b2b-mobile-tab-nav" style={{ marginTop: 'var(--space-3)' }}>
          <label htmlFor="student-tab-select" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: '500' }}>
            Active Module:
          </label>
          <select
            id="student-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            style={styles.mobileSelect}
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Desktop / Tablet Segmented Tabs */}
        <div className="b2b-tab-bar" style={{ marginTop: 'var(--space-3)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`b2b-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Quick Metrics KPI Row */}
          <div className="b2b-kpi-grid">
            <div className="b2b-kpi-tile" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('readiness')}>
              <span className="b2b-kpi-label">Industry Readiness</span>
              <span className="b2b-kpi-value" style={{ color: overviewStats.readinessScore ? 'var(--color-primary)' : 'inherit' }}>
                {overviewStats.readinessScore !== null ? `${overviewStats.readinessScore}%` : '—'}
              </span>
              <span className="b2b-kpi-subtext">Target role alignment score</span>
            </div>

            <div className="b2b-kpi-tile" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('applications')}>
              <span className="b2b-kpi-label">Active Applications</span>
              <span className="b2b-kpi-value">{overviewStats.applicationsCount}</span>
              <span className="b2b-kpi-subtext">Submissions in progress</span>
            </div>

            <div className="b2b-kpi-tile" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('portfolio')}>
              <span className="b2b-kpi-label">Verified Portfolio Items</span>
              <span className="b2b-kpi-value">{overviewStats.portfolioCount}</span>
              <span className="b2b-kpi-subtext">Projects & certifications</span>
            </div>
          </div>

          {/* Quick Action Matrix / Roadmap */}
          <div className="card">
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', margin: 0 }}>Student Journey Roadmap</h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                Structured steps to calibrate readiness, validate skills, and secure placement matches.
              </p>
            </div>

            <div style={styles.roadmapGrid}>
              <div style={styles.roadmapCard}>
                <div style={styles.roadmapCardHead}>
                  <span style={styles.stepNum}>01</span>
                  <h4 style={styles.stepTitle}>Skill-Gap & Readiness</h4>
                </div>
                <p style={styles.stepDesc}>
                  Select your target career role, analyze verified strengths, and review missing competency gaps.
                </p>
                <button className="btn btn-ghost" style={styles.stepBtn} onClick={() => setActiveTab('readiness')}>
                  View Analysis →
                </button>
              </div>

              <div style={styles.roadmapCard}>
                <div style={styles.roadmapCardHead}>
                  <span style={styles.stepNum}>02</span>
                  <h4 style={styles.stepTitle}>Validate with Assessments</h4>
                </div>
                <p style={styles.stepDesc}>
                  Complete assigned institutional campaigns to certify skills and boost target role readiness.
                </p>
                <button className="btn btn-ghost" style={styles.stepBtn} onClick={() => setActiveTab('assessments')}>
                  Take Assessments →
                </button>
              </div>

              <div style={styles.roadmapCard}>
                <div style={styles.roadmapCardHead}>
                  <span style={styles.stepNum}>03</span>
                  <h4 style={styles.stepTitle}>Discover Opportunities</h4>
                </div>
                <p style={styles.stepDesc}>
                  Explore internships and jobs matched to your verified readiness and skill proficiencies.
                </p>
                <button className="btn btn-ghost" style={styles.stepBtn} onClick={() => setActiveTab('opportunities')}>
                  Browse Jobs →
                </button>
              </div>

              <div style={styles.roadmapCard}>
                <div style={styles.roadmapCardHead}>
                  <span style={styles.stepNum}>04</span>
                  <h4 style={styles.stepTitle}>Showcase in Portfolio</h4>
                </div>
                <p style={styles.stepDesc}>
                  Curate verified artifacts, generate structured AI resumes, and share your public profile card.
                </p>
                <button className="btn btn-ghost" style={styles.stepBtn} onClick={() => setActiveTab('portfolio')}>
                  View Portfolio →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && <StudentProfileView onProfileUpdated={loadHeaderData} />}
      {activeTab === 'readiness' && <SkillGapDashboardView studentId={user?.id || user?._id} />}
      {activeTab === 'assessments' && <AssessmentFlowView onNavigateTab={setActiveTab} />}
      {activeTab === 'opportunities' && <OpportunityMarketplaceView studentId={user?.id || user?._id} />}
      {activeTab === 'applications' && <ApplicationTrackerView />}
      {activeTab === 'portfolio' && <DigitalPortfolioView studentId={user?.id || user?._id} />}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '1280px', margin: '0 auto', width: '100%' },
  headerCard: { padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' },
  userProfileRow: { display: 'flex', gap: 'var(--space-3)', alignItems: 'center' },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: 'var(--radius-xs)',
    backgroundColor: 'var(--color-mist-light)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: 'var(--font-size-base)',
  },
  nameRow: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' },
  userName: { margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600' },
  deptBadge: { backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', fontSize: '11px' },
  userMeta: { margin: '2px 0 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  headerRightActions: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' },
  onboardingMeter: { minWidth: '140px' },
  meterLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' },
  meterPct: { fontWeight: '600', color: 'var(--color-text-main)', fontVariantNumeric: 'tabular-nums' },
  meterTrack: { height: '4px', backgroundColor: 'var(--color-mist-light)', borderRadius: '2px', overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s ease' },
  notifBtn: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    position: 'relative',
    transition: 'all var(--transition-fast)',
  },
  notifCountBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
    borderRadius: '999px',
    padding: '1px 5px',
    fontSize: '10px',
    fontWeight: '700',
    lineHeight: 1,
  },
  notifDropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    width: '340px',
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--color-border)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '420px',
    overflow: 'hidden',
  },
  notifHeader: {
    padding: 'var(--space-2) var(--space-3)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-mist-light)',
  },
  textActionBtn: { background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600', padding: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1 },
  notifList: { overflowY: 'auto', flex: 1, padding: 'var(--space-2)' },
  notifEmpty: { textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-4) var(--space-2)', margin: 0 },
  notifItem: {
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--space-2)',
  },
  mobileSelect: {
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-surface)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-main)',
  },
  roadmapGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' },
  roadmapCard: {
    padding: 'var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  roadmapCardHead: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  stepNum: {
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'monospace',
    color: 'var(--color-primary)',
    backgroundColor: 'var(--color-mist-light)',
    padding: '1px 5px',
    borderRadius: 'var(--radius-xs)',
  },
  stepTitle: { margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: '600' },
  stepDesc: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, flex: 1, lineHeight: 1.4 },
  stepBtn: { fontSize: 'var(--font-size-xs)', alignSelf: 'flex-start', padding: '4px 8px' },
};

export default StudentHome;
