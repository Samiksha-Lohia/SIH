import React, { useState, useEffect } from 'react';
import { facultyApi } from '../faculty.api.js';

export const ResearchCollaborationView = () => {
  const [researchOpps, setResearchOpps] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('research'); // 'research' | 'live_projects'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Proposal modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [proposalMsg, setProposalMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [appliedIds, setAppliedIds] = useState(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resData, projData] = await Promise.all([
        facultyApi.listAcademicOpportunities({ type: 'research_collaboration', limit: 20 }),
        facultyApi.listLiveProjects({ limit: 20 }),
      ]);
      const opps = resData.opportunities || [];
      setResearchOpps(opps);
      setLiveProjects(projData.projects || []);

      const alreadyApplied = new Set();
      for (const o of opps) {
        if (o.hasApplied || o.isInterested) {
          alreadyApplied.add(String(o.id || o._id));
        }
      }
      setAppliedIds((prev) => new Set([...prev, ...alreadyApplied]));
    } catch (err) {
      console.error('Failed to load collaborative projects:', err);
      setError(err.message || 'Failed to load collaborative research items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProposal = (item) => {
    setSelectedItem(item);
    setProposalMsg('');
    setSubmitSuccess('');
    setSubmitError('');
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      setSubmitError('');
      const id = selectedItem.id || selectedItem._id;
      await facultyApi.expressInterest(id, proposalMsg.trim() || 'Collaborative research proposal submitted by faculty.');
      
      // Immediately mark as applied in local state
      setAppliedIds((prev) => new Set(prev).add(String(id)));
      setResearchOpps((prev) =>
        prev.map((o) =>
          String(o.id || o._id) === String(id) ? { ...o, hasApplied: true, isInterested: true } : o
        )
      );

      setSubmitSuccess('Your research proposal has been recorded successfully! This opportunity is now marked as Applied.');
      setTimeout(() => {
        setSelectedItem(null);
      }, 1500);
    } catch (err) {
      console.error('Proposal submission failed:', err);
      setSubmitError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              Research Collaboration & Live Industry Projects
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Join sponsored academic research initiatives, co-author publications, and advise live industry capstone projects.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="b2b-tab-bar" style={{ margin: 0 }}>
          <button
            onClick={() => setActiveTab('research')}
            className={`b2b-tab ${activeTab === 'research' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            Joint Research Proposals ({researchOpps.length})
          </button>
          <button
            onClick={() => setActiveTab('live_projects')}
            className={`b2b-tab ${activeTab === 'live_projects' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            Live Industry Projects ({liveProjects.length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Querying collaborative research registries and industry capstone postings...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '6px',
            color: '#dc2626',
          }}
        >
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>Error Loading Collaborations</h4>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div>
          {activeTab === 'research' ? (
            <div>
              {researchOpps.length === 0 ? (
                <div
                  style={{
                    padding: '3.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                    borderRadius: '6px',
                    border: '1px dashed var(--color-taupe-grey, #A79E9C)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No research collaboration proposals currently posted.</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Proposals created by partner universities and corporate R&D labs will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                  {researchOpps.map((opp) => {
                    const id = opp.id || opp._id;
                    const isApplied = !!(opp.hasApplied || opp.isInterested || appliedIds.has(String(id)));
                    return (
                      <div
                        key={id}
                        className="card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          borderColor: isApplied ? '#10b981' : undefined,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                                  color: 'var(--color-caramel, #B58863)',
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                }}
                              >
                                R&D Collaboration
                              </span>
                              {isApplied && (
                                <span className="status-pill status-verified" style={{ fontSize: '0.7rem' }}>
                                  <span className="status-pill-dot" />
                                  Applied
                                </span>
                              )}
                            </div>
                            {opp.mode && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opp.mode}</span>}
                          </div>
                          <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>{opp.title}</h4>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                            {opp.providerName || 'Partner Lab'} {opp.location && `&middot; ${opp.location}`}
                          </div>
                          {opp.description && (
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {opp.description}
                            </p>
                          )}
                          {(opp.areas || []).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {opp.areas.map((ar, i) => (
                                <span
                                  key={i}
                                  style={{
                                    backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                                    border: '1px solid var(--color-taupe-grey, #A79E9C)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {ar}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {opp.honorarium ? `₹${opp.honorarium.toLocaleString()} Grant` : 'Grant Supported'}
                          </span>
                          {isApplied ? (
                            <button
                              disabled={true}
                              className="btn-outline"
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.75rem',
                                cursor: 'default',
                                color: '#065f46',
                                borderColor: '#10b981',
                              }}
                            >
                              ✓ Applied
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenProposal(opp)}
                              className="btn-primary"
                              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                            >
                              Submit Proposal
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {liveProjects.length === 0 ? (
                <div
                  style={{
                    padding: '3.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                    borderRadius: '6px',
                    border: '1px dashed var(--color-taupe-grey, #A79E9C)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No active live industry projects found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                  {liveProjects.map((proj) => {
                    const id = proj.id || proj._id;
                    const skills = proj.requiredSkills || [];

                    return (
                      <div
                        key={id}
                        className="card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <span
                              style={{
                                backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                                color: 'var(--color-caramel, #B58863)',
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                              }}
                            >
                              Industry Capstone
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{proj.workMode}</span>
                          </div>
                          <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>{proj.title}</h4>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                            {proj.companyName || 'Industry Partner'} {proj.location && `&middot; ${proj.location}`}
                          </div>
                          {proj.description && (
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {proj.description}
                            </p>
                          )}
                          {skills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {skills.map((s, i) => (
                                <span
                                  key={i}
                                  style={{
                                    backgroundColor: 'var(--color-sand-light, #D3C3B9)',
                                    border: '1px solid var(--color-taupe-grey, #A79E9C)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {typeof s === 'string' ? s : s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-taupe-grey, #A79E9C)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {proj.openings || 1} Student Team Slots
                          </span>
                          <span className="status-pill status-pending" style={{ fontSize: '0.7rem' }}>
                            <span className="status-pill-dot" />
                            Advisory Open
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Proposal Modal */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 'min(95vw, 540px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: 'var(--color-bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                Submit Research Collaboration Proposal
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Target Opportunity: <strong style={{ color: 'var(--text-main)' }}>{selectedItem.title}</strong>
              {selectedItem.providerName && ` (${selectedItem.providerName})`}
            </p>

            {(() => {
              const oppId = selectedItem.id || selectedItem._id;
              const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedItem.hasApplied || selectedItem.isInterested));
              if (!isModalOppApplied) return null;
              return (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    color: '#065f46',
                    marginBottom: '1rem',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>✓</span>
                  <span>You have already submitted a proposal for this collaboration project.</span>
                </div>
              );
            })()}

            {submitError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '6px',
                  color: '#dc2626',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  color: '#065f46',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                ✓ {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitProposal}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                Research Proposal Outline & Methodology
              </label>
              <textarea
                rows={4}
                required
                placeholder="Outline your research approach, expected deliverables, and how your lab can collaborate..."
                value={proposalMsg}
                onChange={(e) => setProposalMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--color-taupe-grey, #A79E9C)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                {(() => {
                  const oppId = selectedItem?.id || selectedItem?._id;
                  const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedItem?.hasApplied || selectedItem?.isInterested));
                  return (
                    <button
                      type="submit"
                      disabled={submitting || !proposalMsg.trim() || isModalOppApplied}
                      className="btn-primary"
                    >
                      {isModalOppApplied
                        ? '✓ Already Applied'
                        : submitting
                        ? 'Submitting...'
                        : 'Submit Proposal'}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchCollaborationView;
