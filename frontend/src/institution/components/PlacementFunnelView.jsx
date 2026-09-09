import React, { useState, useEffect } from 'react';
import { institutionApi } from '../institution.api';

export const PlacementFunnelView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [internships, setInternships] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, internshipsRes] = await Promise.all([
        institutionApi.getInstitutionAnalytics(),
        institutionApi.listInternships({ page: 1, limit: 30 })
      ]);

      const analyticsData = analyticsRes.data || analyticsRes;
      setFunnel(analyticsData.placementFunnel || {});

      const rawInternships = internshipsRes.data || internshipsRes;
      setInternships(Array.isArray(rawInternships) ? rawInternships : rawInternships.items || []);
    } catch (err) {
      console.error('Failed to load placement data:', err);
      setError(err.message || 'Failed to load placement data from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Loading placement pipeline and live internship opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-danger)' }}>
        <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-danger)', fontSize: 'var(--font-size-md)' }}>Error Loading Placement Funnel</h4>
        <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        <button onClick={loadData} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>Retry</button>
      </div>
    );
  }

  // Stages of standard recruitment pipeline
  const stages = [
    { key: 'applied', label: 'Applied', color: 'var(--color-steel-blue)' },
    { key: 'under_review', label: 'Under Review', color: 'var(--color-amber)' },
    { key: 'shortlisted', label: 'Shortlisted', color: 'var(--color-sky-blue)' },
    { key: 'interview', label: 'Interview', color: 'var(--color-burgundy-red)' },
    { key: 'selected', label: 'Placed', color: 'var(--color-emerald)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--color-pebble-grey)' },
    { key: 'withdrawn', label: 'Withdrawn', color: 'var(--color-border)' }
  ];

  const totalApplications = Object.values(funnel || {}).reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);

  const filteredInternships = internships.filter(opp => {
    const matchesSearch = !searchTerm || 
      opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.skills?.some(s => (typeof s === 'string' ? s : s.name)?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || opp.workplaceType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Placement Funnel Section */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Student Placement Funnel
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Real-time application transitions aggregated from institutional student applications.
            </p>
          </div>
          <div style={{
            backgroundColor: 'var(--color-bg-app)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)'
          }}>
            Total Pipeline Volume: <strong style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>{totalApplications}</strong> applications
          </div>
        </div>

        {totalApplications === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)' }}>No student application movements recorded yet in the backend placement funnel.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
            {stages.map(st => {
              const count = funnel?.[st.key] || 0;
              const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
              return (
                <div
                  key={st.key}
                  style={{
                    backgroundColor: 'var(--color-bg-app)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                    borderTop: `3px solid ${st.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {pct}% of pipeline
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Funnel Progress Bars */}
        {totalApplications > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pipeline Conversion Distribution:
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-border)' }}>
              {stages.map(st => {
                const count = funnel?.[st.key] || 0;
                if (count === 0) return null;
                const pct = (count / totalApplications) * 100;
                return (
                  <div
                    key={st.key}
                    title={`${st.label}: ${count} (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, backgroundColor: st.color, transition: 'width 0.3s' }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: '11px' }}>
              {stages.map(st => (
                <span key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: st.color, display: 'inline-block' }} />
                  {st.label} ({funnel?.[st.key] || 0})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Internship Opportunities Marketplace Explorer */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Live Internship Opportunities Explorer
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Direct feed from industry employers targeting university students for internship programs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search internships, companies, skills..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                width: '240px'
              }}
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              <option value="all">All Workplace Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
        </div>

        {filteredInternships.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)' }}>No internship opportunities found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-3)' }}>
            {filteredInternships.map(opp => {
              const companyName = opp.company?.name || opp.companyName || 'Verified Employer';
              const location = opp.location || (opp.workplaceType ? opp.workplaceType.toUpperCase() : 'Remote');
              const stipend = opp.stipend ? (typeof opp.stipend === 'object' ? `${opp.stipend.amount || ''} ${opp.stipend.currency || 'INR'}` : opp.stipend) : 'Competitive';
              const skills = opp.skills || [];

              return (
                <div
                  key={opp._id || opp.id}
                  style={{
                    backgroundColor: 'var(--color-bg-app)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>{opp.title}</h4>
                      <span className={`status-pill ${opp.status === 'open' ? 'status-verified' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                        <span className="status-pill-dot" />
                        {opp.status || 'Active'}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      <strong style={{ color: 'var(--color-text)' }}>{companyName}</strong> • {location}
                    </div>
                    {opp.description && (
                      <p style={{ margin: 'var(--space-2) 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {opp.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-3)' }}>
                      {skills.slice(0, 4).map((sk, idx) => (
                        <span key={idx} className="badge badge-sky" style={{ fontSize: '10px' }}>
                          {typeof sk === 'string' ? sk : sk.name}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', alignSelf: 'center' }}>+{skills.length - 4}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      <span>Stipend: <strong style={{ color: 'var(--color-primary)' }}>{stipend}</strong></span>
                      <span style={{ textTransform: 'capitalize' }}>{opp.type || 'Internship'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
