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
  { id: 'readiness', label: 'Readiness Cockpit', desc: 'Institutional KPIs and export reports' },
  { id: 'campaigns', label: 'Assessment Campaigns', desc: 'Manage assessment campaigns and monitoring' },
  { id: 'departments', label: 'Department Analytics', desc: 'Branch distribution and gap simulator' },
  { id: 'demand', label: 'Industry Demand', desc: 'Supply vs industry demand score alignment' },
  { id: 'placement', label: 'Placements & Funnel', desc: 'Hiring funnel and live opportunities' },
  { id: 'cohort', label: 'Student Cohort', desc: 'Student dossier and verified records lookup' },
  { id: 'profile', label: 'Profile Settings', desc: 'Institutional profile and verification details' }
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Institutional Header */}
      <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
                {profileData?.name || user?.name || 'Institution Portal'}
              </h1>
              <span className={`status-pill ${isVerified ? 'status-verified' : 'status-pending'}`}>
                <span className="status-pill-dot" />
                {isVerified ? 'Verified Institution' : 'Verification Pending'}
              </span>
              <span className="badge badge-sky" style={{ textTransform: 'uppercase' }}>
                Role: Institution
              </span>
            </div>

            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span>{user?.email}</span>
              {profileData?.location && <span>• {profileData.location}</span>}
              {profileData?.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-steel-blue)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {profileData.website.replace(/^https?:\/\//, '')} ↗
                </a>
              )}
            </div>

            {/* Department chips */}
            {profileData?.departments && profileData.departments.length > 0 && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Branches:</span>
                {profileData.departments.map((dept, i) => (
                  <span key={i} className="badge badge-sky" style={{ fontSize: '11px' }}>
                    {dept}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Completeness meter */}
          <div style={{
            backgroundColor: 'var(--color-bg-app)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            minWidth: '180px',
            flex: '0 1 200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              <span>Profile Status</span>
              <strong style={{ color: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-primary)' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, backgroundColor: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-primary)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation Dropdown */}
      <select
        className="b2b-mobile-tab-nav"
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        aria-label="Select institutional section"
      >
        {INSTITUTION_TABS.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>

      {/* Desktop Tab Bar */}
      <div className="b2b-tab-bar" role="tablist">
        {INSTITUTION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`b2b-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
