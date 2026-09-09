import React, { useState, useEffect } from 'react';
import { industryApi } from '../industry.api.js';

export const RecruiterCockpitView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [marketSkills, setMarketSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsData, skillsData] = await Promise.all([
        industryApi.getIndustryAnalytics(),
        industryApi.getSkillDemand({ limit: 12 }),
      ]);
      setAnalytics(analyticsData);
      setMarketSkills(skillsData || []);
    } catch (err) {
      console.error('Failed to load industry analytics:', err);
      setError(err.message || 'Failed to fetch recruiter analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Compiling recruitment pipeline metrics and applicant intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>Error Loading Analytics</h4>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={loadAnalytics} style={{ padding: '0.4rem 0.8rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  const pipeline = analytics?.pipeline || {};
  const totalApps = analytics?.applicationsReceived || 0;

  const funnelStages = [
    { key: 'applied', label: 'Applied', color: '#38bdf8', icon: '📥' },
    { key: 'under_review', label: 'Under Review', color: '#facc15', icon: '🔍' },
    { key: 'shortlisted', label: 'Shortlisted', color: '#a855f7', icon: '⭐' },
    { key: 'interview', label: 'Interview', color: '#ec4899', icon: '💬' },
    { key: 'selected', label: 'Selected / Hired', color: '#22c55e', icon: '🎉' },
    { key: 'rejected', label: 'Rejected', color: '#ef4444', icon: '❌' },
    { key: 'withdrawn', label: 'Withdrawn', color: '#64748b', icon: '↩️' },
  ];

  const candidateSkills = analytics?.topCandidateSkills || [];
  const maxSkillCount = Math.max(...candidateSkills.map((s) => s.count || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active Postings</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>
            {analytics?.activeOpportunities || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {analytics?.totalOpportunities || 0} total postings recorded
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Applications Received</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
            {totalApps}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
            Live applicant pipeline volume
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Compatibility</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.25rem 0' }}>
            {analytics?.averageCompatibility || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Mean match score of applicants
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Shortlist Conversion</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7', margin: '0.25rem 0' }}>
            {analytics?.shortlistRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Shortlisted + interviewed + hired
          </div>
        </div>
      </div>

      {/* Applicant Hiring Funnel Visualizer */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              🎯 Recruitment Funnel Conversion
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Stage-wise progression of applicants across company opportunities.
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8', background: '#0f172a', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #334155' }}>
            Pipeline Volume: <strong>{totalApps}</strong>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {funnelStages.map((st) => {
            const count = pipeline[st.key] || 0;
            const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;

            return (
              <div
                key={st.key}
                style={{
                  background: '#0f172a',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  borderTop: `4px solid ${st.color}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{st.icon}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{st.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>{count}</div>
                <div style={{ fontSize: '0.75rem', color: st.color, fontWeight: 600 }}>{pct}% of pipeline</div>
              </div>
            );
          })}
        </div>

        {/* Funnel conversion bar */}
        {totalApps > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#0f172a' }}>
              {funnelStages.map((st) => {
                const count = pipeline[st.key] || 0;
                if (count === 0) return null;
                const pct = (count / totalApps) * 100;
                return (
                  <div
                    key={st.key}
                    title={`${st.label}: ${count} (${Math.round(pct)}%)`}
                    style={{ width: `${pct}%`, background: st.color }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Section: Top Candidate Skills & Platform Market Demand */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Top Candidate Skills among Applicants */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#f8fafc' }}>
            🎓 Top Verified Skills in Candidate Pool
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            Most prevalent technical competencies verified across applicants who applied to your postings.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {candidateSkills.map((sk) => {
              const pct = Math.round((sk.count / maxSkillCount) * 100);
              return (
                <div key={sk.skill} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{sk.skill}</span>
                    <span style={{ color: '#38bdf8' }}>{sk.count} candidate{sk.count === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#38bdf8', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
            {candidateSkills.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                No applicant skill distributions recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Platform-wide Skill Demand Insights */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#f8fafc' }}>
            📈 Platform Skill-Demand Benchmark
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            Highest demand competencies aggregated across all employer postings in SUTRA.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {marketSkills.map((sk) => (
              <div key={sk.slug || sk.name} style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{sk.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
                  Demand Score: <strong>{sk.weightedDemand || sk.demand}</strong>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  In {sk.demand} active postings
                </div>
              </div>
            ))}
            {marketSkills.length === 0 && (
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                No platform demand data available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCockpitView;
