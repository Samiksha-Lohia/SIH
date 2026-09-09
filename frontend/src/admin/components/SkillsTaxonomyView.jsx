import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

const CATEGORIES = ['technical', 'domain', 'tools', 'soft', 'communication', 'leadership'];

export function SkillsTaxonomyView() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('technical');
  const [formAliases, setFormAliases] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.listSkills({
        category: categoryFilter || undefined,
        q: searchQuery || undefined,
        page,
        limit: 20,
      });
      setSkills(res.skills);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch skill taxonomy');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery, page]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const openCreate = () => {
    setFormName('');
    setFormCategory('technical');
    setFormAliases('');
    setFormDescription('');
    setShowCreateModal(true);
  };

  const openEdit = (skill) => {
    setEditingSkill(skill);
    setFormName(skill.canonicalName);
    setFormCategory(skill.category || 'technical');
    setFormAliases((skill.aliases || []).join(', '));
    setFormDescription(skill.description || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const aliases = formAliases
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        canonicalName: formName.trim(),
        category: formCategory,
        aliases,
        description: formDescription.trim(),
      };

      if (editingSkill) {
        await adminApi.updateSkill(editingSkill.id, payload);
        setFeedback({ type: 'success', message: `Skill "${payload.canonicalName}" updated.` });
        setEditingSkill(null);
      } else {
        await adminApi.createSkill(payload);
        setFeedback({ type: 'success', message: `Skill "${payload.canonicalName}" added to taxonomy.` });
        setShowCreateModal(false);
      }
      await fetchSkills();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save skill' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await adminApi.deleteSkill(deleteTarget.id);
      setFeedback({ type: 'success', message: `Skill "${deleteTarget.canonicalName}" deleted.` });
      setDeleteTarget(null);
      await fetchSkills();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete skill' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>Canonical Skills Taxonomy</h3>
          <p style={styles.description}>Manage canonical skills, synonyms/aliases, and competency categories.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={styles.actionBtn}>
          + New Skill
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
          placeholder="Search skills by name or alias..."
          style={styles.searchInput}
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          style={styles.selectInput}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* States */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading skills taxonomy...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchSkills} className="btn btn-primary">Try Again</button>
        </div>
      ) : skills.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>No skills found matching your search.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Canonical Name</th>
                <th>Category</th>
                <th>Aliases / Synonyms</th>
                <th>Demand Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td>
                    <strong style={styles.nameText}>{skill.canonicalName}</strong>
                    <div style={styles.subtext}>{skill.slug}</div>
                  </td>
                  <td>
                    <span className="badge badge-role" style={{ textTransform: 'capitalize' }}>
                      {skill.category}
                    </span>
                  </td>
                  <td>
                    {skill.aliases && skill.aliases.length > 0 ? (
                      <div style={styles.aliasGroup}>
                        {skill.aliases.map((a) => (
                          <span key={a} style={styles.aliasChip}>{a}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={styles.subtext}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={styles.demandScore}>{skill.demandScore || 0}</span>
                  </td>
                  <td>
                    <div style={styles.actionRow}>
                      <button
                        onClick={() => openEdit(skill)}
                        className="btn btn-outline"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(skill)}
                        className="btn btn-ghost"
                        style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--color-burgundy-red)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!meta.hasPrevPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Page {meta.page} of {meta.totalPages} ({meta.total} skills)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!meta.hasNextPage || loading}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || editingSkill) && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <h4>{editingSkill ? 'Edit Skill' : 'Create Canonical Skill'}</h4>
            <form onSubmit={handleSave} style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={styles.modalLabel}>Canonical Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. React, Python, Machine Learning"
                  style={styles.modalInput}
                  required
                />
              </div>

              <div>
                <label style={styles.modalLabel}>Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={styles.modalInput}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.modalLabel}>Aliases (Comma-separated synonyms)</label>
                <input
                  type="text"
                  value={formAliases}
                  onChange={(e) => setFormAliases(e.target.value)}
                  placeholder="e.g. reactjs, react.js"
                  style={styles.modalInput}
                />
              </div>

              <div>
                <label style={styles.modalLabel}>Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this competency..."
                  style={{ ...styles.modalInput, minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingSkill(null); }}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Skill'}
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
            <h4>Delete Skill</h4>
            <p style={{ marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              Are you sure you want to delete skill <strong>{deleteTarget.canonicalName}</strong>? This may affect competency mappings.
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
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
  },
  searchInput: {
    flex: 1,
    minWidth: '220px',
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  selectInput: {
    padding: '6px 10px',
    borderRadius: 'var(--radius-xs)',
    border: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-primary)',
    minWidth: '150px',
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
  nameText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    display: 'block',
  },
  subtext: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '1px',
  },
  aliasGroup: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  aliasChip: {
    fontSize: '10px',
    padding: '1px 5px',
    borderRadius: '3px',
    backgroundColor: 'var(--color-mist-light)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  demandScore: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  actionRow: { display: 'flex', gap: '4px', alignItems: 'center' },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-1)',
    paddingTop: 'var(--space-2)',
  },
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
    maxWidth: '460px',
    width: '100%',
    padding: 'var(--space-5)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--radius-md)',
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

export default SkillsTaxonomyView;
