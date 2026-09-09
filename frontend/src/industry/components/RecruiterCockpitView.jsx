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
      <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Compiling recruitment pipeline metrics and applicant intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-burgundy-red)' }}>
        <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-burgundy-red)', fontSize: 'var(--font-size-md)' }}>Error Loading Analytics</h4>
        <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        <button onClick={loadAnalytics} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>Retry</button>
      </div>
    );
  }

  const pipeline = analytics?.pipeline || {};
  const totalApps = analytics?.applicationsReceived || 0;

  const funnelStages = [
    { key: 'applied', label: 'Applied', color: 'var(--color-steel-blue)' },
    { key: 'under_review', label: 'Under Review', color: 'var(--color-amber)' },
    { key: 'shortlisted', label: 'Shortlisted', color: 'var(--color-sky-blue)' },
    { key: 'interview', label: 'Interview', color: 'var(--color-primary)' },
    { key: 'selected', label: 'Selected / Hired', color: 'var(--color-emerald)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--color-burgundy-red)' },
    { key: 'withdrawn', label: 'Withdrawn', color: 'var(--color-text-muted)' },
  ];

  const candidateSkills = analytics?.topCandidateSkills || [];
  const maxSkillCount = Math.max(...candidateSkills.map((s) => s.count || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* B2B KPI Cards Row */}
      <div className="b2b-kpi-grid">
        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Active Postings</div>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-steel-blue)' }}>
            {analytics?.activeOpportunities || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            {analytics?.totalOpportunities || 0} total postings recorded
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Applications Received</div>
          <div className="b2b-kpi-value">
            {totalApps}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-emerald)', marginTop: 'var(--space-1)' }}>
            Live applicant pipeline volume
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Avg Compatibility</div>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-emerald)' }}>
            {analytics?.averageCompatibility || 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Mean match score of applicants
          </div>
        </div>

        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Shortlist Conversion</div>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-primary)' }}>
            {analytics?.shortlistRate || 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            Shortlisted + interviewed + hired
          </div>
        </div>
      </div>

      {/* Applicant Hiring Funnel Visualizer */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Recruitment Funnel Conversion
            </h3>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Stage-wise progression of applicants across company opportunities.
            </p>
          </div>
          <span className="badge badge-sky" style={{ fontSize: 'var(--font-size-xs)' }}>
            Pipeline Volume: <strong>{totalApps}</strong>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
          {funnelStages.map((st) => {
            const count = pipeline[st.key] || 0;
            const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;

            return (
              <div
                key={st.key}
                style={{
                  background: 'var(--color-bg-app)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  borderTop: `3px solid ${st.color}`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{st.label}</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-text)', margin: 'var(--space-2) 0' }}>{count}</div>
                <div style={{ fontSize: '11px', color: st.color, fontWeight: 600 }}>{pct}% of pipeline</div>
              </div>
            );
          })}
        </div>

        {/* Funnel conversion bar */}
        {totalApps > 0 && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: 'var(--color-border-subtle)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--space-6)' }}>
        {/* Left: Top Candidate Skills among Applicants */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            Top Verified Skills in Candidate Pool
          </h3>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Most prevalent technical competencies verified across applicants who applied to your postings.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {candidateSkills.map((sk) => {
              const pct = Math.round((sk.count / maxSkillCount) * 100);
              return (
                <div key={sk.skill} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{sk.skill}</span>
                    <span style={{ color: 'var(--color-steel-blue)' }}>{sk.count} candidate{sk.count === 1 ? '' : 's'}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-steel-blue)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
            {candidateSkills.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontStyle: 'italic', margin: 0 }}>
                No applicant skill distributions recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right: Platform-wide Skill Demand Insights */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
            Platform Skill-Demand Benchmark
          </h3>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Highest demand competencies aggregated across all employer postings in SUTRA.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
            {marketSkills.map((sk) => (
              <div
                key={sk.slug || sk.name}
                style={{
                  background: 'var(--color-bg-app)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text)' }}>{sk.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-emerald)', marginTop: 'var(--space-1)' }}>
                  Demand Score: <strong>{sk.weightedDemand || sk.demand}</strong>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  In {sk.demand} active postings
                </div>
              </div>
            ))}
            {marketSkills.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontStyle: 'italic', margin: 0 }}>
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
