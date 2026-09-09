import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

export const CandidateRecommendationsView = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState(null);

  // Load company's opportunities to populate selector
  const loadOpportunities = async () => {
    try {
      setLoadingOpps(true);
      setError(null);
      const res = await industryApi.listMyOpportunities({ limit: 50 });
      const opps = res.opportunities || [];
      setOpportunities(opps);
      if (opps.length > 0) {
        // Pick the first published or any opportunity by default
        const active = opps.find((o) => o.status === 'published') || opps[0];
        const id = active.id || active._id;
        setSelectedOppId(id);
      }
    } catch (err) {
      console.error('Failed to load opportunities for matching:', err);
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoadingOpps(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  // Fetch match recommendations when selected opportunity changes
  const fetchRecommendations = async (oppId) => {
    if (!oppId) return;
    try {
      setLoadingCandidates(true);
      setError(null);
      const res = await industryApi.matchCandidates(oppId, 20);
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error('Failed to match candidates:', err);
      setError(err.message || 'Failed to generate candidate recommendations');
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (selectedOppId) {
      fetchRecommendations(selectedOppId);
    }
  }, [selectedOppId]);

  if (loadingOpps) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading enterprise opportunities for candidate alignment...</p>
      </div>
    );
  }

  const selectedOpp = opportunities.find((o) => (o.id || o._id) === selectedOppId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Opportunity Selector Bar */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              🎯 AI Candidate Recommendation Feed
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Explainable multi-dimensional candidate matching powered by SUTRA's deterministic matching engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Target Posting:</label>
            {opportunities.length === 0 ? (
              <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>No opportunities posted yet</span>
            ) : (
              <select
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                style={{
                  padding: '0.55rem 1rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  maxWidth: '320px',
                }}
              >
                {opportunities.map((opp) => {
                  const id = opp.id || opp._id;
                  return (
                    <option key={id} value={id}>
                      {opp.title} ({opp.status?.toUpperCase()})
                    </option>
                  );
                })}
              </select>
            )}
            <button
              onClick={() => fetchRecommendations(selectedOppId)}
              disabled={loadingCandidates || !selectedOppId}
              style={{
                padding: '0.55rem 1rem',
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: loadingCandidates || !selectedOppId ? 'not-allowed' : 'pointer',
                opacity: loadingCandidates || !selectedOppId ? 0.6 : 1,
              }}
            >
              {loadingCandidates ? 'Matching...' : 'Re-run Matching'}
            </button>
          </div>
        </div>

        {selectedOpp && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Type: <strong style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{selectedOpp.type}</strong></span>
            <span>Work Mode: <strong style={{ color: '#cbd5e1', textTransform: 'uppercase' }}>{selectedOpp.workMode}</strong></span>
            <span>Openings: <strong style={{ color: '#38bdf8' }}>{selectedOpp.openings || 1}</strong></span>
            <span>Skills Configured: <strong style={{ color: '#34d399' }}>{(selectedOpp.requiredSkills || []).length} required</strong>, {(selectedOpp.preferredSkills || []).length} preferred</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Matching Error</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Candidates Feed */}
      {loadingCandidates && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Running multi-factor compatibility algorithms across student talent pool...</p>
        </div>
      )}

      {!loadingCandidates && !error && (
        <div>
          {candidates.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>No matched candidates returned by backend engine for this opportunity.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Try refining required skills or lowering proficiency constraints in the posting.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Showing <strong>{candidates.length}</strong> top-ranked candidate profiles evaluated by SUTRA engine:
              </div>

              {candidates.map((item, idx) => {
                const cand = item.candidate || {};
                const score = item.score || 0;
                const breakdown = item.breakdown || {};
                const matched = item.matchedSkills || [];
                const missing = item.missingSkills || [];

                return (
                  <div
                    key={cand.userId || idx}
                    style={{
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                    }}
                  >
                    {/* Candidate Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                            {cand.name || 'Anonymous Student'}
                          </span>
                          <span style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                            ✉️ {cand.email || 'Confidential'}
                          </span>
                          <span style={{ background: '#065f46', color: '#34d399', fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 600 }}>
                            {cand.completeness || 100}% Profile Complete
                          </span>
                          {item.eligibilityOk && (
                            <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 600 }}>
                              ✓ Eligibility Met
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                          Candidate UID: <code>{cand.userId}</code>
                        </div>
                      </div>

                      {/* Overall Score Badge */}
                      <div
                        style={{
                          background: '#0f172a',
                          padding: '0.75rem 1.25rem',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                          textAlign: 'center',
                          minWidth: '130px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Match Score
                        </div>
                        <div
                          style={{
                            fontSize: '1.85rem',
                            fontWeight: 800,
                            color: score >= 75 ? '#34d399' : score >= 50 ? '#38bdf8' : '#facc15',
                          }}
                        >
                          {score}%
                        </div>
                      </div>
                    </div>

                    {/* Deterministic Explanation from Backend */}
                    {item.explanation && (
                      <div style={{ background: '#0f172a', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        💡 <strong style={{ color: '#e2e8f0', fontStyle: 'normal' }}>Engine Explanation:</strong> {item.explanation}
                      </div>
                    )}

                    {/* Explainable Factor Breakdown (Live Backend Breakdown Fields) */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Factor-Wise Compatibility Breakdown:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {[
                          { label: 'Skill Compatibility (35%)', val: breakdown.skillCompatibility },
                          { label: 'Skill Proficiency (20%)', val: breakdown.skillProficiency },
                          { label: 'Education / CGPA (15%)', val: breakdown.education },
                          { label: 'Career Alignment (10%)', val: breakdown.careerInterest },
                          { label: 'Experience & Projects (10%)', val: breakdown.experience },
                          { label: 'Location & Work Mode (5%)', val: breakdown.location },
                          { label: 'Certifications (5%)', val: breakdown.certifications },
                        ].map((factor, fIdx) => (
                          <div key={fIdx} style={{ background: '#0f172a', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', color: '#94a3b8' }}>
                              <span>{factor.label}</span>
                              <strong style={{ color: (factor.val || 0) >= 70 ? '#34d399' : '#38bdf8' }}>{factor.val ?? 0}%</strong>
                            </div>
                            <div style={{ height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${factor.val || 0}%`,
                                  background: (factor.val || 0) >= 70 ? '#34d399' : '#38bdf8',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matched vs Missing Skills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, marginBottom: '0.4rem' }}>
                          ✓ Matched Skills ({matched.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {matched.map((sk, sIdx) => (
                            <span key={sIdx} style={{ background: '#064e3b', border: '1px solid #059669', color: '#a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {sk}
                            </span>
                          ))}
                          {matched.length === 0 && <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>None matched</span>}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.4rem' }}>
                          ⚠️ Missing / Unmet Skills ({missing.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {missing.map((sk, sIdx) => (
                            <span key={sIdx} style={{ background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {sk}
                            </span>
                          ))}
                          {missing.length === 0 && <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 500 }}>Full competency coverage</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateRecommendationsView;
