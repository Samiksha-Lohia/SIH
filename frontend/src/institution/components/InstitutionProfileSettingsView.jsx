import React, { useState, useEffect } from 'react';
import { institutionApi } from '../institution.api';

export const InstitutionProfileSettingsView = ({ onProfileUpdated }) => {
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
    name: '',
    departmentsStr: '',
    address: '',
    location: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await institutionApi.getMyProfile();
      const profile = res.profile || {};
      
      setProfileId(profile._id || profile.id || '');
      setUserId(profile.user || '');
      setVerificationStatus(profile.verificationStatus || 'unverified');
      setCompleteness(profile.completeness || 0);
      setVerifiedAt(profile.verifiedAt || null);

      setFormData({
        name: profile.name || '',
        departmentsStr: Array.isArray(profile.departments) ? profile.departments.join(', ') : '',
        address: profile.address || '',
        location: profile.location || '',
        website: profile.website || '',
        contactPerson: profile.contact?.person || '',
        contactEmail: profile.contact?.email || '',
        contactPhone: profile.contact?.phone || ''
      });
    } catch (err) {
      console.error('Failed to load institution profile:', err);
      setError(err.message || 'Failed to fetch institution profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');

      const departments = formData.departmentsStr
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        departments,
        address: formData.address.trim(),
        location: formData.location.trim(),
        website: formData.website.trim(),
        contact: {
          person: formData.contactPerson.trim(),
          email: formData.contactEmail.trim() || undefined,
          phone: formData.contactPhone.trim()
        }
      };

      // Target user ID for PUT /api/institutions/:id
      const targetId = userId || profileId;
      const updated = await institutionApi.updateProfile(targetId, payload);
      
      setSuccessMsg('Institution profile updated successfully!');
      if (updated) {
        setCompleteness(updated.completeness || completeness);
        setVerificationStatus(updated.verificationStatus || verificationStatus);
      }
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to save changes to backend');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading institution identity and registration data...</p>
      </div>
    );
  }

  const isVerified = verificationStatus === 'verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Verification & Completeness Header Card */}
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', fontWeight: 700 }}>
                {formData.name || 'Educational Institution Profile'}
              </h2>
              <span className={`status-pill ${isVerified ? 'status-verified' : 'status-pending'}`}>
                <span className="status-pill-dot" />
                {isVerified ? 'Verified Institution' : 'Verification Pending'}
              </span>
            </div>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Institutional Account ID: <code style={{ color: 'var(--color-steel-blue)' }}>{profileId}</code>
              {verifiedAt && ` • Verified on: ${new Date(verifiedAt).toLocaleDateString()}`}
            </p>
          </div>

          {/* Completeness Bar */}
          <div style={{
            minWidth: '220px',
            backgroundColor: 'var(--color-bg-app)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
              <span>Profile Completeness:</span>
              <strong style={{ color: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-primary)' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, backgroundColor: completeness >= 80 ? 'var(--color-emerald)' : 'var(--color-primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          Institutional Details & Departments
        </h3>

        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
            ✓ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Institution Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Campus Location / City</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g. Bangalore, Karnataka"
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Official Website URL</label>
            <input
              type="url"
              value={formData.website}
              onChange={e => handleChange('website', e.target.value)}
              placeholder="https://www.institute.edu"
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Full Postal Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Main Campus Road..."
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>
              Academic Departments (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.departmentsStr}
              onChange={e => handleChange('departmentsStr', e.target.value)}
              placeholder="Computer Science, Information Science, Electronics, Mechanical..."
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              These departments populate the institution's skill analytics and branch breakdown graphs.
            </span>
          </div>
        </div>

        <h3 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
          Primary Contact Officer
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Contact Officer Name</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={e => handleChange('contactPerson', e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar (Dean / TPO)"
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Contact Email</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={e => handleChange('contactEmail', e.target.value)}
              placeholder="tpo@institute.edu"
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Contact Phone</label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={e => handleChange('contactPhone', e.target.value)}
              placeholder="+91 9876543210"
              style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)', padding: '8px 24px' }}
          >
            {saving ? 'Saving to Database...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
