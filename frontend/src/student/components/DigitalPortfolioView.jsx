import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { studentApi } from '../student.api.js';

const ITEM_TYPES = [
  { value: '', label: 'All Portfolio Types' },
  { value: 'project', label: 'Project' },
  { value: 'certification', label: 'Certification' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'publication', label: 'Publication / Paper' },
  { value: 'experience', label: 'Work Experience' },
  { value: 'award', label: 'Award & Honor' },
  { value: 'other', label: 'Other Credential' },
];

export function DigitalPortfolioView() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: 'project',
    issuer: '',
    description: '',
    skills: '',
    link: '',
    visibility: 'public',
  });

  // Resume Generator Modal
  const [resumeData, setResumeData] = useState(null);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);

  // Public Share Modal
  const [shareData, setShareData] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentApi.listMyPortfolio({
        type: typeFilter || undefined,
        page,
        limit: 12,
      });
      setItems(res.items || []);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to load portfolio items');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateItem = async () => {
    if (!newItem.title.trim()) return;
    setSavingItem(true);
    try {
      const skillsArray = newItem.skills
        ? newItem.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await studentApi.createPortfolioItem({
        title: newItem.title.trim(),
        type: newItem.type,
        issuer: newItem.issuer?.trim() || undefined,
        description: newItem.description?.trim() || undefined,
        skills: skillsArray,
        link: newItem.link?.trim() || undefined,
        visibility: newItem.visibility,
      });

      setFeedback({ type: 'success', message: `Portfolio item "${newItem.title}" added successfully!` });
      setShowAddModal(false);
      setNewItem({ title: '', type: 'project', issuer: '', description: '', skills: '', link: '', visibility: 'public' });
      await fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create portfolio item' });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Remove "${title}" from your portfolio?`)) return;
    try {
      await studentApi.deletePortfolioItem(id);
      setFeedback({ type: 'success', message: `Portfolio item removed.` });
      await fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete portfolio item' });
    }
  };

  const handleGenerateResume = async () => {
    setGeneratingResume(true);
    setCopiedResume(false);
    try {
      const res = await studentApi.generateResume();
      // Backend returns { source: '...', resume: { summary, sections, ... } }
      const resumePayload = res?.resume || res;
      setResumeData({
        ...resumePayload,
        source: res?.source || resumePayload?._meta?.source || 'AI Engine',
        name: resumePayload?.name || user?.name || 'Student Candidate',
        email: resumePayload?.email || user?.email || '',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to generate resume preview. Ensure your profile has basic information saved.',
      });
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleOpenShareView = async () => {
    let userId = user?.id || user?._id;
    if (!userId) {
      try {
        const p = await studentApi.getMyProfile();
        userId = p?.profile?.user || p?.user?.id || p?.user?._id;
      } catch {
        // ignore
      }
    }

    if (!userId) {
      setFeedback({ type: 'error', message: 'Unable to identify current user account for public share.' });
      return;
    }

    setLoadingShare(true);
    setCopiedShareLink(false);
    try {
      const res = await studentApi.getPortfolioShare(userId);
      setShareData(res);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch public share view' });
    } finally {
      setLoadingShare(false);
    }
  };

  const handleCopyResumeText = () => {
    if (!resumeData) return;
    const lines = [];
    lines.push(`${resumeData.name || user?.name || 'Candidate'}`);
    lines.push(`${resumeData.email || user?.email || ''}\n`);
    if (resumeData.summary) {
      lines.push(`PROFESSIONAL SUMMARY\n${resumeData.summary}\n`);
    }
    if (Array.isArray(resumeData.sections)) {
      for (const sec of resumeData.sections) {
        lines.push(`${(sec.heading || '').toUpperCase()}`);
        for (const it of sec.items || []) {
          lines.push(`• ${it}`);
        }
        lines.push('');
      }
    }
    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 3000);
  };

  const handleCopyShareLink = () => {
    const userId = user?.id || user?._id || shareData?.user?.id;
    const shareUrl = `${window.location.origin}/share/portfolio/${userId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const verifiedCount = items.filter((i) => i.verificationStatus === 'verified').length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={{ margin: 0 }}>Verified Digital Portfolio & Artifact Vault</h3>
          <p style={styles.description}>
            Curate your accomplishments, certifications, and live code repositories. Verified items carry trust badges for recruiter discovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateResume}
            disabled={generatingResume}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {generatingResume ? 'Compiling AI Resume...' : '📄 Generate AI Resume'}
          </button>

          <button
            onClick={handleOpenShareView}
            disabled={loadingShare}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {loadingShare ? 'Loading Share Card...' : '🔗 Public Share Card'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            + Add Portfolio Item
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: feedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: feedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statCell}>
          <span style={styles.statLabel}>Total Artifacts</span>
          <strong style={styles.statVal}>{items.length}</strong>
        </div>
        <div style={styles.statCell}>
          <span style={styles.statLabel}>Verified Credentials</span>
          <strong style={{ ...styles.statVal, color: '#15803d' }}>{verifiedCount}</strong>
        </div>
        <div style={styles.statCell}>
          <span style={styles.statLabel}>Public Showcase</span>
          <strong style={styles.statVal}>{items.filter((i) => i.visibility === 'public').length}</strong>
        </div>
        <div style={styles.statCell}>
          <span style={styles.statLabel}>Trust Level</span>
          <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', width: 'fit-content', marginTop: '4px' }}>
            {verifiedCount > 0 ? 'Verified Tier' : 'Self-Reported'}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={styles.toolbar}>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={styles.select}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Loading digital portfolio artifacts...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchItems} className="btn btn-primary">Try Again</button>
        </div>
      ) : items.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)' }}>
            No portfolio items in your artifact vault yet. Add projects, research, or certifications to start building your verified showcase!
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>
            + Add First Portfolio Item
          </button>
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {items.map((item) => (
            <div key={item.id} className="card" style={styles.itemCard}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                    {item.type}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '11px',
                      textTransform: 'capitalize',
                      backgroundColor: item.verificationStatus === 'verified' ? '#dcfce7' : item.verificationStatus === 'rejected' ? '#fee2e2' : '#fef9c3',
                      color: item.verificationStatus === 'verified' ? '#15803d' : item.verificationStatus === 'rejected' ? '#b91c1c' : '#a16207',
                      border: '1px solid currentColor',
                    }}
                  >
                    {item.verificationStatus === 'verified' ? '✓ Verified' : item.verificationStatus}
                  </span>
                </div>

                <h4 style={{ color: 'var(--color-primary)', marginBottom: '4px' }}>{item.title}</h4>
                {item.issuer && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                    🏛️ {item.issuer}
                  </div>
                )}

                {item.description && (
                  <p style={styles.descText}>{item.description}</p>
                )}

                {item.skills?.length > 0 && (
                  <div style={styles.chipRow}>
                    {item.skills.map((s, idx) => (
                      <span key={idx} className="badge badge-mist" style={{ fontSize: '10px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.cardFooter}>
                <div>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      🔗 View Resource ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No external link</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {item.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="btn btn-outline"
                    style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    title="Remove item"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Page {page} of {meta.totalPages} ({meta.total} artifacts)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="btn btn-outline"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4>Add Digital Portfolio Artifact</h4>
              <button onClick={() => setShowAddModal(false)} style={styles.closeIcon}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={styles.label}>Artifact Title *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g. Distributed Key-Value Store, AWS Certified Solutions Architect"
                  style={styles.input}
                />
              </div>

              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Artifact Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                    style={styles.input}
                  >
                    {ITEM_TYPES.filter((t) => t.value).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Visibility</label>
                  <select
                    value={newItem.visibility}
                    onChange={(e) => setNewItem({ ...newItem, visibility: e.target.value })}
                    style={styles.input}
                  >
                    <option value="public">🌐 Public (Recruiters)</option>
                    <option value="private">🔒 Private (Personal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={styles.label}>Issuer / Organization / Platform</label>
                <input
                  type="text"
                  value={newItem.issuer}
                  onChange={(e) => setNewItem({ ...newItem, issuer: e.target.value })}
                  placeholder="e.g. Stanford University, GitHub, HackerRank, IEEE"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Associated Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={newItem.skills}
                  onChange={(e) => setNewItem({ ...newItem, skills: e.target.value })}
                  placeholder="e.g. Golang, Raft, Distributed Systems"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>External Link / GitHub / Credential URL</label>
                <input
                  type="text"
                  value={newItem.link}
                  onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                  placeholder="https://github.com/..."
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Outline key technical challenges, outcomes, and metrics..."
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button onClick={() => setShowAddModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleCreateItem} disabled={savingItem} className="btn btn-primary">
                {savingItem ? 'Saving...' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Resume Generator Modal */}
      {resumeData && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.largeModalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>AI-Generated Resume Proposal</h4>
                <span className="badge badge-sky" style={{ fontSize: '10px' }}>
                  ⚡ {resumeData.source || 'AI Engine'}
                </span>
              </div>
              <button onClick={() => setResumeData(null)} style={styles.closeIcon}>×</button>
            </div>

            <div style={styles.resumeScrollArea}>
              {/* Header Box */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--color-primary)' }}>{resumeData.name || user?.name}</h3>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {resumeData.email || user?.email}
                </span>
                {resumeData.summary && (
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)', fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    "{resumeData.summary}"
                  </p>
                )}
              </div>

              {/* Structured Sections (from AI or Synthesis Engine) */}
              {Array.isArray(resumeData.sections) && resumeData.sections.length > 0 ? (
                resumeData.sections.map((sec, idx) => (
                  <div key={idx} style={{ marginBottom: 'var(--space-4)' }}>
                    <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '4px', marginBottom: '8px' }}>
                      {sec.heading}
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sec.items?.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <>
                  {/* Fallback legacy field rendering if present */}
                  {resumeData.skills?.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>Technical Competencies</h5>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {resumeData.skills.map((s, i) => (
                          <span key={i} className="badge badge-sky" style={{ fontSize: '11px' }}>
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeData.projects?.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>Featured Projects</h5>
                      {resumeData.projects.map((p, i) => (
                        <div key={i} style={{ marginTop: '6px' }}>
                          <strong>{p.title}</strong>
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{p.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <button
                onClick={handleCopyResumeText}
                className="btn btn-outline"
                style={{ fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedResume ? '✓ Copied to Clipboard!' : '📋 Copy Resume Text'}
              </button>

              <button onClick={() => setResumeData(null)} className="btn btn-primary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Share Card Modal */}
      {shareData && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.largeModalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0 }}>Public Verified Share Card</h4>
                <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '11px' }}>
                  ✓ Live & Public
                </span>
              </div>
              <button onClick={() => setShareData(null)} style={styles.closeIcon}>×</button>
            </div>

            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-3) 0' }}>
              This public credential view is accessible by recruiters and institutions to verify student skills and artifacts.
            </p>

            {/* Share Link Bar */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/share/portfolio/${user?.id || user?._id || shareData?.user?.id}`}
                style={{ ...styles.input, fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' }}
              />
              <button
                onClick={handleCopyShareLink}
                className="btn btn-outline"
                style={{ fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}
              >
                {copiedShareLink ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {/* Profile Overview Card */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{shareData.user?.name}</h3>
                    <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize', marginTop: '4px' }}>
                      {shareData.user?.role || 'Student Candidate'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Profile Completeness</div>
                    <strong style={{ fontSize: '1.2rem', color: '#0284c7' }}>{shareData.summary?.completeness || 0}%</strong>
                  </div>
                </div>

                {shareData.summary?.targetRoles?.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Target Roles</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {shareData.summary.targetRoles.map((r, i) => (
                        <span key={i} className="badge badge-mist" style={{ fontSize: '11px' }}>{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {shareData.summary?.topSkills?.length > 0 && (
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Verified Skills & Competencies</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {shareData.summary.topSkills.map((s, i) => (
                        <span key={i} className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontSize: '11px' }}>
                          ✓ {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Public Items List */}
              <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                Public Portfolio Items ({shareData.items?.length || 0})
              </h5>

              {shareData.items?.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  No items marked as public yet. Edit or add artifacts with visibility set to "Public" to feature them here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {shareData.items.map((item, idx) => (
                    <div key={idx} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong>{item.title}</strong>
                          <span className="badge badge-sky" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{item.type}</span>
                          {item.verificationStatus === 'verified' && (
                            <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '10px' }}>✓ Verified</span>
                          )}
                        </div>
                        {item.description && (
                          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>{item.description}</p>
                        )}
                      </div>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                          View ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <button onClick={() => setShareData(null)} className="btn btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' },
  statCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel: { fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600' },
  statVal: { fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-family-display)' },
  toolbar: { display: 'flex', gap: 'var(--space-2)' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)', minWidth: '180px' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' },
  itemCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  descText: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 'var(--space-2)' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' },
  link: { fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
  closeIcon: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--color-text-muted)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '460px', width: '100%' },
  largeModalCard: { maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  resumeScrollArea: { overflowY: 'auto', flex: 1, paddingRight: '6px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' },
  label: { display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  input: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-app)' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default DigitalPortfolioView;
