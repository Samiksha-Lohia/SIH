import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { studentApi } from '../student.api.js';

const OPPORTUNITY_TYPES = [
  { value: '', label: 'All Opportunity Types' },
  { value: 'internship', label: 'Internship' },
  { value: 'job', label: 'Full-time Job' },
  { value: 'live_project', label: 'Live Project' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'industrial_training', label: 'Industrial Training' },
];

const WORK_MODES = [
  { value: '', label: 'All Work Modes' },
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function OpportunityMarketplaceView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'matched'

  // Browse state
  const [opportunities, setOpportunities] = useState([]);
  const [matchedOpportunities, setMatchedOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Applications state (to mark opportunities already applied/withdrawn)
  const [myApplications, setMyApplications] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minStipend, setMinStipend] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Detail Modal
  const [detailOpp, setDetailOpp] = useState(null);

  // Apply Modal
  const [applyOpp, setApplyOpp] = useState(null);
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', coverLetter: '' });
  const [applying, setApplying] = useState(false);
  const [applyFeedback, setApplyFeedback] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await studentApi.listMyApplications({ limit: 100 });
      setMyApplications(res.applications || []);
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'browse') {
        const res = await studentApi.listOpportunities({
          q: searchQuery || undefined,
          type: typeFilter || undefined,
          workMode: workModeFilter || undefined,
          location: locationFilter || undefined,
          minStipend: minStipend || undefined,
          page,
          limit: 12,
        });
        setOpportunities(res.opportunities || []);
        setMeta(res.meta);
      } else {
        // AI Matched Opportunities
        const res = await studentApi.matchOpportunities({ limit: 12 });
        setMatchedOpportunities(res.matches || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, typeFilter, workModeFilter, locationFilter, minStipend, page]);

  useEffect(() => {
    fetchOpportunities();
    fetchApplications();
  }, [fetchOpportunities, fetchApplications]);

  // Create a fast lookup map for already applied opportunity IDs
  const appliedMap = useMemo(() => {
    const map = new Map();
    for (const app of myApplications) {
      const oppId = typeof app.opportunity === 'object'
        ? (app.opportunity?.id || app.opportunity?._id)
        : app.opportunity;
      if (oppId) {
        map.set(String(oppId), app);
      }
    }
    return map;
  }, [myApplications]);

  const getApplicationStatusInfo = (app) => {
    if (!app) return null;
    const st = String(app.status || 'applied').toLowerCase();
    if (st === 'withdrawn') {
      return {
        label: 'Withdrawn',
        badgeBg: '#f1f5f9',
        badgeColor: '#64748b',
        badgeBorder: '#cbd5e1',
        btnBg: '#f8fafc',
        btnColor: '#64748b',
        btnBorder: '#e2e8f0',
      };
    }
    // For applied or any other active statuses, mark as Applied
    return {
      label: 'Applied',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      badgeBorder: '#86efac',
      btnBg: '#f0fdf4',
      btnColor: '#166534',
      btnBorder: '#bbf7d0',
    };
  };

  const handleOpenApply = async (opp) => {
    let defaultResume = '';
    try {
      const p = await studentApi.getMyProfile();
      defaultResume = p?.profile?.portfolio?.resumeUrl || '';
    } catch {
      // ignore
    }
    setApplyOpp(opp);
    setApplyForm({ resumeUrl: defaultResume, coverLetter: '' });
    setApplyFeedback(null);
  };

  const handleApplySubmit = async () => {
    if (!applyOpp) return;
    setApplying(true);
    setApplyFeedback(null);
    try {
      const createdApp = await studentApi.applyToOpportunity(applyOpp.id, {
        resumeUrl: applyForm.resumeUrl || undefined,
        coverLetter: applyForm.coverLetter || undefined,
      });

      if (createdApp) {
        setMyApplications((prev) => [createdApp, ...prev]);
      } else {
        fetchApplications();
      }

      setApplyFeedback({
        type: 'success',
        message: `Application submitted successfully for "${applyOpp.title}"! You can track its progress under My Applications.`,
      });
      setApplyOpp(null);
    } catch (err) {
      setApplyFeedback({
        type: 'error',
        message: err.message || 'Failed to submit application. Please check requirements.',
      });
    } finally {
      setApplying(false);
    }
  };

  const formatStipend = (opp) => {
    if (!opp.stipend?.amount && !opp.salary?.min) return 'Unpaid / Experience';
    if (opp.stipend?.amount) {
      return `₹${opp.stipend.amount.toLocaleString()} / ${opp.stipend.period || 'mo'}`;
    }
    return `₹${opp.salary.min.toLocaleString()} - ₹${opp.salary.max?.toLocaleString()} LPA`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={{ margin: 0 }}>Opportunity Marketplace & Job Discovery</h3>
          <p style={styles.description}>
            Explore verified internships, jobs, and live projects aligned with your skill profile and readiness metrics.
          </p>
        </div>

        {myApplications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '12px' }}>
              ✓ {myApplications.length} Opportunities Tracked
            </span>
          </div>
        )}
      </div>

      {/* Application Feedback Banner */}
      {applyFeedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: applyFeedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: applyFeedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{applyFeedback.message}</span>
          <button onClick={() => setApplyFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* Tabs: Browse vs AI Matched */}
      <div style={styles.tabPillGroup}>
        <button
          onClick={() => { setActiveTab('browse'); setPage(1); }}
          style={{ ...styles.pillBtn, ...(activeTab === 'browse' ? styles.activePill : {}) }}
        >
          🔍 Browse All Opportunities
        </button>
        <button
          onClick={() => { setActiveTab('matched'); setPage(1); }}
          style={{ ...styles.pillBtn, ...(activeTab === 'matched' ? styles.activePill : {}) }}
        >
          ⚡ AI Matched Recommendations
        </button>
      </div>

      {/* Filter Toolbar (Only in Browse mode) */}
      {activeTab === 'browse' && (
        <div style={styles.filterBar}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search roles, tech stack, or companies..."
            style={styles.searchInput}
          />

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={styles.select}
          >
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={workModeFilter}
            onChange={(e) => { setWorkModeFilter(e.target.value); setPage(1); }}
            style={styles.select}
          >
            {WORK_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <input
            type="text"
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            placeholder="Location (e.g. Bangalore)"
            style={{ ...styles.input, maxWidth: '160px' }}
          />

          {(searchQuery || typeFilter || workModeFilter || locationFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                setWorkModeFilter('');
                setLocationFilter('');
                setPage(1);
              }}
              className="btn btn-outline"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>{activeTab === 'matched' ? 'Computing AI candidate matching matrix...' : 'Loading opportunities...'}</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={fetchOpportunities} className="btn btn-primary">Try Again</button>
        </div>
      ) : activeTab === 'browse' ? (
        opportunities.length === 0 ? (
          <div style={styles.stateBox}>
            <p style={{ color: 'var(--color-text-muted)' }}>No opportunities found matching your search and filter criteria.</p>
          </div>
        ) : (
          <div style={styles.cardGrid}>
            {opportunities.map((opp) => {
              const existingApp = appliedMap.get(String(opp.id || opp._id));
              const statusInfo = getApplicationStatusInfo(existingApp);

              return (
                <div
                  key={opp.id}
                  className="card"
                  style={{
                    ...styles.oppCard,
                    borderColor: statusInfo ? statusInfo.badgeBorder : 'var(--color-border)',
                    backgroundColor: statusInfo ? '#fcfdfd' : 'var(--color-bg-surface)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {opp.type?.replace('_', ' ')}
                        </span>
                        <span className="badge badge-mist" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {opp.workMode}
                        </span>
                      </div>

                      {statusInfo && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: statusInfo.badgeBg,
                            color: statusInfo.badgeColor,
                            border: `1px solid ${statusInfo.badgeBorder}`,
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      )}
                    </div>

                    <h4 style={{ color: 'var(--color-primary)', marginBottom: '2px' }}>{opp.title}</h4>
                    <div style={styles.companyName}>
                      🏢 {opp.companyName || opp.company?.companyName || 'Verified Recruiter'}
                    </div>

                    <div style={styles.metaRow}>
                      <span>📍 {opp.location || 'Remote'}</span>
                      <span>💰 {formatStipend(opp)}</span>
                    </div>

                    <p style={styles.oppDesc}>{opp.description}</p>

                    {opp.requiredSkills?.length > 0 && (
                      <div style={styles.skillChipsWrap}>
                        {opp.requiredSkills.slice(0, 4).map((s, idx) => (
                          <span key={idx} className="badge badge-mist" style={{ fontSize: '10px' }}>
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                        {opp.requiredSkills.length > 4 && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            +{opp.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      onClick={() => setDetailOpp(opp)}
                      className="btn btn-outline"
                      style={{ fontSize: 'var(--font-size-xs)', flex: 1 }}
                    >
                      View Details
                    </button>

                    {statusInfo ? (
                      <button
                        disabled
                        className="btn"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          flex: 1,
                          backgroundColor: statusInfo.btnBg,
                          color: statusInfo.btnColor,
                          border: `1px solid ${statusInfo.btnBorder}`,
                          cursor: 'default',
                          fontWeight: 600,
                        }}
                      >
                        {statusInfo.label}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenApply(opp)}
                        className="btn btn-primary"
                        style={{ fontSize: 'var(--font-size-xs)', flex: 1 }}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Matched Recommendations Tab */
        matchedOpportunities.length === 0 ? (
          <div style={styles.stateBox}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              No AI matching results generated yet. Complete more skills in your profile to trigger candidate alignment!
            </p>
          </div>
        ) : (
          <div style={styles.cardGrid}>
            {matchedOpportunities.map((matchItem) => {
              const opp = matchItem.opportunity;
              if (!opp) return null;
              const matchScore = Math.round(matchItem.score || 0);
              const existingApp = appliedMap.get(String(opp.id || opp._id));
              const statusInfo = getApplicationStatusInfo(existingApp);

              return (
                <div
                  key={opp.id}
                  className="card"
                  style={{
                    ...styles.oppCard,
                    borderColor: statusInfo ? statusInfo.badgeBorder : matchScore >= 75 ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: matchScore >= 80 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: matchScore >= 80 ? '#15803d' : '#b45309',
                          border: '1px solid currentColor',
                        }}
                      >
                        ⚡ {matchScore}% Match Index
                      </span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {statusInfo && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: statusInfo.badgeBg,
                              color: statusInfo.badgeColor,
                              border: `1px solid ${statusInfo.badgeBorder}`,
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        )}
                        <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {opp.type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--color-primary)', marginBottom: '2px' }}>{opp.title}</h4>
                    <div style={styles.companyName}>
                      🏢 {opp.companyName || opp.company?.companyName || 'Corporate Partner'}
                    </div>

                    <div style={styles.metaRow}>
                      <span>📍 {opp.location || 'Flexible'}</span>
                      <span>💰 {formatStipend(opp)}</span>
                    </div>

                    {/* Matched vs Missing Skills */}
                    <div style={{ margin: 'var(--space-2) 0', fontSize: '11px' }}>
                      {matchItem.matchedSkills?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ color: '#15803d', fontWeight: 'bold' }}>Matched:</span>
                          {matchItem.matchedSkills.map((ms, i) => (
                            <span key={i} className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#15803d', fontSize: '10px' }}>
                              ✓ {ms}
                            </span>
                          ))}
                        </div>
                      )}
                      {matchItem.missingSkills?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#b45309', fontWeight: 'bold' }}>Growth Gaps:</span>
                          {matchItem.missingSkills.map((ms, i) => (
                            <span key={i} className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', fontSize: '10px' }}>
                              • {ms}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      onClick={() => setDetailOpp(opp)}
                      className="btn btn-outline"
                      style={{ fontSize: 'var(--font-size-xs)', flex: 1 }}
                    >
                      View Details
                    </button>

                    {statusInfo ? (
                      <button
                        disabled
                        className="btn"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          flex: 1,
                          backgroundColor: statusInfo.btnBg,
                          color: statusInfo.btnColor,
                          border: `1px solid ${statusInfo.btnBorder}`,
                          cursor: 'default',
                          fontWeight: 600,
                        }}
                      >
                        {statusInfo.label}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenApply(opp)}
                        className="btn btn-primary"
                        style={{ fontSize: 'var(--font-size-xs)', flex: 1 }}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Pagination (Browse mode) */}
      {activeTab === 'browse' && meta && meta.totalPages > 1 && (
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
            Page {page} of {meta.totalPages} ({meta.total} positions)
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

      {/* Opportunity Detail Modal */}
      {detailOpp && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.largeModalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <div>
                <span className="badge badge-sky" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                  {detailOpp.type?.replace('_', ' ')}
                </span>
                <h3 style={{ color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>{detailOpp.title}</h3>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  🏢 {detailOpp.companyName || 'Verified Corporate Partner'} • 📍 {detailOpp.location || 'Remote'} ({detailOpp.workMode})
                </div>
              </div>
              <button onClick={() => setDetailOpp(null)} style={styles.closeIcon}>×</button>
            </div>

            {/* If applied / withdrawn banner */}
            {(() => {
              const existing = appliedMap.get(String(detailOpp.id || detailOpp._id));
              const sInfo = getApplicationStatusInfo(existing);
              if (!sInfo) return null;
              return (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: sInfo.btnBg,
                    color: sInfo.btnColor,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${sInfo.btnBorder}`,
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{sInfo.label === 'Withdrawn' ? 'ℹ' : '✓'}</span>
                  <span>
                    {sInfo.label === 'Withdrawn'
                      ? 'You previously applied for this position and withdrew your application.'
                      : 'You have already submitted an application for this opportunity.'}
                  </span>
                </div>
              );
            })()}

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-xs)' }}>
                <div>💰 <strong>Compensation:</strong> {formatStipend(detailOpp)}</div>
                <div>📅 <strong>Deadline:</strong> {detailOpp.deadline ? new Date(detailOpp.deadline).toLocaleDateString() : 'Rolling Application'}</div>
                <div>👥 <strong>Openings:</strong> {detailOpp.openings || 'Multiple Positions'}</div>
                <div>💼 <strong>Category:</strong> {detailOpp.category || 'Engineering'}</div>
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>Role Description</h5>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                  {detailOpp.description}
                </p>
              </div>

              {detailOpp.requiredSkills?.length > 0 && (
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <h5 style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)' }}>Required Technical Competencies</h5>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {detailOpp.requiredSkills.map((s, idx) => (
                      <span key={idx} className="badge badge-mist" style={{ fontSize: '11px' }}>
                        {typeof s === 'string' ? s : `${s.name} (${s.minimumProficiency || 'Intermediate'})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <button onClick={() => setDetailOpp(null)} className="btn btn-outline">
                Close
              </button>

              {(() => {
                const existing = appliedMap.get(String(detailOpp.id || detailOpp._id));
                const sInfo = getApplicationStatusInfo(existing);
                if (sInfo) {
                  return (
                    <button
                      disabled
                      className="btn"
                      style={{
                        backgroundColor: sInfo.btnBg,
                        color: sInfo.btnColor,
                        border: `1px solid ${sInfo.btnBorder}`,
                        cursor: 'default',
                        fontWeight: 600,
                      }}
                    >
                      {sInfo.label}
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      const o = detailOpp;
                      setDetailOpp(null);
                      handleOpenApply(o);
                    }}
                    className="btn btn-primary"
                  >
                    Apply to this Position
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyOpp && (
        <div style={styles.modalOverlay}>
          <div className="card" style={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4>Apply for {applyOpp.title}</h4>
              <button onClick={() => setApplyOpp(null)} style={styles.closeIcon}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Submitting your verified SUTRA skill profile and portfolio to <strong>{applyOpp.companyName || 'the recruiter'}</strong>.
              </div>

              <div>
                <label style={styles.label}>Resume URL (PDF / Cloud Link)</label>
                <input
                  type="text"
                  value={applyForm.resumeUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or LinkedIn / GitHub link"
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Statement of Interest / Cover Note</label>
                <textarea
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                  placeholder="Explain why you are an exceptional fit for this opening..."
                  style={{ ...styles.input, minHeight: '90px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button onClick={() => setApplyOpp(null)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleApplySubmit} disabled={applying} className="btn btn-primary">
                {applying ? 'Submitting Application...' : 'Confirm & Apply'}
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
  tabPillGroup: { display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' },
  pillBtn: { border: 'none', background: 'none', padding: '6px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 },
  activePill: { backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600 },
  filterBar: { display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: '1 1 200px', minWidth: '180px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  input: { width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-bg-surface)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' },
  oppCard: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  companyName: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' },
  oppDesc: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.4, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 'var(--space-2)' },
  skillChipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' },
  cardActions: { display: 'flex', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
  closeIcon: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--color-text-muted)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' },
  modalCard: { maxWidth: '480px', width: '100%' },
  largeModalCard: { maxWidth: '640px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  label: { display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  paginationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default OpportunityMarketplaceView;
