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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                {formData.designation ? `${formData.designation} Dossier` : 'Faculty Profile Dossier'}
              </h2>
              <span
                style={{
                  backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                  color: 'var(--color-caramel, #B58863)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Academician
              </span>
              {formData.openToMentorship && (
                <span className="status-pill status-verified" style={{ fontSize: '0.75rem' }}>
                  <span className="status-pill-dot" />
                  Active Mentor
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Institution: <strong style={{ color: 'var(--text-main)' }}>{formData.institution || 'Configured Institute'}</strong> &middot; Experience: {formData.experienceYears} Years
            </p>
          </div>

          <div
            style={{
              minWidth: '220px',
              backgroundColor: 'var(--color-sand-light, #D3C3B9)',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-taupe-grey, #A79E9C)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <span>Dossier Completeness</span>
              <strong style={{ color: completeness >= 80 ? '#065f46' : 'var(--color-caramel, #B58863)' }}>{completeness}%</strong>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--color-taupe-grey, #A79E9C)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${completeness}%`,
                  backgroundColor: completeness >= 80 ? '#10b981' : 'var(--color-caramel, #B58863)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 600 }}>
            Academic Affiliation & Credentials
          </h3>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Institutional tenure, professional designations, and verified qualifications.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.8125rem',
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              color: '#065f46',
              fontSize: '0.8125rem',
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              Current Institution *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. National Institute of Technology"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              Academic Designation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Professor, Department Chair"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              Years of Professional Experience
            </label>
            <input
              type="number"
              min="0"
              max="70"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              Domain & Technical Expertise (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="Machine Learning, Distributed Systems, Cloud Architecture..."
              value={formData.expertiseStr}
              onChange={(e) => setFormData({ ...formData, expertiseStr: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Skills match student mentorship queries and collaborative research opportunities.
            </span>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              Academic Qualifications & Degrees (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="Ph.D. in Computer Science, M.Tech, B.Tech..."
              value={formData.qualificationsStr}
              onChange={(e) => setFormData({ ...formData, qualificationsStr: e.target.value })}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid var(--color-taupe-grey, #A79E9C)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Mentorship & Consultancy Availability Section */}
        <div style={{ borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 600 }}>
            Mentorship & Consultancy Availability
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Configure open channels for student guidance and industrial consulting engagements.
          </p>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.openToMentorship}
                onChange={(e) => setFormData({ ...formData, openToMentorship: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-caramel, #B58863)', cursor: 'pointer' }}
              />
              Open to Student & Peer Mentorship
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.openToConsultancy}
                onChange={(e) => setFormData({ ...formData, openToConsultancy: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-caramel, #B58863)', cursor: 'pointer' }}
              />
              Open to Industrial Technical Consultancy
            </label>
          </div>

          {/* Availability Schedule Slots Builder */}
          <div
            style={{
              backgroundColor: 'var(--color-sand-light, #D3C3B9)',
              padding: '1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--color-taupe-grey, #A79E9C)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Weekly Availability Time Slots</h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Define recurring availability when students and industry partners can book 1-on-1 sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={addSlot}
                className="btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                + Add Time Slot
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {formData.slots.map((slot, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    backgroundColor: 'var(--color-bg-surface)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-taupe-grey, #A79E9C)',
                  }}
                >
                  <select
                    value={slot.day}
                    onChange={(e) => handleSlotChange(sIdx, 'day', e.target.value)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      border: '1px solid var(--color-taupe-grey, #A79E9C)',
                      borderRadius: '4px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                    <input
                      type="time"
                      value={slot.from}
                      onChange={(e) => handleSlotChange(sIdx, 'from', e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        border: '1px solid var(--color-taupe-grey, #A79E9C)',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                    <input
                      type="time"
                      value={slot.to}
                      onChange={(e) => handleSlotChange(sIdx, 'to', e.target.value)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        border: '1px solid var(--color-taupe-grey, #A79E9C)',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSlot(sIdx)}
                    className="btn-ghost"
                    style={{
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      marginLeft: 'auto',
                      padding: '0.2rem 0.5rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {formData.slots.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                  No fixed schedule slots added. Add slots to appear in the SUTRA Mentor Directory.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Collaboration Preferences */}
        <div style={{ borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 600 }}>
            Industry & Institutional Collaboration Tracks
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Select collaboration modes matching your academic and consulting interests.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.75rem' }}>
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
                    backgroundColor: isChecked ? 'var(--color-sand-light, #D3C3B9)' : 'var(--color-bg-surface)',
                    border: `1px solid ${isChecked ? 'var(--color-caramel, #B58863)' : 'var(--color-taupe-grey, #A79E9C)'}`,
                    borderRadius: '6px',
                    color: isChecked ? 'var(--color-caramel, #B58863)' : 'var(--text-main)',
                    fontSize: '0.8125rem',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCollab(opt.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-caramel, #B58863)', cursor: 'pointer' }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '1.25rem' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '0.65rem 1.75rem', fontSize: '0.875rem' }}
          >
            {saving ? 'Saving...' : 'Save Academic Dossier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacultyProfileView;


