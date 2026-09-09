import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { facultyApi } from '../faculty.api.js';

const COLLAB_OPTIONS = [
  { id: 'research', label: 'Joint Research & Publication' },
  { id: 'guest_lecture', label: 'Industry Guest Lectures' },
  { id: 'fdp', label: 'Faculty Development Programs (FDP)' },
  { id: 'consultancy', label: 'Industrial Technical Consultancy' },
  { id: 'industrial_training', label: 'Faculty Industrial Immersion / Training' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const FacultyProfileView = ({ onProfileUpdated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileId, setProfileId] = useState('');
  const [userId, setUserId] = useState('');
  const [completeness, setCompleteness] = useState(0);

  const [formData, setFormData] = useState({
    institution: '',
    designation: '',
    qualificationsStr: '',
    experienceYears: 0,
    expertiseStr: '',
    interestsStr: '',
    openToMentorship: false,
    openToConsultancy: false,
    slots: [],
    collaborationPreferences: [],
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await facultyApi.getMyProfile();
      const profile = res.profile || {};

      setProfileId(profile.id || profile._id || '');
      setUserId(profile.user || '');
      setCompleteness(profile.completeness || 0);

      setFormData({
        institution: profile.institution || '',
        designation: profile.designation || '',
        qualificationsStr: Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : '',
        experienceYears: profile.experienceYears || 0,
        expertiseStr: Array.isArray(profile.expertise) ? profile.expertise.join(', ') : '',
        interestsStr: Array.isArray(profile.interests) ? profile.interests.join(', ') : '',
        openToMentorship: profile.availability?.openToMentorship || false,
        openToConsultancy: profile.availability?.openToConsultancy || false,
        slots: Array.isArray(profile.availability?.slots) ? profile.availability.slots : [],
        collaborationPreferences: Array.isArray(profile.collaborationPreferences) ? profile.collaborationPreferences : [],
      });
    } catch (err) {
      console.error('Failed to load faculty profile:', err);
      setError(err.message || 'Failed to fetch academic profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSlotChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.slots];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, slots: updated };
    });
  };

  const addSlot = () => {
    setFormData((prev) => ({
      ...prev,
      slots: [...prev.slots, { day: 'Monday', from: '16:00', to: '17:00' }],
    }));
  };

  const removeSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const toggleCollab = (id) => {
    setFormData((prev) => {
      const list = prev.collaborationPreferences;
      const updated = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
      return { ...prev, collaborationPreferences: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');

      const expertise = formData.expertiseStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const qualifications = formData.qualificationsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const interests = formData.interestsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        institution: formData.institution.trim(),
        designation: formData.designation.trim(),
        experienceYears: Number(formData.experienceYears) || 0,
        expertise,
        qualifications,
        interests,
        availability: {
          openToMentorship: formData.openToMentorship,
          openToConsultancy: formData.openToConsultancy,
          slots: formData.slots,
        },
        collaborationPreferences: formData.collaborationPreferences,
      };

      const targetId = userId || user?.id || profileId;
      const updated = await facultyApi.updateProfile(targetId, payload);

      setSuccessMsg('Faculty profile and availability updated successfully!');
      if (updated) {
        setCompleteness(updated.completeness || completeness);
      }
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update faculty profile:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading academic profile and mentorship schedules...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Card */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc' }}>
                {formData.designation ? `${formData.designation} Profile` : 'Faculty Profile'}
              </h2>
              <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Academician
              </span>
              {formData.openToMentorship && (
                <span style={{ background: '#065f46', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  🤝 Active Mentor
                </span>
              )}
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Institution: <strong style={{ color: '#cbd5e1' }}>{formData.institution || 'Demo Institute'}</strong> • Experience: {formData.experienceYears} Years
            </p>
          </div>

          <div style={{ minWidth: '200px', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              <span>Profile Completeness:</span>
              <strong style={{ color: completeness >= 80 ? '#34d399' : '#38bdf8' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completeness}%`, background: completeness >= 80 ? '#34d399' : '#38bdf8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} style={{ background: '#1e293b', padding: '1.75rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          🎓 Academic Details & Affiliation
        </h3>

        {error && (
          <div style={{ padding: '0.75rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.75rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '6px', color: '#a7f3d0', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            ✓ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Current Institution *</label>
            <input
              type="text"
              required
              placeholder="e.g. Demo Institute / National University"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Academic Designation *</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Professor, Professor, Dean"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Years of Experience</label>
            <input
              type="number"
              min="0"
              max="70"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Domain & Technical Expertise (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="Machine Learning, Data Structures, Distributed Systems, Cloud Architecture..."
              value={formData.expertiseStr}
              onChange={(e) => setFormData({ ...formData, expertiseStr: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              These skills match student mentorship requests and collaborative research proposals.
            </span>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Academic Qualifications & Degrees (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="Ph.D. in Computer Science, M.Tech, B.Tech..."
              value={formData.qualificationsStr}
              onChange={(e) => setFormData({ ...formData, qualificationsStr: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {/* Mentorship & Consultancy Availability Section */}
        <h3 style={{ margin: '2rem 0 1.25rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          🤝 Mentorship & Consultancy Availability
        </h3>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.openToMentorship}
              onChange={(e) => setFormData({ ...formData, openToMentorship: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            Open to Student & Peer Mentorship
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.openToConsultancy}
              onChange={(e) => setFormData({ ...formData, openToConsultancy: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            Open to Industrial Technical Consultancy
          </label>
        </div>

        {/* Availability Schedule Slots Builder */}
        <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc' }}>Weekly Availability Schedule Slots</h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Define weekly hours when students and industry peers can request 1-on-1 sessions.</p>
            </div>
            <button
              type="button"
              onClick={addSlot}
              style={{ padding: '0.35rem 0.75rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              + Add Time Slot
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {formData.slots.map((slot, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={slot.day}
                  onChange={(e) => handleSlotChange(sIdx, 'day', e.target.value)}
                  style={{ padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>From:</span>
                  <input
                    type="time"
                    value={slot.from}
                    onChange={(e) => handleSlotChange(sIdx, 'from', e.target.value)}
                    style={{ padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>To:</span>
                  <input
                    type="time"
                    value={slot.to}
                    onChange={(e) => handleSlotChange(sIdx, 'to', e.target.value)}
                    style={{ padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeSlot(sIdx)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer', marginLeft: 'auto' }}
                >
                  ✕
                </button>
              </div>
            ))}

            {formData.slots.length === 0 && (
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No fixed schedule slots added. Add slots to appear in the SUTRA Mentor Directory.
              </span>
            )}
          </div>
        </div>

        {/* Collaboration Preferences */}
        <h3 style={{ margin: '2rem 0 1rem', fontSize: '1.15rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          🔬 Industry & Institutional Collaboration Preferences
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          {COLLAB_OPTIONS.map((opt) => {
            const isChecked = formData.collaborationPreferences.includes(opt.id);
            return (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem',
                  background: isChecked ? '#1e1b4b' : '#0f172a',
                  border: `1px solid ${isChecked ? '#6366f1' : '#334155'}`,
                  borderRadius: '6px',
                  color: isChecked ? '#e0e7ff' : '#cbd5e1',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCollab(opt.id)}
                  style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 2rem',
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Academic Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacultyProfileView;
