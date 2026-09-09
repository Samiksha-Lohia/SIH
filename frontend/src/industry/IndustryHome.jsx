import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { industryApi } from './industry.api.js';

import { RecruiterCockpitView } from './components/RecruiterCockpitView.jsx';
import { OpportunityManagementView } from './components/OpportunityManagementView.jsx';
import { CandidateRecommendationsView } from './components/CandidateRecommendationsView.jsx';
import { ApplicantReviewView } from './components/ApplicantReviewView.jsx';
import { CompanyProfileView } from './components/CompanyProfileView.jsx';

const INDUSTRY_TABS = [
  { id: 'cockpit', label: 'Recruiter Cockpit', desc: 'Recruitment pipeline & hiring analytics' },
  { id: 'opportunities', label: 'Opportunities Manager', desc: 'Job & internship postings and skill requirements' },
  { id: 'candidates', label: 'Candidate Match Feed', desc: 'Candidate recommendations & score breakdown' },
  { id: 'applicants', label: 'Applicant Review', desc: 'Review applicants, stages & recruiter notes' },
  { id: 'profile', label: 'Company Profile', desc: 'Enterprise profile & verification status' },
];

export function IndustryHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await industryApi.getMyProfile();
      setProfileData(res.profile || null);
    } catch (err) {
      console.warn('Could not load company profile header:', err);
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
      {/* Top Enterprise Header Card */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', fontWeight: 700 }}>
                {profileData?.companyName || user?.name || 'Industry & Recruiter Portal'}
              </h1>
              <span className={`status-pill ${isVerified ? 'status-verified' : 'status-pending'}`}>
                <span className="status-pill-dot" />
                {isVerified ? 'Verified Employer' : 'Verification Pending'}
              </span>
              <span className="badge badge-subtle" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                Role: Industry
              </span>
            </div>

            <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span>{user?.email}</span>
              {profileData?.sector && (
                <span>Sector: <strong style={{ color: 'var(--color-text)' }}>{profileData.sector}</strong></span>
              )}
              {profileData?.location && <span>{profileData.location}</span>}
              {profileData?.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-steel-blue)', textDecoration: 'none' }}
                >
                  {profileData.website.replace(/^https?:\/\//, '')} ↗
                </a>
              )}
            </p>
          </div>

          {/* Profile Completeness Meter */}
          <div
            style={{
              background: 'var(--color-bg-app)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              minWidth: '180px',
              flex: '1 1 200px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              <span>Profile Completeness</span>
              <strong style={{ color: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-steel-blue)' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completeness}%`,
                  background: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-steel-blue)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar with Mobile Fallback */}
      <div>
        <div className="b2b-tab-bar">
          {INDUSTRY_TABS.map((tab) => {
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
            {INDUSTRY_TABS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Screen Content */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'cockpit' && <RecruiterCockpitView />}
        {activeTab === 'opportunities' && <OpportunityManagementView isCompanyVerified={isVerified} />}
        {activeTab === 'candidates' && <CandidateRecommendationsView />}
        {activeTab === 'applicants' && <ApplicantReviewView />}
        {activeTab === 'profile' && (
          <CompanyProfileView onProfileUpdated={(up) => setProfileData(up)} />
        )}
      </div>
    </div>
  );
}

export default IndustryHome;
