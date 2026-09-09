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
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              🔬 Research Collaboration & Live Industry Projects
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Join sponsored academic research initiatives, co-author publications, and advise live industry capstone projects.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('research')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'research' ? '#38bdf8' : '#0f172a',
              color: activeTab === 'research' ? '#0f172a' : '#94a3b8',
              fontWeight: activeTab === 'research' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Joint Research Proposals ({researchOpps.length})
          </button>
          <button
            onClick={() => setActiveTab('live_projects')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'live_projects' ? '#38bdf8' : '#0f172a',
              color: activeTab === 'live_projects' ? '#0f172a' : '#94a3b8',
              fontWeight: activeTab === 'live_projects' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Live Industry Projects ({liveProjects.length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Querying collaborative research registries and industry capstone postings...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Error Loading Collaborations</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div>
          {activeTab === 'research' ? (
            <div>
              {researchOpps.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '1rem' }}>No research collaboration proposals currently posted.</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Proposals created by partner universities and corporate R&D labs will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {researchOpps.map((opp) => {
                    const id = opp.id || opp._id;
                    const isApplied = !!(opp.hasApplied || opp.isInterested || appliedIds.has(String(id)));
                    return (
                      <div key={id} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: isApplied ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ background: '#4338ca', color: '#c7d2fe', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                R&D Collaboration
                              </span>
                              {isApplied && (
                                <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                                  ✓ Applied
                                </span>
                              )}
                            </div>
                            {opp.mode && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📍 {opp.mode}</span>}
                          </div>
                          <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>{opp.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.6rem' }}>
                            🏛️ {opp.providerName || 'Partner Lab'} {opp.location && `• ${opp.location}`}
                          </div>
                          {opp.description && (
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {opp.description}
                            </p>
                          )}
                          {(opp.areas || []).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {opp.areas.map((ar, i) => (
                                <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                  {ar}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                            {opp.honorarium ? `₹${opp.honorarium.toLocaleString()} Grant` : 'Grant Supported'}
                          </span>
                          {isApplied ? (
                            <button
                              disabled={true}
                              style={{
                                padding: '0.4rem 0.9rem',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span>✓</span> Applied
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenProposal(opp)}
                              style={{ padding: '0.4rem 0.9rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Submit Proposal ↗
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
                <div style={{ padding: '3.5rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '1rem' }}>No active live industry projects found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {liveProjects.map((proj) => {
                    const id = proj.id || proj._id;
                    const skills = proj.requiredSkills || [];

                    return (
                      <div key={id} style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <span style={{ background: '#065f46', color: '#34d399', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                              Industry Capstone
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{proj.workMode}</span>
                          </div>
                          <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>{proj.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.6rem' }}>
                            🏢 {proj.companyName || 'Industry Partner'} {proj.location && `• ${proj.location}`}
                          </div>
                          {proj.description && (
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {proj.description}
                            </p>
                          )}
                          {skills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {skills.map((s, i) => (
                                <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                  {typeof s === 'string' ? s : s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {proj.openings || 1} Student Team Slots
                          </span>
                          <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                            Faculty Advisory Open
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                Submit Research Collaboration Proposal
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Initiative: <strong style={{ color: '#38bdf8' }}>{selectedItem.title}</strong>
            </p>

            {(() => {
              const oppId = selectedItem.id || selectedItem._id;
              const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedItem.hasApplied || selectedItem.isInterested));
              if (!isModalOppApplied) return null;
              return (
                <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '6px', color: '#4ade80', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>You have already submitted a proposal / applied for this research initiative.</span>
                </div>
              );
            })()}

            {submitError && (
              <div style={{ padding: '0.65rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div style={{ padding: '0.65rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '6px', color: '#a7f3d0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                ✓ {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitProposal}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Research Proposal Outline & Methodology
              </label>
              <textarea
                rows={4}
                required
                placeholder="Outline your research approach, expected deliverables, and how your lab can collaborate..."
                value={proposalMsg}
                onChange={(e) => setProposalMsg(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ padding: '0.5rem 1rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
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
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: isModalOppApplied ? 'rgba(34, 197, 94, 0.2)' : '#38bdf8',
                        color: isModalOppApplied ? '#4ade80' : '#0f172a',
                        border: isModalOppApplied ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: submitting || !proposalMsg.trim() || isModalOppApplied ? 'not-allowed' : 'pointer',
                        opacity: submitting || !proposalMsg.trim() || isModalOppApplied ? 0.6 : 1,
                      }}
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
