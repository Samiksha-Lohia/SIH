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
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Loading placement pipeline and live internship opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>Error Loading Placement Funnel</h4>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={loadData} style={{ padding: '0.4rem 0.8rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  // Stages of standard recruitment pipeline
  const stages = [
    { key: 'applied', label: 'Applied', color: '#38bdf8', icon: '📥' },
    { key: 'under_review', label: 'Under Review', color: '#facc15', icon: '🔍' },
    { key: 'shortlisted', label: 'Shortlisted', color: '#a855f7', icon: '⭐' },
    { key: 'interview', label: 'Interview', color: '#ec4899', icon: '💬' },
    { key: 'selected', label: 'Selected / Placed', color: '#22c55e', icon: '🎉' },
    { key: 'rejected', label: 'Rejected', color: '#ef4444', icon: '❌' },
    { key: 'withdrawn', label: 'Withdrawn', color: '#64748b', icon: '↩️' }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Placement Funnel Section */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>🎯 Student Placement Funnel</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Real-time application transitions aggregated from institutional student applications.
            </p>
          </div>
          <div style={{ background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.85rem', color: '#38bdf8' }}>
            Total Pipeline Volume: <strong style={{ color: '#fff', fontSize: '1rem' }}>{totalApplications}</strong> applications
          </div>
        </div>

        {totalApplications === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#0f172a', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}>No student application movements recorded yet in the backend placement funnel.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
            {stages.map(st => {
              const count = funnel?.[st.key] || 0;
              const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
              return (
                <div key={st.key} style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center', borderTop: `4px solid ${st.color}` }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{st.icon}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{st.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0.25rem 0' }}>{count}</div>
                  <div style={{ fontSize: '0.75rem', color: st.color, fontWeight: 600 }}>{pct}% of pipeline</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Funnel Progress Bars */}
        {totalApplications > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pipeline Conversion Visualizer:</div>
            <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', background: '#0f172a' }}>
              {stages.map(st => {
                const count = funnel?.[st.key] || 0;
                if (count === 0) return null;
                const pct = (count / totalApplications) * 100;
                return (
                  <div
                    key={st.key}
                    title={`${st.label}: ${count} (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, background: st.color, transition: 'width 0.3s' }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem' }}>
              {stages.map(st => (
                <span key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color, display: 'inline-block' }}></span>
                  {st.label} ({funnel?.[st.key] || 0})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Internship Opportunities Marketplace Explorer */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>💼 Live Internship Opportunities Explorer</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Direct feed from industry employers targeting university students for internship programs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search internships, companies, skills..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', width: '240px' }}
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: '0.5rem 0.85rem', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px', fontSize: '0.85rem' }}
            >
              <option value="all">All Workplace Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
        </div>

        {filteredInternships.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', background: '#0f172a', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No internship opportunities found matching your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredInternships.map(opp => {
              const companyName = opp.company?.name || opp.companyName || 'Verified Employer';
              const location = opp.location || (opp.workplaceType ? opp.workplaceType.toUpperCase() : 'Remote');
              const stipend = opp.stipend ? (typeof opp.stipend === 'object' ? `${opp.stipend.amount || ''} ${opp.stipend.currency || 'INR'}` : opp.stipend) : 'Competitive';
              const skills = opp.skills || [];

              return (
                <div key={opp._id || opp.id} style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>{opp.title}</h4>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: opp.status === 'open' ? '#065f46' : '#334155', color: opp.status === 'open' ? '#34d399' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                        {opp.status || 'Active'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.35rem', fontWeight: 500 }}>
                      🏢 {companyName} • <span style={{ color: '#94a3b8' }}>📍 {location}</span>
                    </div>
                    {opp.description && (
                      <p style={{ margin: '0.75rem 0', fontSize: '0.8rem', color: '#94a3b8', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {opp.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {skills.slice(0, 4).map((sk, idx) => (
                        <span key={idx} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {typeof sk === 'string' ? sk : sk.name}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span style={{ color: '#64748b', fontSize: '0.75rem', alignSelf: 'center' }}>+{skills.length - 4} more</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #1e293b', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span>💰 Stipend: <strong style={{ color: '#34d399' }}>{stipend}</strong></span>
                      <span>Type: <strong style={{ color: '#f8fafc', textTransform: 'capitalize' }}>{opp.type || 'Internship'}</strong></span>
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
