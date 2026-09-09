import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { facultyApi } from './faculty.api.js';

import FacultyCockpitView from './components/FacultyCockpitView.jsx';
import AcademicOpportunitiesView from './components/AcademicOpportunitiesView.jsx';
import MentorDiscoveryView from './components/MentorDiscoveryView.jsx';
import ResearchCollaborationView from './components/ResearchCollaborationView.jsx';
import FacultyProfileView from './components/FacultyProfileView.jsx';

const TABS = [
  { id: 'cockpit', label: '📊 Engagements & Cockpit', desc: 'Track mentorships, FDP completions & active sessions' },
  { id: 'opportunities', label: '🏛️ Academic Opportunities', desc: 'Faculty internships, industrial training, FDPs & consultancy' },
  { id: 'mentorship', label: '🤝 Mentorship Hub', desc: 'Discover industry leaders and establish mentoring connections' },
  { id: 'research', label: '🔬 Research & Capstones', desc: 'Collaborative research proposals & live industry projects' },
  { id: 'profile', label: '👤 Faculty Dossier', desc: 'Profile, expertise tags, availability slots & collaboration settings' },
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

  // Compute completeness and badges
  const availabilityCount = (profileData?.availabilitySlots || []).length;
  const isAvailableForMentorship = profileData?.collaborationPreferences?.mentorship !== false;
  const hasExpertise = (profileData?.expertise || []).length > 0;

  return (
    <div className="faculty-portal-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Faculty Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #1e293b 100%)',
          borderRadius: '16px',
          border: '1px solid #312e81',
          padding: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {profileData?.title ? `${profileData.title} ` : ''}
                  {profileData?.name || user?.name || 'Faculty Member'}
                </h1>
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Verified Academician
                </span>
                {availabilityCount > 0 ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    ● {availabilityCount} Mentorship Slot{availabilityCount > 1 ? 's' : ''} Active
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.2)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    No Active Slots
                  </span>
                )}
              </div>
              <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <span>{profileData?.designation || 'Academician'}</span>
                {profileData?.department && <span> • {profileData.department}</span>}
                {profileData?.institution && (
                  <span style={{ color: '#cbd5e1' }}> • {profileData.institution}</span>
                )}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              ⚙️ Manage Dossier & Slots
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.15rem',
                backgroundColor: '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
              }}
            >
              Explore Calls 🚀
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #1f2937',
          paddingBottom: '0.25rem',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.65rem 1rem',
                backgroundColor: isActive ? '#1f2937' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #6366f1' : '3px solid transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                color: isActive ? '#ffffff' : '#9ca3af',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
              <span style={{ fontSize: '0.7rem', color: isActive ? '#94a3b8' : '#64748b' }}>
                {tab.desc.slice(0, 32)}...
              </span>
            </button>
          );
        })}
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
