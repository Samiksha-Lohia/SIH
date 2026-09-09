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
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading institution identity and registration data...</p>
      </div>
    );
  }

  const isVerified = verificationStatus === 'verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Verification & Completeness Header Card */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                {formData.name || 'Educational Institution Profile'}
              </h2>
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
                {isVerified ? '🛡️ Verified Institution' : '⏳ Verification Pending'}
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Institutional Account ID: <code style={{ color: '#38bdf8' }}>{profileId}</code>
              {verifiedAt && ` • Verified on: ${new Date(verifiedAt).toLocaleDateString()}`}
            </p>
          </div>

          {/* Completeness Bar */}
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

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} style={{ background: '#1e293b', padding: '1.75rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          🏛️ Institutional Details & Departments
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Institution Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Campus Location / City</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g. Bangalore, Karnataka"
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Official Website URL</label>
            <input
              type="url"
              value={formData.website}
              onChange={e => handleChange('website', e.target.value)}
              placeholder="https://www.institute.edu"
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Full Postal Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Main Campus Road..."
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Academic Departments (Comma-separated)
            </label>
            <input
              type="text"
              value={formData.departmentsStr}
              onChange={e => handleChange('departmentsStr', e.target.value)}
              placeholder="Computer Science, Information Science, Electronics, Mechanical..."
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              These departments populate the institution's skill analytics and branch breakdown graphs.
            </span>
          </div>
        </div>

        <h3 style={{ margin: '2rem 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          👤 Primary Contact Officer
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Contact Officer Name</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={e => handleChange('contactPerson', e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar (Dean / TPO)"
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Contact Email</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={e => handleChange('contactEmail', e.target.value)}
              placeholder="tpo@institute.edu"
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Contact Phone</label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={e => handleChange('contactPhone', e.target.value)}
              placeholder="+91 9876543210"
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
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving to Database...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
