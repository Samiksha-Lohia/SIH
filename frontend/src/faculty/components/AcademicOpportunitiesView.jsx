import React, { useState, useEffect } from 'react';
import { facultyApi } from '../faculty.api.js';

const TYPE_TABS = [
  { id: '', label: 'All Opportunities' },
  { id: 'faculty_internship', label: 'Faculty Internships' },
  { id: 'industrial_training', label: 'Industrial Training' },
  { id: 'fdp', label: 'FDPs' },
  { id: 'consultancy', label: 'Consultancy' },
  { id: 'guest_lecture', label: 'Guest Lectures' },
  { id: 'research_collaboration', label: 'Research Collaboration' },
];

export const AcademicOpportunitiesView = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedIds, setAppliedIds] = useState(new Set());

  // Interest Modal
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [interestMsg, setInterestMsg] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState('');
  const [interestError, setInterestError] = useState('');

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await facultyApi.listAcademicOpportunities({
        type: selectedType || undefined,
        q: searchQuery || undefined,
        page: currentPage,
        limit: 12,
      });
      const opps = res.opportunities || [];
      setOpportunities(opps);
      setMeta(res.meta);

      const alreadyApplied = new Set();
      for (const o of opps) {
        if (o.hasApplied || o.isInterested) {
          alreadyApplied.add(String(o.id || o._id));
        }
      }
      setAppliedIds((prev) => new Set([...prev, ...alreadyApplied]));
    } catch (err) {
      console.error('Failed to load academic opportunities:', err);
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOpportunities();
  };

  const handleOpenInterestModal = (opp) => {
    setSelectedOpp(opp);
    setInterestMsg('');
    setInterestSuccess('');
    setInterestError('');
  };

  const handleSendInterest = async (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    try {
      setSubmittingInterest(true);
      setInterestError('');
      const id = selectedOpp.id || selectedOpp._id;
      await facultyApi.expressInterest(id, interestMsg.trim() || 'I am interested in participating and collaborating in this academic opportunity.');
      
      // Immediately mark as applied in local state
      setAppliedIds((prev) => new Set(prev).add(String(id)));
      setOpportunities((prev) =>
        prev.map((o) =>
          String(o.id || o._id) === String(id) ? { ...o, hasApplied: true, isInterested: true } : o
        )
      );

      setInterestSuccess('Your expression of interest has been submitted successfully! This opportunity is now marked as Applied.');
      setTimeout(() => {
        setSelectedOpp(null);
      }, 1500);
    } catch (err) {
      console.error('Interest submission failed:', err);
      setInterestError(err.message || 'Could not submit interest.');
    } finally {
      setSubmittingInterest(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Controls Banner */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              🏛️ Academician Opportunities Marketplace
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Explore faculty internships, industrial immersion, FDPs, research consultancies, and guest speaking engagements.
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Search by title, domain areas, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '0.55rem 0.85rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            style={{ padding: '0.55rem 1.25rem', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Search
          </button>
        </form>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {TYPE_TABS.map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setSelectedType(tab.id); setCurrentPage(1); }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? '#38bdf8' : '#0f172a',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Querying institutional and industry academic postings...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Error Loading Postings</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Opportunities Grid */}
      {!loading && !error && (
        <div>
          {opportunities.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', color: '#64748b' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>No academician opportunities found matching this category or keyword.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Postings are created by verified industry recruiters and institutional administrators.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {opportunities.map((opp) => {
                const id = opp.id || opp._id;
                const isApplied = !!(opp.hasApplied || opp.isInterested || appliedIds.has(String(id)));
                const areas = opp.areas || [];
                const honorarium = opp.honorarium ? `₹${opp.honorarium.toLocaleString()}` : 'Honorarium / Grant-funded';

                return (
                  <div
                    key={id}
                    style={{
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: isApplied ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #334155',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                            {opp.type ? opp.type.replace('_', ' ') : 'Academic'}
                          </span>
                          {isApplied && (
                            <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                              ✓ Applied
                            </span>
                          )}
                        </div>
                        {opp.mode && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                            📍 {opp.mode}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600 }}>
                        {opp.title}
                      </h4>

                      <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.75rem' }}>
                        🏛️ {opp.providerName || 'Partner Organization'}
                        {opp.location && ` • ${opp.location}`}
                      </div>

                      {opp.description && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#94a3b8', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {opp.description}
                        </p>
                      )}

                      {/* Domain Areas */}
                      {areas.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                          {areas.map((ar, aIdx) => (
                            <span key={aIdx} style={{ background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {ar}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Remuneration:</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>{honorarium}</div>
                      </div>

                      {isApplied ? (
                        <button
                          disabled={true}
                          style={{
                            padding: '0.45rem 0.95rem',
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
                          onClick={() => handleOpenInterestModal(opp)}
                          style={{
                            padding: '0.45rem 0.95rem',
                            background: '#38bdf8',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Express Interest ↗
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} opportunities)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={{ padding: '0.35rem 0.75rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={{ padding: '0.35rem 0.75rem', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Express Interest Modal */}
      {selectedOpp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                Express Interest in Opportunity
              </h3>
              <button
                onClick={() => setSelectedOpp(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              Submitting interest for: <strong style={{ color: '#38bdf8' }}>{selectedOpp.title}</strong> ({selectedOpp.providerName})
            </p>

            {(() => {
              const oppId = selectedOpp.id || selectedOpp._id;
              const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedOpp.hasApplied || selectedOpp.isInterested));
              if (!isModalOppApplied) return null;
              return (
                <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '6px', color: '#4ade80', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✓</span>
                  <span>You have already expressed interest / applied for this opportunity.</span>
                </div>
              );
            })()}

            {interestError && (
              <div style={{ padding: '0.65rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '6px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {interestError}
              </div>
            )}

            {interestSuccess && (
              <div style={{ padding: '0.65rem', background: '#064e3b', border: '1px solid #059669', borderRadius: '6px', color: '#a7f3d0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                ✓ {interestSuccess}
              </div>
            )}

            <form onSubmit={handleSendInterest}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Proposal Note / Faculty Qualifications
              </label>
              <textarea
                rows={4}
                required
                placeholder="Briefly state your relevant domain expertise, availability, and proposal for this opportunity..."
                value={interestMsg}
                onChange={(e) => setInterestMsg(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOpp(null)}
                  style={{ padding: '0.5rem 1rem', background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                {(() => {
                  const oppId = selectedOpp?.id || selectedOpp?._id;
                  const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedOpp?.hasApplied || selectedOpp?.isInterested));
                  return (
                    <button
                      type="submit"
                      disabled={submittingInterest || !interestMsg.trim() || isModalOppApplied}
                      style={{
                        padding: '0.5rem 1.25rem',
                        background: isModalOppApplied ? 'rgba(34, 197, 94, 0.2)' : '#38bdf8',
                        color: isModalOppApplied ? '#4ade80' : '#0f172a',
                        border: isModalOppApplied ? '1px solid rgba(34, 197, 94, 0.4)' : 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: submittingInterest || !interestMsg.trim() || isModalOppApplied ? 'not-allowed' : 'pointer',
                        opacity: submittingInterest || !interestMsg.trim() || isModalOppApplied ? 0.6 : 1,
                      }}
                    >
                      {isModalOppApplied
                        ? '✓ Already Applied'
                        : submittingInterest
                        ? 'Submitting...'
                        : 'Send Proposal'}
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

export default AcademicOpportunitiesView;
