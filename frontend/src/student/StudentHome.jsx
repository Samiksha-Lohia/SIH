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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* Student Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#f8fafc', border: '1px solid #334155', position: 'relative' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.4rem' }}>{user?.name || 'Student Portal'}</h2>
                <span className="badge" style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem' }}>Student</span>
                {profileData?.department && (
                  <span className="badge" style={{ backgroundColor: '#334155', color: '#94a3b8', fontSize: '0.75rem' }}>{profileData.department}</span>
                )}
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 'var(--font-size-sm)' }}>
                {user?.email} {profileData?.institution?.name ? `• ${profileData.institution.name}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ textAlign: 'right', minWidth: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Profile Onboarding</span>
                <span style={{ fontWeight: 600, color: completeness >= 80 ? '#4ade80' : '#38bdf8' }}>{completeness}%</span>
              </div>
              <div style={{ height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, completeness))}%`, background: completeness >= 80 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Exclusive Top-Right Bell Icon Container */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                onClick={toggleNotifications}
                style={{
                  background: showNotifications ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid #475569',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#f8fafc',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
                title="Notifications & Alerts"
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '999px',
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      boxShadow: '0 0 0 2px #0f172a',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Top-Right Dropdown Popover */}
              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: '52px',
                    right: 0,
                    width: '380px',
                    maxWidth: '92vw',
                    backgroundColor: 'var(--color-bg-surface, #ffffff)',
                    color: 'var(--color-text, #0f172a)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '480px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-mist-light, #f8fafc)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>Notifications</strong>
                      {unreadCount > 0 && (
                        <span className="badge" style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', padding: '1px 6px' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Content */}
                  <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px' }}>
                    {loadingNotifications ? (
                      <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '16px' }}>Loading alerts...</p>
                    ) : notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '24px 8px' }}>
                        No notifications right now.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            style={{
                              padding: '10px',
                              borderRadius: '8px',
                              backgroundColor: notif.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.08)',
                              border: notif.isRead ? '1px solid #f1f5f9' : '1px solid #bae6fd',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '8px',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: notif.isRead ? 500 : 700, color: notif.isRead ? '#334155' : '#0369a1', marginBottom: '2px' }}>
                                {notif.title}
                              </div>
                              <div style={{ color: '#64748b', lineHeight: 1.4 }}>
                                {notif.message}
                              </div>
                              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {!notif.isRead && (
                                <button
                                  onClick={() => handleMarkSingleRead(notif.id)}
                                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer' }}
                                  title="Mark as read"
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(notif.id, !notif.isRead)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', cursor: 'pointer' }}
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

        {/* Navigation Tabs Bar (Notifications removed from tabs) */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)', borderTop: '1px solid #334155', paddingTop: 'var(--space-3)', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: '📊 Cockpit Overview' },
            { id: 'profile', label: '👤 Profile & Onboarding' },
            { id: 'readiness', label: '🎯 Skill-Gap & Readiness' },
            { id: 'assessments', label: '📝 Skill Assessments' },
            { id: 'opportunities', label: '💼 Opportunity Marketplace' },
            { id: 'applications', label: '📄 My Applications' },
            { id: 'portfolio', label: '🏆 Digital Portfolio' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Quick Metrics (Profile view card removed) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Industry Readiness
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: overviewStats.readinessScore ? '#0284c7' : 'var(--color-text-secondary)' }}>
                {overviewStats.readinessScore !== null ? `${overviewStats.readinessScore}%` : 'N/A'}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Target role alignment and verified competencies
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem' }} onClick={() => setActiveTab('readiness')}>
                Analyze Skill Gaps →
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Applications
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {overviewStats.applicationsCount}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Submissions tracked across hiring stages
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem' }} onClick={() => setActiveTab('applications')}>
                Track Status →
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Verified Portfolio
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {overviewStats.portfolioCount} Items
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Projects, certifications and publications
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem' }} onClick={() => setActiveTab('portfolio')}>
                Manage Artifacts →
              </button>
            </div>
          </div>

          {/* Quick Action Matrix */}
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Student Journey Roadmap</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)' }}>
                <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>1.</span> Skill-Gap & Readiness
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  Select your target career role, analyze strengths, and identify missing competency gaps.
                </p>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('readiness')}>
                  View Analysis
                </button>
              </div>

              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)' }}>
                <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>2.</span> Validate with Assessments
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  Complete assigned institutional campaigns to certify skills and boost target role readiness.
                </p>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('assessments')}>
                  Take Assessments
                </button>
              </div>

              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)' }}>
                <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>3.</span> Discover Opportunities
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  Explore internships and jobs matched to your verified readiness and skill proficiencies.
                </p>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('opportunities')}>
                  Browse Jobs
                </button>
              </div>

              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)' }}>
                <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>4.</span> Showcase in Portfolio
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  Curate verified artifacts, generate AI resumes, and share your public credential card.
                </p>
                <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setActiveTab('portfolio')}>
                  View Portfolio
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

export default StudentHome;
