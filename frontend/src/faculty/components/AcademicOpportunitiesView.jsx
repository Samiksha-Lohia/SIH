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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              Academician Opportunities Marketplace
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
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
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '0.55rem 0.85rem',
              border: '1px solid var(--color-pebble-grey, #BCBDB8)',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '0.55rem 1.25rem' }}
          >
            Search
          </button>
        </form>

        {/* Type Filter Tabs with mobile select fallback */}
        <div className="b2b-mobile-tab-nav" style={{ marginBottom: '0.5rem' }}>
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-pebble-grey, #BCBDB8)' }}
          >
            {TYPE_TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        <div className="b2b-tab-bar" style={{ margin: 0 }}>
          {TYPE_TABS.map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setSelectedType(tab.id); setCurrentPage(1); }}
                className={`b2b-tab ${isActive ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Querying institutional and industry academic postings...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(114, 16, 16, 0.08)',
            border: '1px solid rgba(114, 16, 16, 0.25)',
            borderRadius: '6px',
            color: 'var(--color-burgundy-red, #721010)',
          }}
        >
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>Error Loading Postings</h4>
          <p style={{ margin: 0, fontSize: '0.8125rem' }}>{error}</p>
        </div>
      )}

      {/* Opportunities Grid */}
      {!loading && !error && (
        <div>
          {opportunities.length === 0 ? (
            <div
              style={{
                padding: '3.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--color-mist-green, #E0E4DE)',
                borderRadius: '6px',
                border: '1px dashed var(--color-pebble-grey, #BCBDB8)',
                color: 'var(--text-muted)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No academician opportunities found matching this category or keyword.</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>Postings are created by verified industry recruiters and institutional administrators.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
              {opportunities.map((opp) => {
                const id = opp.id || opp._id;
                const isApplied = !!(opp.hasApplied || opp.isInterested || appliedIds.has(String(id)));
                const areas = opp.areas || [];
                const honorarium = opp.honorarium ? `₹${opp.honorarium.toLocaleString()}` : 'Honorarium / Grant-funded';

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              backgroundColor: 'var(--color-mist-green, #E0E4DE)',
                              color: 'var(--color-burgundy-red, #721010)',
                              fontSize: '0.7rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                            }}
                          >
                            {opp.type ? opp.type.replace('_', ' ') : 'Academic'}
                          </span>
                          {isApplied && (
                            <span className="status-pill status-verified" style={{ fontSize: '0.7rem' }}>
                              <span className="status-pill-dot" />
                              Applied
                            </span>
                          )}
                        </div>
                        {opp.mode && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {opp.mode}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0.35rem 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>
                        {opp.title}
                      </h4>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {opp.providerName || 'Partner Organization'}
                        {opp.location && ` &middot; ${opp.location}`}
                      </div>

                      {opp.description && (
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {opp.description}
                        </p>
                      )}

                      {/* Domain Areas */}
                      {areas.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                          {areas.map((ar, aIdx) => (
                            <span
                              key={aIdx}
                              style={{
                                backgroundColor: 'var(--color-mist-green, #E0E4DE)',
                                border: '1px solid var(--color-pebble-grey, #BCBDB8)',
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

                    <div style={{ borderTop: '1px solid var(--color-pebble-grey, #BCBDB8)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Remuneration:</div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>{honorarium}</div>
                      </div>

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
                          onClick={() => handleOpenInterestModal(opp)}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                        >
                          Express Interest
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Page {meta.page} of {meta.totalPages} ({meta.total} opportunities)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  Previous
                </button>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="btn-outline"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
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
              maxWidth: 'min(95vw, 500px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                Express Interest in Opportunity
              </h3>
              <button
                onClick={() => setSelectedOpp(null)}
                className="btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Submitting interest for: <strong style={{ color: 'var(--text-main)' }}>{selectedOpp.title}</strong> ({selectedOpp.providerName})
            </p>

            {(() => {
              const oppId = selectedOpp.id || selectedOpp._id;
              const isModalOppApplied = !!(oppId && (appliedIds.has(String(oppId)) || selectedOpp.hasApplied || selectedOpp.isInterested));
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
                  <span>You have already expressed interest / applied for this opportunity.</span>
                </div>
              );
            })()}

            {interestError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(114, 16, 16, 0.08)',
                  border: '1px solid rgba(114, 16, 16, 0.25)',
                  borderRadius: '6px',
                  color: 'var(--color-burgundy-red, #721010)',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                {interestError}
              </div>
            )}

            {interestSuccess && (
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
                ✓ {interestSuccess}
              </div>
            )}

            <form onSubmit={handleSendInterest}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                Proposal Note / Faculty Qualifications
              </label>
              <textarea
                rows={4}
                required
                placeholder="Briefly state your relevant domain expertise, availability, and proposal for this opportunity..."
                value={interestMsg}
                onChange={(e) => setInterestMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--color-pebble-grey, #BCBDB8)',
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
                  onClick={() => setSelectedOpp(null)}
                  className="btn-ghost"
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
                      className="btn-primary"
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
