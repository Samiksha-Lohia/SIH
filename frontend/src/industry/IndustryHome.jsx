import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { industryApi } from './industry.api.js';

import { RecruiterCockpitView } from './components/RecruiterCockpitView.jsx';
import { OpportunityManagementView } from './components/OpportunityManagementView.jsx';
import { CandidateRecommendationsView } from './components/CandidateRecommendationsView.jsx';
import { ApplicantReviewView } from './components/ApplicantReviewView.jsx';
import { CompanyProfileView } from './components/CompanyProfileView.jsx';

const INDUSTRY_TABS = [
  { id: 'cockpit', label: '📊 Recruiter Cockpit', desc: 'Recruitment pipeline & hiring analytics' },
  { id: 'opportunities', label: '💼 Opportunities Manager', desc: 'Job/internship postings & skill requirements' },
  { id: 'candidates', label: '🎯 Candidate Match Feed', desc: 'AI candidate recommendations & score breakdown' },
  { id: 'applicants', label: '👥 Applicant Review', desc: 'Review applicants, update stages & recruiter notes' },
  { id: 'profile', label: '🏢 Company Profile', desc: 'Enterprise profile & verification status' },
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Enterprise Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', color: '#f8fafc', fontWeight: 700 }}>
                {profileData?.companyName || user?.name || 'Industry & Recruiter Portal'}
              </h1>
              <span
                style={{
                  background: isVerified ? '#065f46' : '#854d0e',
                  color: isVerified ? '#34d399' : '#fde047',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {isVerified ? '🛡️ Verified Employer' : '⏳ Verification Pending'}
              </span>
              <span style={{ background: '#334155', color: '#94a3b8', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                Role: INDUSTRY
              </span>
            </div>

            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>👤 {user?.email}</span>
              {profileData?.sector && <span>💼 Sector: <strong style={{ color: '#cbd5e1' }}>{profileData.sector}</strong></span>}
              {profileData?.location && <span>📍 {profileData.location}</span>}
              {profileData?.website && (
                <a href={profileData.website} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                  🌐 {profileData.website.replace(/^https?:\/\//, '')} ↗
                </a>
              )}
            </p>
          </div>

          {/* Profile Completeness Meter */}
          <div style={{ background: '#0f172a', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid #334155', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              <span>Profile Completeness</span>
              <strong style={{ color: completeness >= 80 ? '#34d399' : '#38bdf8' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? '#34d399' : '#38bdf8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Pills */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          borderBottom: '1px solid #334155',
        }}
      >
        {INDUSTRY_TABS.map((tab) => {
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
                transition: 'all 0.15s ease',
              }}
              title={tab.desc}
            >
              {tab.label}
            </button>
          );
        })}
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
