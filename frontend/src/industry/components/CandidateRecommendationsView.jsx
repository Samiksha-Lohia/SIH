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
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading enterprise opportunities for candidate alignment...</p>
      </div>
    );
  }

  const selectedOpp = opportunities.find((o) => (o.id || o._id) === selectedOppId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Top Opportunity Selector Bar */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
              AI Candidate Recommendation Feed
            </h3>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Explainable multi-dimensional candidate matching powered by SUTRA's deterministic matching engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Target Posting:</label>
            {opportunities.length === 0 ? (
              <span style={{ color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-xs)' }}>No opportunities posted yet</span>
            ) : (
              <select
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-bg-app)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--font-size-xs)',
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
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              {loadingCandidates ? 'Matching...' : 'Re-run Matching'}
            </button>
          </div>
        </div>

        {selectedOpp && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            <span>Type: <strong style={{ color: 'var(--color-text)', textTransform: 'capitalize' }}>{selectedOpp.type}</strong></span>
            <span>Work Mode: <strong style={{ color: 'var(--color-text)', textTransform: 'uppercase' }}>{selectedOpp.workMode || selectedOpp.workplaceType}</strong></span>
            <span>Openings: <strong style={{ color: 'var(--color-steel-blue)' }}>{selectedOpp.openings || 1}</strong></span>
            <span>Skills Configured: <strong style={{ color: 'var(--color-emerald)' }}>{(selectedOpp.requiredSkills || []).length} required</strong>, {(selectedOpp.preferredSkills || []).length} preferred</span>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-burgundy-red)' }}>
          <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-md)' }}>Matching Error</h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      )}

      {/* Candidates Feed */}
      {loadingCandidates && (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Running multi-factor compatibility algorithms across student talent pool...</p>
        </div>
      )}

      {!loadingCandidates && !error && (
        <div>
          {candidates.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>No matched candidates returned by backend engine for this opportunity.</p>
              <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Try refining required skills or lowering proficiency constraints in the posting.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
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
                    className="card"
                    style={{
                      padding: 'var(--space-6)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-4)',
                    }}
                  >
                    {/* Candidate Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {cand.name || 'Anonymous Student'}
                          </span>
                          <span className="badge badge-subtle" style={{ fontSize: '11px' }}>
                            {cand.email || 'Confidential'}
                          </span>
                          <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                            {cand.completeness || 100}% Profile Complete
                          </span>
                          {item.eligibilityOk && (
                            <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                              Eligibility Met
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                          Candidate UID: <code>{cand.userId}</code>
                        </div>
                      </div>

                      {/* Overall Score Badge */}
                      <div
                        style={{
                          background: 'var(--color-bg-app)',
                          padding: 'var(--space-2) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          textAlign: 'center',
                          minWidth: '110px',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          Match Score
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-xl)',
                            fontWeight: 800,
                            color: score >= 75 ? 'var(--color-emerald)' : score >= 50 ? 'var(--color-steel-blue)' : 'var(--color-amber)',
                          }}
                        >
                          {score}%
                        </div>
                      </div>
                    </div>

                    {/* Deterministic Explanation from Backend */}
                    {item.explanation && (
                      <div style={{ background: 'var(--color-bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        <strong style={{ color: 'var(--color-text)' }}>Engine Explanation:</strong> {item.explanation}
                      </div>
                    )}

                    {/* Explainable Factor Breakdown */}
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Factor-Wise Compatibility Breakdown:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 'var(--space-2)' }}>
                        {[
                          { label: 'Skill Match (35%)', val: breakdown.skillCompatibility },
                          { label: 'Proficiency (20%)', val: breakdown.skillProficiency },
                          { label: 'Education (15%)', val: breakdown.education },
                          { label: 'Career Focus (10%)', val: breakdown.careerInterest },
                          { label: 'Projects (10%)', val: breakdown.experience },
                          { label: 'Location (5%)', val: breakdown.location },
                          { label: 'Certs (5%)', val: breakdown.certifications },
                        ].map((factor, fIdx) => (
                          <div key={fIdx} style={{ background: 'var(--color-bg-app)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                              <span>{factor.label}</span>
                              <strong style={{ color: (factor.val || 0) >= 70 ? 'var(--color-emerald)' : 'var(--color-steel-blue)' }}>{factor.val ?? 0}%</strong>
                            </div>
                            <div style={{ height: '4px', background: 'var(--color-border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${factor.val || 0}%`,
                                  background: (factor.val || 0) >= 70 ? 'var(--color-emerald)' : 'var(--color-steel-blue)',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matched vs Missing Skills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-emerald)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                          Matched Skills ({matched.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                          {matched.map((sk, sIdx) => (
                            <span key={sIdx} className="badge badge-emerald" style={{ fontSize: '11px' }}>
                              {sk}
                            </span>
                          ))}
                          {matched.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontStyle: 'italic' }}>None matched</span>}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-burgundy-red)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                          Missing / Unmet Skills ({missing.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                          {missing.map((sk, sIdx) => (
                            <span key={sIdx} className="badge badge-danger" style={{ fontSize: '11px' }}>
                              {sk}
                            </span>
                          ))}
                          {missing.length === 0 && <span style={{ color: 'var(--color-emerald)', fontSize: '11px', fontWeight: 500 }}>Full competency coverage</span>}
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
