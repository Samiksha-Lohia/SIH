import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { facultyApi } from './faculty.api.js';

import FacultyCockpitView from './components/FacultyCockpitView.jsx';
import AcademicOpportunitiesView from './components/AcademicOpportunitiesView.jsx';
import MentorDiscoveryView from './components/MentorDiscoveryView.jsx';
import ResearchCollaborationView from './components/ResearchCollaborationView.jsx';
import FacultyProfileView from './components/FacultyProfileView.jsx';

const TABS = [
  { id: 'cockpit', label: 'Engagements & Cockpit', desc: 'Track mentorships, FDP completions & active sessions' },
  { id: 'opportunities', label: 'Academic Opportunities', desc: 'Faculty internships, industrial training, FDPs & consultancy' },
  { id: 'mentorship', label: 'Mentorship Hub', desc: 'Discover industry leaders and establish mentoring connections' },
  { id: 'research', label: 'Research & Capstones', desc: 'Collaborative research proposals & live industry projects' },
  { id: 'profile', label: 'Faculty Dossier', desc: 'Profile, expertise tags, availability slots & collaboration settings' },
];

export function FacultyHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await facultyApi.getMyProfile();
      setProfileData(res.profile || {});
    } catch (err) {
      console.error('Failed to fetch faculty profile header data:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdated = (updatedProfile) => {
    setProfileData(updatedProfile);
  };

  const availabilityCount = (profileData?.availabilitySlots || []).length;

  return (
    <div className="faculty-portal-root" style={{ maxWidth: '1440px', margin: '0 auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Faculty Header Card */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                {profileData?.title ? `${profileData.title} ` : ''}
                {profileData?.name || user?.name || 'Faculty Member'}
              </h1>
              <span className="status-pill status-verified">
                <span className="status-pill-dot" />
                Verified Academician
              </span>
              {availabilityCount > 0 ? (
                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  {availabilityCount} Mentorship Slot{availabilityCount > 1 ? 's' : ''} Active
                </span>
              ) : (
                <span className="badge badge-subtle" style={{ fontSize: '11px' }}>
                  No Active Slots
                </span>
              )}
            </div>
            <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              <span>{profileData?.designation || 'Academician'}</span>
              {profileData?.department && <span> • {profileData.department}</span>}
              {profileData?.institution && (
                <span style={{ color: 'var(--color-text)' }}> • {profileData.institution}</span>
              )}
            </p>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('profile')}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Manage Dossier & Slots
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Explore Calls
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar with Mobile Fallback */}
      <div>
        <div className="b2b-tab-bar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`b2b-tab ${isActive ? 'active' : ''}`}
                title={tab.desc}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="b2b-mobile-tab-nav">
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Active View:</label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Content */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'cockpit' && (
          <FacultyCockpitView
            facultyUser={user}
            onNavigateTab={(tabKey) => setActiveTab(tabKey)}
          />
        )}

        {activeTab === 'opportunities' && (
          <AcademicOpportunitiesView
            onViewDetail={(opp) => {}}
          />
        )}

        {activeTab === 'mentorship' && (
          <MentorDiscoveryView
            facultyUser={user}
          />
        )}

        {activeTab === 'research' && (
          <ResearchCollaborationView
            facultyUser={user}
          />
        )}

        {activeTab === 'profile' && (
          <FacultyProfileView
            onProfileUpdated={handleProfileUpdated}
          />
        )}
      </div>
    </div>
  );
}

export default FacultyHome;
