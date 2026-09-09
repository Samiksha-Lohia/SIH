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
  const [editableResume, setEditableResume] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
      const resumePayload = res?.resume || res;
      setResumeData(resumePayload);
      setEditableResume(JSON.parse(JSON.stringify(resumePayload)));
      setIsEditMode(false);
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
    const data = editableResume || resumeData;
    if (!data) return;

    const lines = [];
    lines.push(data.name || user?.name || 'Candidate');
    if (data.targetRole) lines.push(data.targetRole);
    const contacts = [data.email, data.phone, data.location].filter(Boolean);
    if (contacts.length) lines.push(contacts.join(' • '));
    lines.push('----------------------------------------\n');

    if (data.summary) {
      lines.push('PROFESSIONAL SUMMARY');
      lines.push(data.summary);
      lines.push('');
    }

    const techSkills = data.skills?.technical || [];
    const softSkills = data.skills?.soft || [];
    if (techSkills.length || softSkills.length) {
      lines.push('TECHNICAL & PROFESSIONAL SKILLS');
      if (techSkills.length) {
        lines.push('• Technical: ' + techSkills.map((s) => `${s.name}${s.level ? ` (${s.level})` : ''}`).join(', '));
      }
      if (softSkills.length) {
        lines.push('• Professional: ' + softSkills.map((s) => s.name).join(', '));
      }
      lines.push('');
    }

    if (Array.isArray(data.projects) && data.projects.length) {
      lines.push('FEATURED PROJECTS');
      for (const p of data.projects) {
        lines.push(`• ${p.title}${p.techStack?.length ? ` [${p.techStack.join(', ')}]` : ''}`);
        if (p.description) lines.push(`  ${p.description}`);
        if (p.link) lines.push(`  Link: ${p.link}`);
      }
      lines.push('');
    }

    if (Array.isArray(data.education) && data.education.length) {
      lines.push('EDUCATION');
      for (const e of data.education) {
        lines.push(`• ${e.degree}${e.branch ? ` in ${e.branch}` : ''} - ${e.institution}${e.graduationYear ? ` (${e.graduationYear})` : ''}`);
        if (e.score) lines.push(`  Score: ${e.score}`);
      }
      lines.push('');
    }

    if (Array.isArray(data.certifications) && data.certifications.length) {
      lines.push('CERTIFICATIONS');
      for (const c of data.certifications) {
        lines.push(`• ${c.name}${c.issuer ? ` - ${c.issuer}` : ''}`);
      }
      lines.push('');
    }

    const fullText = lines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 3000);
  };

  const handleDownloadPdf = () => {
    const data = editableResume || resumeData;
    if (!data) return;

    setDownloadingPdf(true);

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;

    const techSkillsHtml = (data.skills?.technical || [])
      .map(
        (s) =>
          `<span class="skill-pill ${s.verified ? 'verified' : ''}">${s.name}${s.verified ? ' ✓' : ''}</span>`
      )
      .join('');

    const softSkillsHtml = (data.skills?.soft || [])
      .map((s) => `<span class="skill-pill">${s.name}</span>`)
      .join('');

    const projectsHtml = (data.projects || [])
      .map(
        (p) => `
        <div class="project-item">
          <div class="item-header">
            <span class="item-title">${p.title}</span>
            ${p.link ? `<span class="item-link">${p.link}</span>` : ''}
          </div>
          ${
            p.techStack && p.techStack.length
              ? `<div class="tech-tags">Technologies: ${p.techStack.join(', ')}</div>`
              : ''
          }
          <div class="project-desc">${p.description || ''}</div>
        </div>
      `
      )
      .join('');

    const educationHtml = (data.education || [])
      .map(
        (e) => `
        <div class="education-item">
          <div class="item-header">
            <span class="item-title">${e.degree}${e.branch ? ` in ${e.branch}` : ''}</span>
            <span class="item-meta">${e.graduationYear ? `Class of ${e.graduationYear}` : ''}</span>
          </div>
          <div class="edu-sub">${e.institution}${e.score ? ` • Score: ${e.score}` : ''}</div>
        </div>
      `
      )
      .join('');

    const certsHtml = (data.certifications || [])
      .map(
        (c) => `
        <div class="cert-item">
          <span class="item-title">${c.name}</span>
          ${c.issuer ? `<span class="item-meta"> — ${c.issuer}</span>` : ''}
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.name || 'Candidate'} - Professional Resume</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            background: #ffffff;
          }
          .resume-sheet { width: 100%; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2pt solid #0284c7; padding-bottom: 8pt; margin-bottom: 10pt; }
          .name { font-size: 22pt; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 2pt 0; }
          .role { font-size: 11pt; color: #0284c7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4pt; }
          .contacts { font-size: 9pt; color: #475569; display: flex; flex-wrap: wrap; gap: 12pt; }
          .section { margin-bottom: 10pt; }
          .section-title { font-size: 10.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #1e293b; border-bottom: 1pt solid #e2e8f0; padding-bottom: 2pt; margin: 0 0 6pt 0; }
          .summary-text { font-size: 9.5pt; color: #334155; line-height: 1.5; margin: 0; }
          .skills-wrap { display: flex; flex-wrap: wrap; gap: 4pt; }
          .skill-pill { display: inline-block; font-size: 8.5pt; background-color: #f1f5f9; border: 1pt solid #cbd5e1; padding: 1.5pt 5pt; border-radius: 3pt; color: #0f172a; }
          .skill-pill.verified { background-color: #ecfdf5; border-color: #86efac; color: #166534; font-weight: 600; }
          .project-item, .education-item { margin-bottom: 6pt; }
          .item-header { display: flex; justify-content: space-between; align-items: baseline; }
          .item-title { font-size: 10pt; font-weight: 700; color: #0f172a; }
          .item-meta { font-size: 8.5pt; color: #64748b; }
          .item-link { font-size: 8pt; color: #0284c7; }
          .tech-tags { font-size: 8.5pt; color: #0284c7; font-weight: 600; margin: 1pt 0 2pt 0; }
          .project-desc { font-size: 9pt; color: #334155; line-height: 1.45; }
          .edu-sub { font-size: 9pt; color: #475569; }
          .cert-item { font-size: 9pt; margin-bottom: 3pt; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="resume-sheet">
          <div class="header">
            <h1 class="name">${data.name || 'Candidate'}</h1>
            ${data.targetRole ? `<div class="role">${data.targetRole}</div>` : ''}
            <div class="contacts">
              ${data.email ? `<span>Email: ${data.email}</span>` : ''}
              ${data.phone ? `<span>Phone: ${data.phone}</span>` : ''}
              ${data.location ? `<span>Location: ${data.location}</span>` : ''}
              ${data.links?.github ? `<span>GitHub: ${data.links.github}</span>` : ''}
              ${data.links?.linkedin ? `<span>LinkedIn: ${data.links.linkedin}</span>` : ''}
            </div>
          </div>
          ${data.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p class="summary-text">${data.summary}</p></div>` : ''}
          ${techSkillsHtml || softSkillsHtml ? `<div class="section"><div class="section-title">Technical & Professional Competencies</div><div class="skills-wrap">${techSkillsHtml}${softSkillsHtml}</div></div>` : ''}
          ${projectsHtml ? `<div class="section"><div class="section-title">Featured Projects</div>${projectsHtml}</div>` : ''}
          ${educationHtml ? `<div class="section"><div class="section-title">Education</div>${educationHtml}</div>` : ''}
          ${certsHtml ? `<div class="section"><div class="section-title">Certifications & Honors</div>${certsHtml}</div>` : ''}
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      setDownloadingPdf(false);
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 3000);
    }, 400);
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
          <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Verified Digital Portfolio & Artifact Vault</h3>
          <p style={styles.description}>
            Curate your accomplishments, certifications, and live code repositories. Verified items carry trust badges for recruiter discovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerateResume}
            disabled={generatingResume}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {generatingResume ? 'Compiling AI Resume...' : 'Generate AI Resume'}
          </button>

          <button
            onClick={handleOpenShareView}
            disabled={loadingShare}
            className="btn btn-ghost"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {loadingShare ? 'Loading Share Card...' : 'Public Share Card'}
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

      {/* KPI Stats Grid */}
      <div className="b2b-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))' }}>
        <div className="b2b-kpi-tile">
          <span className="b2b-kpi-label">Total Artifacts</span>
          <div className="b2b-kpi-value">{items.length}</div>
          <span className="b2b-kpi-trend">Repository items</span>
        </div>
        <div className="b2b-kpi-tile">
          <span className="b2b-kpi-label">Verified Credentials</span>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-success)' }}>{verifiedCount}</div>
          <span className="b2b-kpi-trend">Institution / Issuer confirmed</span>
        </div>
        <div className="b2b-kpi-tile">
          <span className="b2b-kpi-label">Public Showcase</span>
          <div className="b2b-kpi-value">{items.filter((i) => i.visibility === 'public').length}</div>
          <span className="b2b-kpi-trend">Visible to recruiters</span>
        </div>
        <div className="b2b-kpi-tile">
          <span className="b2b-kpi-label">Trust Verification Tier</span>
          <div style={{ marginTop: 'var(--space-2)' }}>
            <span className={`status-pill ${verifiedCount > 0 ? 'status-verified' : 'status-pending'}`}>
              <span className="status-pill-dot" />
              {verifiedCount > 0 ? 'Verified Tier' : 'Self-Reported'}
            </span>
          </div>
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
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Loading digital portfolio artifacts...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>{error}</p>
          <button onClick={fetchItems} className="btn btn-outline">Try Again</button>
        </div>
      ) : items.length === 0 ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', maxWidth: '440px' }}>
            No portfolio items in your artifact vault yet. Add projects, research, or certifications to start building your verified showcase.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
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
                    className={`status-pill ${
                      item.verificationStatus === 'verified'
                        ? 'status-verified'
                        : item.verificationStatus === 'rejected'
                        ? 'status-rejected'
                        : 'status-pending'
                    }`}
                  >
                    <span className="status-pill-dot" />
                    {item.verificationStatus === 'verified' ? 'Verified' : item.verificationStatus || 'Pending'}
                  </span>
                </div>

                <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: 'var(--font-size-sm)' }}>{item.title}</h4>
                {item.issuer && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                    {item.issuer}
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
                      View Resource ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No external link</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {item.visibility === 'public' ? 'Public' : 'Private'}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.title)}
                    className="btn btn-ghost"
                    style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--color-danger)' }}
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
                    <option value="public">Public (Recruiters)</option>
                    <option value="private">Private (Personal)</option>
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
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost">
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
            {/* Modal Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Structured AI Resume</h4>
                <span className="badge badge-sky" style={{ fontSize: '10px' }}>
                  {resumeData._meta?.source || resumeData.source || 'SUTRA AI'}
                </span>
                <span className="status-pill status-verified" style={{ fontSize: '11px' }}>
                  <span className="status-pill-dot" />
                  Stored Facts Preserved
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="btn btn-ghost"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                >
                  {isEditMode ? 'View Formatted' : 'Edit Text'}
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '4px 12px' }}
                >
                  {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>

                <button onClick={() => setResumeData(null)} style={styles.closeIcon}>×</button>
              </div>
            </div>

            {/* Scrollable Formatted Resume Sheet Area */}
            <div style={styles.resumeScrollArea}>
              {/* White Physical Resume Paper Sheet */}
              <div style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                padding: 'clamp(16px, 4vw, 40px)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                border: '1px solid var(--color-border)',
                margin: '0 auto',
                maxWidth: '740px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                {/* Header: Name, Target Role, Contact Row */}
                <div style={{ borderBottom: '2px solid var(--color-steel-blue)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {editableResume?.name || user?.name || 'Student Candidate'}
                  </h2>
                  {editableResume?.targetRole && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      {editableResume.targetRole}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: '#475569' }}>
                    {editableResume?.email && <span>Email: {editableResume.email}</span>}
                    {editableResume?.phone && <span>Phone: {editableResume.phone}</span>}
                    {editableResume?.location && <span>Location: {editableResume.location}</span>}
                    {editableResume?.links?.github && <span>GitHub: {editableResume.links.github}</span>}
                    {editableResume?.links?.linkedin && <span>LinkedIn: {editableResume.links.linkedin}</span>}
                  </div>
                </div>

                {/* Section 1: Professional Summary */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                    Professional Summary
                  </div>
                  {isEditMode ? (
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Inline Edit Summary:
                      </span>
                      <textarea
                        rows={3}
                        value={editableResume?.summary || ''}
                        onChange={(e) => setEditableResume({ ...editableResume, summary: e.target.value })}
                        style={{ width: '100%', padding: '8px', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                      />
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
                      {editableResume?.summary || 'Candidate is building verified technical competencies.'}
                    </p>
                  )}
                </div>

                {/* Section 2: Technical & Soft Competencies */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                    Technical & Professional Competencies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(editableResume?.skills?.technical || []).map((s, i) => (
                      <span
                        key={i}
                        className={`status-pill ${s.verified ? 'status-verified' : ''}`}
                        style={{
                          fontSize: '0.78rem',
                          backgroundColor: s.verified ? 'var(--color-mist-light)' : '#f1f5f9',
                          border: '1px solid var(--color-border)',
                          color: '#0f172a',
                        }}
                      >
                        {s.verified && <span className="status-pill-dot" />}
                        {s.name}
                      </span>
                    ))}
                    {(editableResume?.skills?.soft || []).map((s, i) => (
                      <span
                        key={'soft-' + i}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#475569',
                        }}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Section 3: Featured Projects */}
                {editableResume?.projects && editableResume.projects.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Featured Projects & Applied Engineering
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {editableResume.projects.map((p, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{p.title}</strong>
                            {p.link && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)' }}>{p.link}</span>
                            )}
                          </div>
                          {p.techStack && p.techStack.length > 0 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600, margin: '2px 0 4px 0' }}>
                              Technologies: {p.techStack.join(', ')}
                            </div>
                          )}
                          {isEditMode ? (
                            <textarea
                              rows={2}
                              value={p.description || ''}
                              onChange={(e) => {
                                const updated = [...editableResume.projects];
                                updated[idx] = { ...updated[idx], description: e.target.value };
                                setEditableResume({ ...editableResume, projects: updated });
                              }}
                              style={{ width: '100%', padding: '6px', fontSize: '0.85rem', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                              {p.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Education */}
                {editableResume?.education && editableResume.education.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Education
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editableResume.education.map((e, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                              {e.degree}{e.branch ? ` in ${e.branch}` : ''}
                            </strong>
                            <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                              {e.institution} {e.score ? `• Score: ${e.score}` : ''}
                            </div>
                          </div>
                          {e.graduationYear && (
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Graduation: {e.graduationYear}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Certifications & Honors */}
                {editableResume?.certifications && editableResume.certifications.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '8px' }}>
                      Certifications & Credentials
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {editableResume.certifications.map((c, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: '#334155' }}>
                          <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                          {c.issuer ? <span style={{ color: '#64748b' }}> — {c.issuer}</span> : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Modal Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <button
                onClick={handleCopyResumeText}
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                {copiedResume ? 'Copied to Clipboard' : 'Copy Resume Text'}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="btn btn-primary"
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {downloadingPdf ? 'Preparing PDF...' : 'Download Formatted PDF'}
                </button>

                <button onClick={() => setResumeData(null)} className="btn btn-ghost" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Close
                </button>
              </div>
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
                <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Public Verified Share Card</h4>
                <span className="status-pill status-verified" style={{ fontSize: '11px' }}>
                  <span className="status-pill-dot" />
                  Live & Public
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
                className="btn btn-ghost"
                style={{ fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' }}
              >
                {copiedShareLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {/* Profile Overview Card */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>{shareData.user?.name}</h3>
                    <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize', marginTop: '4px' }}>
                      {shareData.user?.role || 'Student Candidate'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Profile Completeness</div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{shareData.summary?.completeness || 0}%</strong>
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
                        <span key={i} className="status-pill status-verified" style={{ fontSize: '11px' }}>
                          <span className="status-pill-dot" />
                          {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Public Items List */}
              <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
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
                          <strong style={{ fontSize: 'var(--font-size-sm)' }}>{item.title}</strong>
                          <span className="badge badge-sky" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{item.type}</span>
                          {item.verificationStatus === 'verified' && (
                            <span className="status-pill status-verified" style={{ fontSize: '10px' }}>
                              <span className="status-pill-dot" />
                              Verified
                            </span>
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
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' },
  statCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel: { fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600' },
  statVal: { fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-family-display)' },
  toolbar: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)', minWidth: '140px', flex: '1 1 auto' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-3)' },
  itemCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  descText: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 'var(--space-2)' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' },
  link: { fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
  closeIcon: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--color-text-muted)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'clamp(8px, 2vw, 16px)' },
  modalCard: { maxWidth: '460px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  largeModalCard: { maxWidth: '840px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  resumeScrollArea: { overflowY: 'auto', flex: 1, paddingRight: '6px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'var(--space-2)' },
  label: { display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  input: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-app)' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default DigitalPortfolioView;
