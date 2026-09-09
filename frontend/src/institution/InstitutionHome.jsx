import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { institutionApi } from './institution.api.js';

import { InstitutionReadinessView } from './components/InstitutionReadinessView.jsx';
import { DepartmentAnalyticsView } from './components/DepartmentAnalyticsView.jsx';
import { IndustryDemandComparisonView } from './components/IndustryDemandComparisonView.jsx';
import { PlacementFunnelView } from './components/PlacementFunnelView.jsx';
import { StudentCohortView } from './components/StudentCohortView.jsx';
import { AssessmentCampaignView } from './components/AssessmentCampaignView.jsx';
import { InstitutionProfileSettingsView } from './components/InstitutionProfileSettingsView.jsx';

const INSTITUTION_TABS = [
  { id: 'readiness', label: '📊 Readiness Cockpit', desc: 'Institutional KPIs & live export reports' },
  { id: 'campaigns', label: '🎯 Assessment Campaigns', desc: 'Create assessments & assign campaigns to students' },
  { id: 'departments', label: '🏛️ Department Analytics', desc: 'Branch distribution & gap simulator' },
  { id: 'demand', label: '⚖️ Industry Demand', desc: 'Supply vs industry demand score alignment' },
  { id: 'placement', label: '💼 Placements & Internships', desc: 'Hiring funnel & live opportunities' },
  { id: 'cohort', label: '🎓 Student Cohort', desc: 'Student dossier & verified records lookup' },
  { id: 'profile', label: '⚙️ Profile Settings', desc: 'Institutional profile & verification details' }
];

export function InstitutionHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('readiness');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await institutionApi.getMyProfile();
      setProfileData(res.profile || null);
    } catch (err) {
      console.warn('Could not load institution profile header:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const isVerified = profileData?.verificationStatus === 'verified';
  const completeness = profileData?.completeness || 0;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Institutional Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', color: '#f8fafc', fontWeight: 700 }}>
                {profileData?.name || user?.name || 'Institution Portal'}
              </h1>
              <span style={{
                background: isVerified ? '#065f46' : '#854d0e',
                color: isVerified ? '#34d399' : '#fde047',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                {isVerified ? '🛡️ Verified Institution' : '⏳ Pending Verification'}
              </span>
              <span style={{ background: '#334155', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                Role: INSTITUTION
              </span>
            </div>

            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>👤 {user?.email}</span>
              {profileData?.location && <span>📍 {profileData.location}</span>}
              {profileData?.website && (
                <a href={profileData.website} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                  🌐 {profileData.website.replace(/^https?:\/\//, '')} ↗
                </a>
              )}
            </p>

            {/* Department chips */}
            {profileData?.departments && profileData.departments.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Active Branches:</span>
                {profileData.departments.map((dept, i) => (
                  <span key={i} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    {dept}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Completeness meter */}
          <div style={{ background: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #334155', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              <span>Profile Status</span>
              <strong style={{ color: completeness >= 80 ? '#34d399' : '#38bdf8' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? '#34d399' : '#38bdf8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Pills */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid #334155'
      }}>
        {INSTITUTION_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#38bdf8' : '#1e293b',
                color: isActive ? '#0f172a' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title={tab.desc}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Screen Content */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'readiness' && <InstitutionReadinessView />}
        {activeTab === 'campaigns' && <AssessmentCampaignView />}
        {activeTab === 'departments' && <DepartmentAnalyticsView />}
        {activeTab === 'demand' && <IndustryDemandComparisonView />}
        {activeTab === 'placement' && <PlacementFunnelView />}
        {activeTab === 'cohort' && <StudentCohortView />}
        {activeTab === 'profile' && (
          <InstitutionProfileSettingsView onProfileUpdated={(up) => setProfileData(up)} />
        )}
      </div>
    </div>
  );
}

export default InstitutionHome;
