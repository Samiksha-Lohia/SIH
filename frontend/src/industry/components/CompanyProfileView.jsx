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
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading enterprise credentials and verification record...</p>
      </div>
    );
  }

  const isVerified = verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Verification & Identity Status Banner */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
                {formData.companyName || 'Employer Organization Profile'}
              </h2>
              {/* READ-ONLY Verification Badge */}
              <span className={`status-pill ${isVerified ? 'status-verified' : isPending ? 'status-pending' : isRejected ? 'status-rejected' : ''}`}>
                <span className="status-pill-dot" />
                {isVerified
                  ? 'Verified Employer'
                  : isPending
                  ? 'Verification Under Review'
                  : isRejected
                  ? 'Verification Rejected'
                  : 'Unverified Account'}
              </span>
            </div>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Account Ref: <code style={{ color: 'var(--color-steel-blue)' }}>{profileId}</code>
              {verifiedAt && ` • Verified on ${new Date(verifiedAt).toLocaleDateString()}`}
              <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                (Verification status is strictly managed by platform administrators)
              </span>
            </p>
          </div>

          {/* Completeness Meter */}
          <div style={{ minWidth: '200px', background: 'var(--color-bg-app)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              <span>Profile Completeness:</span>
              <strong style={{ color: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-steel-blue)' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-steel-blue)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Company Profile Form */}
      <form onSubmit={handleSave} className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          Organization & Industry Attributes
        </h3>

        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-app)', border: '1px solid var(--color-burgundy-red)', borderRadius: 'var(--radius-md)', color: 'var(--color-burgundy-red)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-app)', border: '1px solid var(--color-emerald)', borderRadius: 'var(--radius-md)', color: 'var(--color-emerald)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}>
            ✓ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Company / Brand Name *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Industry Sector *</label>
            <input
              type="text"
              required
              placeholder="e.g. Software, Financial Services, AI/ML"
              value={formData.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Headquarters / Location</label>
            <input
              type="text"
              placeholder="e.g. Bangalore, India"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Website URL</label>
            <input
              type="url"
              placeholder="https://company.example"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Company Scale / Size</label>
            <input
              type="text"
              placeholder="e.g. 50-200 employees, Enterprise"
              value={formData.size}
              onChange={(e) => handleChange('size', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>About the Company</label>
            <textarea
              rows={4}
              placeholder="Brief description of the organization, core mission, and engineering culture..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <h3 style={{ margin: 'var(--space-6) 0 var(--space-4)', fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          Primary Talent Acquisition Contact
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Contact Officer / Recruiter</label>
            <input
              type="text"
              placeholder="e.g. HR Team / Lead Recruiter"
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Hiring Contact Email</label>
            <input
              type="email"
              placeholder="careers@company.example"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Contact Phone</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfileView;
