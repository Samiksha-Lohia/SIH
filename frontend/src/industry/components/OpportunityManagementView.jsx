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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="status-pill status-verified">
            <span className="status-pill-dot" />
            Published
          </span>
        );
      case 'paused':
        return (
          <span className="status-pill status-pending">
            <span className="status-pill-dot" />
            Paused
          </span>
        );
      case 'closed':
        return (
          <span className="status-pill" style={{ background: 'var(--color-border-subtle)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <span className="status-pill-dot" style={{ background: 'var(--color-text-muted)' }} />
            Closed
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="status-pill" style={{ background: 'var(--color-bg-app)', color: 'var(--color-steel-blue)', border: '1px solid var(--color-border)' }}>
            <span className="status-pill-dot" style={{ background: 'var(--color-steel-blue)' }} />
            Draft
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Header Controls */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Opportunity Postings & Lifecycle Manager
            </h3>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Publish, configure skills requirements, pause, and review applicants across your recruiting pipelines.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            + Create New Opportunity
          </button>
        </div>

        {/* Filter and Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by title, role or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
          >
            <option value="">All Opportunity Types</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="submit"
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading enterprise opportunities from backend registry...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-burgundy-red)' }}>
          <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-md)' }}>Failed to Load Opportunities</h4>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
          <button onClick={fetchOpportunities} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>Retry</button>
        </div>
      )}

      {/* Opportunities List Table */}
      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {opportunities.length === 0 ? (
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>No opportunities found matching your filters.</p>
              <button
                onClick={handleOpenCreate}
                className="btn btn-primary"
                style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}
              >
                Create your first posting
              </button>
            </div>
          ) : (
            <div className="data-table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Role</th>
                    <th>Type & Mode</th>
                    <th>Required Skills</th>
                    <th>Openings</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => {
                    const id = opp.id || opp._id;

                    return (
                      <tr key={id}>
                        <td>
                          <strong style={{ color: 'var(--color-primary)', display: 'block' }}>{opp.title}</strong>
                          <span style={{ color: 'var(--color-steel-blue)', fontSize: '11px' }}>{opp.role?.title || opp.targetRole || 'Engineering'}</span>
                        </td>
                        <td>
                          <div style={{ textTransform: 'capitalize', color: 'var(--color-text)' }}>{opp.type}</div>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{opp.workMode || opp.workplaceType}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', maxWidth: '300px' }}>
                            {opp.requiredSkills?.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="badge badge-sky" style={{ fontSize: '11px' }}>
                                {s.skill?.name || s.name || s.skill || 'Skill'}
                              </span>
                            ))}
                            {opp.requiredSkills?.length > 3 && (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', alignSelf: 'center' }}>
                                +{opp.requiredSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                          {opp.openings || 1}
                        </td>
                        <td>
                          {renderStatusBadge(opp.status)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                            {/* Publish / Pause / Close Quick Status Buttons */}
                            {opp.status === 'draft' && (
                              <button
                                onClick={() => handleStatusChange(id, 'published')}
                                disabled={actionLoading}
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-emerald)' }}
                              >
                                Publish
                              </button>
                            )}
                            {opp.status === 'published' && (
                              <button
                                onClick={() => handleStatusChange(id, 'paused')}
                                disabled={actionLoading}
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-amber)' }}
                              >
                                Pause
                              </button>
                            )}
                            {opp.status === 'paused' && (
                              <button
                                onClick={() => handleStatusChange(id, 'published')}
                                disabled={actionLoading}
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-emerald)' }}
                              >
                                Resume
                              </button>
                            )}
                            {opp.status !== 'closed' && (
                              <button
                                onClick={() => handleStatusChange(id, 'closed')}
                                disabled={actionLoading}
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                              >
                                Close
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(opp)}
                              className="btn btn-ghost"
                              style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-steel-blue)' }}
                            >
                              Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(id, opp.title)}
                              className="btn btn-ghost"
                              style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-burgundy-red)' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} total postings)</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div className="card" style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
                {editingOpp ? 'Edit Opportunity Posting' : 'Create New Opportunity Posting'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-burgundy-red)', borderRadius: 'var(--radius-md)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-xs)' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmitOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Posting Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Associate Full Stack Engineer Intern"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Opportunity Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  >
                    {OPPORTUNITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Workplace Mode</label>
                  <select
                    value={formData.workMode}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  >
                    {WORK_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore or Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Openings Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Monthly Stipend (INR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', fontWeight: 600 }}>Role Description</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities, team expectations, project scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', boxSizing: 'border-box' }}
                />
              </div>

              {/* Required Skills Builder */}
              <div style={{ background: 'var(--color-bg-app)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Mandatory Required Skills & Proficiency
                  </label>
                  <button
                    type="button"
                    onClick={() => addSkillRow('requiredSkills')}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    + Add Skill
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {formData.requiredSkills.map((sk, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Skill name (e.g. React, Python)"
                        value={sk.name}
                        onChange={(e) => handleSkillChange('requiredSkills', idx, 'name', e.target.value)}
                        style={{ flex: 2, padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
                      />
                      <select
                        value={sk.level}
                        onChange={(e) => handleSkillChange('requiredSkills', idx, 'level', e.target.value)}
                        style={{ flex: 1, padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
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
                        style={{ width: '60px', padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
                      />
                      {formData.requiredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkillRow('requiredSkills', idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-burgundy-red)', cursor: 'pointer', fontSize: 'var(--font-size-md)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Skills Builder */}
              <div style={{ background: 'var(--color-bg-app)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Preferred / Bonus Skills
                  </label>
                  <button
                    type="button"
                    onClick={() => addSkillRow('preferredSkills')}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    + Add Preferred
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {formData.preferredSkills.map((sk, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Preferred skill (e.g. Docker, GraphQL)"
                        value={sk.name}
                        onChange={(e) => handleSkillChange('preferredSkills', idx, 'name', e.target.value)}
                        style={{ flex: 2, padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
                      />
                      <select
                        value={sk.level}
                        onChange={(e) => handleSkillChange('preferredSkills', idx, 'level', e.target.value)}
                        style={{ flex: 1, padding: 'var(--space-1) var(--space-2)', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}
                      >
                        {PROFICIENCY_LEVELS.map((pl) => (
                          <option key={pl.value} value={pl.value}>{pl.label}</option>
                        ))}
                      </select>
                      {formData.preferredSkills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkillRow('preferredSkills', idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-burgundy-red)', cursor: 'pointer', fontSize: 'var(--font-size-md)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
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
