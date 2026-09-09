import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

const OPPORTUNITY_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'job', label: 'Full-time Job' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'live_project', label: 'Live Project' },
  { value: 'industrial_training', label: 'Industrial Training' },
  { value: 'entry_level', label: 'Entry Level Role' },
];

const WORK_MODES = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

export const OpportunityManagementView = ({ isCompanyVerified }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Form state for Create/Edit
  const initialForm = {
    title: '',
    type: 'internship',
    role: '',
    description: '',
    workMode: 'onsite',
    location: '',
    openings: 1,
    stipend: '',
    salary: '',
    duration: '',
    deadline: '',
    minCgpa: '',
    branchesStr: '',
    requiredSkills: [{ name: '', level: 'intermediate', weight: 3 }],
    preferredSkills: [{ name: '', level: 'intermediate', weight: 1 }],
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await industryApi.listMyOpportunities({
        q: searchQuery || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page: currentPage,
        limit: 10,
      });
      setOpportunities(res.opportunities);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [currentPage, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOpportunities();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(initialForm);
    setEditingOpp(null);
    setActionError('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (opp) => {
    setEditingOpp(opp);
    setActionError('');
    setFormData({
      title: opp.title || '',
      type: opp.type || 'internship',
      role: opp.role || '',
      description: opp.description || '',
      workMode: opp.workMode || 'onsite',
      location: opp.location || '',
      openings: opp.openings || 1,
      stipend: opp.stipend ? String(opp.stipend) : '',
      salary: opp.salary ? String(opp.salary) : '',
      duration: opp.duration || '',
      deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
      minCgpa: opp.eligibility?.minCgpa ? String(opp.eligibility.minCgpa) : '',
      branchesStr: Array.isArray(opp.eligibility?.branches) ? opp.eligibility.branches.join(', ') : '',
      requiredSkills: opp.requiredSkills && opp.requiredSkills.length > 0
        ? opp.requiredSkills.map((s) => ({ name: s.name, level: s.level || 'intermediate', weight: s.weight || 3 }))
        : [{ name: '', level: 'intermediate', weight: 3 }],
      preferredSkills: opp.preferredSkills && opp.preferredSkills.length > 0
        ? opp.preferredSkills.map((s) => ({ name: s.name, level: s.level || 'intermediate', weight: s.weight || 1 }))
        : [{ name: '', level: 'intermediate', weight: 1 }],
    });
    setShowCreateModal(true);
  };

  // Skill row handlers
  const handleSkillChange = (type, index, field, value) => {
    setFormData((prev) => {
      const list = [...prev[type]];
      list[index] = { ...list[index], [field]: field === 'weight' ? Number(value) : value };
      return { ...prev, [type]: list };
    });
  };

  const addSkillRow = (type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], { name: '', level: 'intermediate', weight: type === 'requiredSkills' ? 3 : 1 }],
    }));
  };

  const removeSkillRow = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  // Submit Create or Edit
  const handleSubmitOpportunity = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      const branches = formData.branchesStr
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        role: formData.role.trim() || undefined,
        description: formData.description.trim() || undefined,
        workMode: formData.workMode,
        location: formData.location.trim() || undefined,
        openings: Number(formData.openings) || 1,
        stipend: formData.stipend ? Number(formData.stipend) : undefined,
        salary: formData.salary ? Number(formData.salary) : undefined,
        duration: formData.duration.trim() || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        eligibility: {
          minCgpa: formData.minCgpa ? Number(formData.minCgpa) : undefined,
          branches: branches.length ? branches : undefined,
        },
        requiredSkills: formData.requiredSkills
          .filter((s) => s.name.trim())
          .map((s) => ({ name: s.name.trim(), level: s.level, weight: Number(s.weight) || 1 })),
        preferredSkills: formData.preferredSkills
          .filter((s) => s.name.trim())
          .map((s) => ({ name: s.name.trim(), level: s.level, weight: Number(s.weight) || 1 })),
      };

      if (editingOpp) {
        const id = editingOpp.id || editingOpp._id;
        await industryApi.updateOpportunity(id, payload);
      } else {
        await industryApi.createOpportunity(payload);
      }

      setShowCreateModal(false);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to save opportunity:', err);
      setActionError(err.message || 'Failed to save opportunity');
    } finally {
      setActionLoading(false);
    }
  };

  // Change status (publish, pause, close)
  const handleStatusChange = async (oppId, newStatus) => {
    try {
      setActionLoading(true);
      await industryApi.changeOpportunityStatus(oppId, newStatus);
      fetchOpportunities();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async (oppId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      setActionLoading(true);
      await industryApi.deleteOpportunity(oppId);
      fetchOpportunities();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return { bg: '#065f46', text: '#34d399', label: 'Published' };
      case 'paused':
        return { bg: '#854d0e', text: '#fde047', label: 'Paused' };
      case 'closed':
        return { bg: '#334155', text: '#94a3b8', label: 'Closed' };
      case 'draft':
      default:
        return { bg: '#1e293b', text: '#38bdf8', label: 'Draft' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Controls */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              💼 Opportunity Postings & Lifecycle Manager
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Publish, configure skills requirements, pause, and review applicants across your recruiting pipelines.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            + Create New Opportunity
          </button>
        </div>

        {/* Filter and Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by title, role or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="">All Opportunity Types</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="submit"
            style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Loading enterprise opportunities from backend registry...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Failed to Load Opportunities</h4>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={fetchOpportunities} style={{ padding: '0.4rem 0.8rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Opportunities List Table */}
      {!loading && !error && (
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          {opportunities.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>No opportunities found matching your filters.</p>
              <button
                onClick={handleOpenCreate}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Create your first posting
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '1rem' }}>Title & Role</th>
                    <th style={{ padding: '1rem' }}>Type & Mode</th>
                    <th style={{ padding: '1rem' }}>Required Skills</th>
                    <th style={{ padding: '1rem' }}>Openings</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => {
                    const id = opp.id || opp._id;
                    const badge = getStatusBadge(opp.status);
                    const skills = opp.requiredSkills || [];

                    return (
                      <tr key={id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{opp.title}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            {opp.role ? `Role: ${opp.role}` : 'General Posting'} • Location: {opp.location || 'Flexible'}
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                          <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{opp.type}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>{opp.workMode}</div>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '280px' }}>
                            {skills.slice(0, 3).map((s, idx) => (
                              <span key={idx} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                {typeof s === 'string' ? s : `${s.name} (${s.level || 'req'})`}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span style={{ color: '#64748b', fontSize: '0.75rem', alignSelf: 'center' }}>+{skills.length - 3}</span>
                            )}
                            {skills.length === 0 && <span style={{ color: '#64748b', fontStyle: 'italic' }}>Open</span>}
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 600 }}>
                          {opp.openings || 1}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: badge.bg, color: badge.text, padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {badge.label}
                          </span>
                        </td>

                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                            {/* Publish / Pause / Close Quick Status Buttons */}
                            {opp.status === 'draft' && (
                              <button
                                onClick={() => handleStatusChange(id, 'published')}
                                disabled={actionLoading}
                                style={{ padding: '0.3rem 0.6rem', background: '#065f46', color: '#34d399', border: '1px solid #059669', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Publish
                              </button>
                            )}
                            {opp.status === 'published' && (
                              <button
                                onClick={() => handleStatusChange(id, 'paused')}
                                disabled={actionLoading}
                                style={{ padding: '0.3rem 0.6rem', background: '#854d0e', color: '#fde047', border: '1px solid #b45309', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Pause
                              </button>
                            )}
                            {opp.status === 'paused' && (
                              <button
                                onClick={() => handleStatusChange(id, 'published')}
                                disabled={actionLoading}
                                style={{ padding: '0.3rem 0.6rem', background: '#065f46', color: '#34d399', border: '1px solid #059669', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Resume
                              </button>
                            )}
                            {opp.status !== 'closed' && (
                              <button
                                onClick={() => handleStatusChange(id, 'closed')}
                                disabled={actionLoading}
                                style={{ padding: '0.3rem 0.6rem', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Close
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(opp)}
                              style={{ padding: '0.3rem 0.6rem', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(id, opp.title)}
                              style={{ padding: '0.3rem 0.6rem', background: '#450a0a', color: '#fca5a5', border: '1px solid #dc2626', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} total postings)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ padding: '0.35rem 0.75rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{ padding: '0.35rem 0.75rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                {editingOpp ? 'Edit Opportunity Posting' : 'Create New Opportunity Posting'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div style={{ padding: '0.75rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmitOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Posting Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Associate Full Stack Engineer Intern"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Opportunity Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Workplace Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {WORK_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Openings Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Monthly Stipend (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, team expectations, project scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              {/* Required Skills Builder */}
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
                    ⭐ Mandatory Required Skills & Proficiency
                  </label>
                  <button
                    type="button"
                    onClick={() => addSkillRow('requiredSkills')}
                    style={{ padding: '0.25rem 0.6rem', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    + Add Skill
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.requiredSkills.map((sk, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Skill name (e.g. React, Python)"
                        value={sk.name}
                        onChange={(e) => handleSkillChange('requiredSkills', idx, 'name', e.target.value)}
                        style={{ flex: 2, padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <select
                        value={sk.level}
                        onChange={(e) => handleSkillChange('requiredSkills', idx, 'level', e.target.value)}
                        style={{ flex: 1, padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      >
                        {PROFICIENCY_LEVELS.map((pl) => (
                          <option key={pl.value} value={pl.value}>{pl.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        title="Weight (1-10)"
                        value={sk.weight}
                        onChange={(e) => handleSkillChange('requiredSkills', idx, 'weight', e.target.value)}
                        style={{ width: '60px', padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      {formData.requiredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkillRow('requiredSkills', idx)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Skills Builder */}
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                    💡 Preferred / Bonus Skills
                  </label>
                  <button
                    type="button"
                    onClick={() => addSkillRow('preferredSkills')}
                    style={{ padding: '0.25rem 0.6rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    + Add Preferred
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.preferredSkills.map((sk, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Preferred skill (e.g. Docker, GraphQL)"
                        value={sk.name}
                        onChange={(e) => handleSkillChange('preferredSkills', idx, 'name', e.target.value)}
                        style={{ flex: 2, padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <select
                        value={sk.level}
                        onChange={(e) => handleSkillChange('preferredSkills', idx, 'level', e.target.value)}
                        style={{ flex: 1, padding: '0.45rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}
                      >
                        {PROFICIENCY_LEVELS.map((pl) => (
                          <option key={pl.value} value={pl.value}>{pl.label}</option>
                        ))}
                      </select>
                      {formData.preferredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkillRow('preferredSkills', idx)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.6rem 1.25rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.6rem 1.5rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? 'Saving...' : editingOpp ? 'Update Posting' : 'Create Posting (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityManagementView;
