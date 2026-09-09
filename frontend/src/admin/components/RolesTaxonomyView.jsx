import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export function RolesTaxonomyView() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal & Edit State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form Inputs
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSkills, setFormSkills] = useState([]); // [{ name, level, required, weight }]

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listRoles({ q: searchQuery || undefined, page, limit: 15 });
      setRoles(res.roles);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openCreate = () => {
    setFormTitle('');
    setFormCategory('engineering');
    setFormDescription('');
    setFormSkills([{ name: '', level: 'intermediate', required: true, weight: 2 }]);
    setShowCreateModal(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setFormTitle(role.title);
    setFormCategory(role.category || '');
    setFormDescription(role.description || '');
    setFormSkills(
      role.mappedSkills?.length > 0
        ? role.mappedSkills.map((s) => ({
            name: s.name,
            level: s.level || 'intermediate',
            required: s.required !== false,
            weight: s.weight ?? 1,
          }))
        : [{ name: '', level: 'intermediate', required: true, weight: 2 }]
    );
  };

  const handleAddSkillRow = () => {
    setFormSkills((prev) => [...prev, { name: '', level: 'intermediate', required: true, weight: 1 }]);
  };

  const handleRemoveSkillRow = (index) => {
    setFormSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index, field, value) => {
    setFormSkills((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanedSkills = formSkills
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name.trim(),
          level: s.level,
          required: Boolean(s.required),
          weight: Number(s.weight) || 1,
        }));

      const payload = {
        title: formTitle.trim(),
        category: formCategory.trim(),
        description: formDescription.trim(),
        mappedSkills: cleanedSkills,
      };

      if (editingRole) {
        await adminApi.updateRole(editingRole.id, payload);
        setFeedback({ type: 'success', message: `Role "${payload.title}" updated successfully.` });
        setEditingRole(null);
      } else {
        await adminApi.createRole(payload);
        setFeedback({ type: 'success', message: `Role "${payload.title}" created.` });
        setShowCreateModal(false);
      }
      await fetchRoles();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await adminApi.deleteRole(deleteTarget.id);
      setFeedback({ type: 'success', message: `Role "${deleteTarget.title}" deleted.` });
      setDeleteTarget(null);
      await fetchRoles();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete role' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>Role Competency Models</h3>
          <p style={styles.description}>
            Industry archetype roles and weighted skill competency models that power gap analysis and matching.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={styles.actionBtn}>
          + New Role Model
        </button>
      </div>

      {feedback && (
        <div style={{ ...styles.feedbackBox, backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Search role title..."
          style={styles.searchInput}
        />
      </div>

      {/* States */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading role competency models...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchRoles} className="btn btn-primary">Try Again</button>
        </div>
      ) : roles.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>No role models found.</p>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {roles.map((role) => (
            <div key={role.id} className="card" style={styles.roleCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h4 style={{ color: 'var(--color-primary)' }}>{role.title}</h4>
                  <span className="badge badge-role" style={{ marginTop: 'var(--space-1)', textTransform: 'capitalize' }}>
                    {role.category || 'Standard'}
                  </span>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => openEdit(role)} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)' }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(role)} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                    Delete
                  </button>
                </div>
              </div>

              {role.description && <p style={styles.roleDesc}>{role.description}</p>}

              <div style={styles.skillsSection}>
                <div style={styles.skillsHeader}>
                  <span style={styles.sectionLabel}>Competency Model ({role.mappedSkills?.length || 0} skills):</span>
                </div>
                <div style={styles.skillsChipsWrap}>
                  {(role.mappedSkills || []).map((s, idx) => (
                    <div key={idx} style={styles.skillItem}>
                      <span style={{ fontWeight: '500' }}>{s.name}</span>
                      <span style={styles.skillMeta}>({s.level} • wt:{s.weight})</span>
                      {s.required && <span style={styles.reqBadge}>req</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingRole) && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCardLarge}>
            <h4>{editingRole ? 'Edit Role Competency Model' : 'Create Role Competency Model'}</h4>
            <form onSubmit={handleSave} style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={styles.formRow}>
                <div style={{ flex: 2 }}>
                  <label style={styles.modalLabel}>Role Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. AI Systems Engineer"
                    style={styles.modalInput}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. engineering, data"
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.modalLabel}>Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Primary objectives and domain scope of this role..."
                  style={{ ...styles.modalInput, minHeight: '50px', resize: 'vertical' }}
                />
              </div>

              {/* Mapped Skills Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label style={styles.modalLabel}>Mapped Required & Preferred Skills</label>
                  <button type="button" onClick={handleAddSkillRow} className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)' }}>
                    + Add Skill
                  </button>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {formSkills.map((s, idx) => (
                    <div key={idx} style={styles.skillRow}>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => handleSkillChange(idx, 'name', e.target.value)}
                        placeholder="Skill Name (e.g. React)"
                        style={{ ...styles.modalInput, flex: 2 }}
                        required
                      />
                      <select
                        value={s.level}
                        onChange={(e) => handleSkillChange(idx, 'level', e.target.value)}
                        style={{ ...styles.modalInput, flex: 1 }}
                      >
                        {PROFICIENCY_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={s.weight}
                        min="1"
                        max="10"
                        onChange={(e) => handleSkillChange(idx, 'weight', parseInt(e.target.value, 10) || 1)}
                        title="Weight (1-10)"
                        style={{ ...styles.modalInput, width: '60px' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-xs)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={s.required}
                          onChange={(e) => handleSkillChange(idx, 'required', e.target.checked)}
                        />
                        Req
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillRow(idx)}
                        style={{ color: 'var(--color-danger)', fontSize: '18px', cursor: 'pointer' }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingRole(null); }}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Role Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4>Delete Role Competency Model</h4>
            <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              Are you sure you want to delete role <strong>{deleteTarget.title}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--color-danger)' }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' },
  actionBtn: { fontSize: 'var(--font-size-xs)' },
  toolbar: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    maxWidth: '360px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  stateBox: {
    padding: 'var(--space-8)',
    textAlign: 'center',
    backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--color-border)',
    borderTopColor: 'var(--color-primary)',
    animation: 'spin 0.8s linear infinite',
  },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-3)' },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardActions: { display: 'flex', gap: '4px' },
  roleDesc: { fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', margin: 0 },
  skillsSection: { marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)' },
  skillsHeader: { marginBottom: '4px' },
  sectionLabel: { fontSize: '10px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  skillsChipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  skillItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: 'var(--radius-xs)',
    backgroundColor: 'var(--color-mist-light)',
    border: '1px solid var(--color-border)',
    fontSize: '10px',
  },
  skillMeta: { color: 'var(--color-text-muted)', fontSize: '10px' },
  reqBadge: { color: 'var(--color-burgundy-red)', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 24, 20, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--space-4)',
  },
  modalCard: {
    maxWidth: '440px',
    width: '100%',
    padding: 'var(--space-5)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--radius-md)',
  },
  modalCardLarge: {
    maxWidth: 'min(95vw, 620px)',
    width: '100%',
    padding: 'var(--space-5)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--radius-md)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '4px',
    color: 'var(--color-text-secondary)',
  },
  modalInput: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-surface)',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box',
    outline: 'none',
  },
  formRow: { display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' },
  skillRow: { display: 'flex', gap: 'var(--space-2)', alignItems: 'center' },
  feedbackBox: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-xs)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 'var(--font-size-xs)',
    border: '1px solid currentColor',
  },
  closeFeedback: {
    fontSize: '16px',
    cursor: 'pointer',
    color: 'inherit',
    border: 'none',
    background: 'none',
  },
};

export default RolesTaxonomyView;
