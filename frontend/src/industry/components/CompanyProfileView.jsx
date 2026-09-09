import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

export const CompanyProfileView = ({ onProfileUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileId, setProfileId] = useState('');
  const [userId, setUserId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [completeness, setCompleteness] = useState(0);
  const [verifiedAt, setVerifiedAt] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    sector: '',
    location: '',
    website: '',
    size: '',
    description: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await industryApi.getMyProfile();
      const profile = res.profile || {};

      setProfileId(profile.id || profile._id || '');
      setUserId(profile.user || '');
      setVerificationStatus(profile.verificationStatus || 'unverified');
      setCompleteness(profile.completeness || 0);
      setVerifiedAt(profile.verifiedAt || null);

      setFormData({
        companyName: profile.companyName || '',
        sector: profile.sector || '',
        location: profile.location || '',
        website: profile.website || '',
        size: profile.size || '',
        description: profile.description || '',
        contactPerson: profile.contact?.person || '',
        contactEmail: profile.contact?.email || '',
        contactPhone: profile.contact?.phone || '',
      });
    } catch (err) {
      console.error('Failed to load company profile:', err);
      setError(err.message || 'Failed to fetch company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');

      const payload = {
        companyName: formData.companyName.trim(),
        sector: formData.sector.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        size: formData.size.trim() || undefined,
        description: formData.description.trim(),
        contact: {
          person: formData.contactPerson.trim(),
          email: formData.contactEmail.trim() || undefined,
          phone: formData.contactPhone.trim(),
        },
      };

      const targetId = userId || profileId;
      const updated = await industryApi.updateProfile(targetId, payload);

      setSuccessMsg('Company profile updated successfully!');
      if (updated) {
        setCompleteness(updated.completeness || completeness);
        setVerificationStatus(updated.verificationStatus || verificationStatus);
      }
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update company profile:', err);
      setError(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading enterprise credentials and verification record...</p>
      </div>
    );
  }

  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Verification & Identity Status Banner */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                {formData.companyName || 'Employer Organization Profile'}
              </h2>
              {/* READ-ONLY Verification Badge - No self-verify button */}
              <span
                style={{
                  background: isVerified ? '#065f46' : isPending ? '#854d0e' : isRejected ? '#7f1d1d' : '#334155',
                  color: isVerified ? '#34d399' : isPending ? '#fde047' : isRejected ? '#fca5a5' : '#cbd5e1',
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
                {isVerified
                  ? '🛡️ Verified Employer'
                  : isPending
                  ? '⏳ Verification Under Review'
                  : isRejected
                  ? '❌ Verification Rejected'
                  : '⚠️ Unverified Account'}
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Account Ref: <code style={{ color: '#38bdf8' }}>{profileId}</code>
              {verifiedAt && ` • Verified on ${new Date(verifiedAt).toLocaleDateString()}`}
              <span style={{ marginLeft: '0.75rem', color: '#64748b' }}>
                (Verification status is strictly managed by platform administrators)
              </span>
            </p>
          </div>

          {/* Completeness Meter */}
          <div style={{ minWidth: '220px', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem', color: '#94a3b8' }}>
              <span>Profile Completeness:</span>
              <strong style={{ color: completeness >= 80 ? '#34d399' : '#38bdf8' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? '#34d399' : '#38bdf8', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Company Profile Form */}
      <form onSubmit={handleSave} style={{ background: '#1e293b', padding: '1.75rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          🏢 Organization & Industry Attributes
        </h3>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '6px', color: '#a7f3d0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            ✓ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Company / Brand Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Industry Sector *</label>
            <input
              type="text"
              required
              placeholder="e.g. Software, Financial Services, AI/ML"
              value={formData.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Headquarters / Location</label>
            <input
              type="text"
              placeholder="e.g. Bangalore, India"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Website URL</label>
            <input
              type="url"
              placeholder="https://company.example"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Company Scale / Size</label>
            <input
              type="text"
              placeholder="e.g. 50-200 employees, Enterprise"
              value={formData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>About the Company</label>
            <textarea
              rows={4}
              placeholder="Brief description of the organization, core mission, and engineering culture..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>
        </div>

        <h3 style={{ margin: '2rem 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          👤 Primary Talent Acquisition Contact
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Contact Officer / Recruiter</label>
            <input
              type="text"
              placeholder="e.g. HR Team / Lead Recruiter"
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Hiring Contact Email</label>
            <input
              type="email"
              placeholder="careers@company.example"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Contact Phone</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 2rem',
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfileView;
