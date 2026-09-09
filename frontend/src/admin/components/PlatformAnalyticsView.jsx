import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../admin.api.js';

export function PlatformAnalyticsView() {
  const [activeTab, setActiveTab] = useState('cohort'); // 'cohort' | 'recruitment' | 'demand'
  const [cohortData, setCohortData] = useState(null);
  const [industryData, setIndustryData] = useState(null);
  const [skillDemand, setSkillDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isRecomputing, setIsRecomputing] = useState(false);
  const [recomputeFeedback, setRecomputeFeedback] = useState(null);

  const loadAllAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inst, ind, demand] = await Promise.all([
        adminApi.getInstitutionAnalytics(),
        adminApi.getIndustryAnalytics(),
        adminApi.getSkillDemand(20),
      ]);
      setCohortData(inst);
      setIndustryData(ind);
      setSkillDemand(demand);
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAnalytics();
  }, [loadAllAnalytics]);

  const handleRecomputeDemand = async () => {
    setIsRecomputing(true);
    setRecomputeFeedback(null);
    try {
      const res = await adminApi.recomputeSkillDemand();
      setRecomputeFeedback({
        type: 'success',
        message: `Demand scores recomputed: ${res.updated} skills updated from ${res.evaluated} opportunities evaluated.`,
      });
      await loadAllAnalytics();
    } catch (err) {
      setRecomputeFeedback({ type: 'error', message: err.message || 'Failed to recompute scores' });
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3>Platform-Wide Analytics & Intelligence</h3>
          <p style={styles.description}>
            Live platform aggregates across student cohorts, recruitment funnels, and industry skill demand.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={handleRecomputeDemand}
            className="btn btn-outline"
            disabled={isRecomputing || loading}
            style={styles.actionBtn}
          >
            {isRecomputing ? 'Recomputing...' : '⚡ Recompute Skill Demand'}
          </button>
          <button onClick={loadAllAnalytics} className="btn btn-outline" style={styles.actionBtn}>
            Refresh Data
          </button>
        </div>
      </div>

      {recomputeFeedback && (
        <div style={{ ...styles.feedbackBox, backgroundColor: recomputeFeedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: recomputeFeedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)' }}>
          <span>{recomputeFeedback.message}</span>
          <button onClick={() => setRecomputeFeedback(null)} style={styles.closeFeedback}>×</button>
        </div>
      )}

      {/* View Switcher */}
      <div style={styles.subtabsBar}>
        <button
          onClick={() => setActiveTab('cohort')}
          style={{ ...styles.subtabBtn, ...(activeTab === 'cohort' ? styles.activeSubtab : {}) }}
        >
          Cohort & Academic Funnel
        </button>
        <button
          onClick={() => setActiveTab('recruitment')}
          style={{ ...styles.subtabBtn, ...(activeTab === 'recruitment' ? styles.activeSubtab : {}) }}
        >
          Industry & Recruitment Funnel
        </button>
        <button
          onClick={() => setActiveTab('demand')}
          style={{ ...styles.subtabBtn, ...(activeTab === 'demand' ? styles.activeSubtab : {}) }}
        >
          Skill Demand Rankings
        </button>
      </div>

      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Aggregating platform metrics...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button onClick={loadAllAnalytics} className="btn btn-primary">Try Again</button>
        </div>
      ) : (
        <>
          {/* ---------------- Tab 1: Cohort Analytics ---------------- */}
          {activeTab === 'cohort' && cohortData && (
            <div style={styles.tabContent}>
              {/* Stat Cards Grid */}
              <div style={styles.statsGrid}>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Total Students</span>
                  <strong style={styles.statVal}>{cohortData.totalStudents || 0}</strong>
                  <span style={styles.statSub}>Enrolled in platform</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Assessed Candidates</span>
                  <strong style={styles.statVal}>{cohortData.assessedStudents || 0}</strong>
                  <span style={styles.statSub}>Completed 1+ tests</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Avg Assessment Score</span>
                  <strong style={{ ...styles.statVal, color: 'var(--color-primary)' }}>
                    {cohortData.averageAssessmentScore || 0}%
                  </strong>
                  <span style={styles.statSub}>Platform benchmark</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Learning Program Completions</span>
                  <strong style={styles.statVal}>{cohortData.training?.completed || 0}</strong>
                  <span style={styles.statSub}>{cohortData.training?.enrollments || 0} total enrollments</span>
                </div>
              </div>

              {/* Placement & Readiness Grids */}
              <div style={styles.dualGrid}>
                <div className="card">
                  <h4 style={styles.cardHeading}>Placement Application Funnel</h4>
                  <div style={styles.funnelRows}>
                    {Object.entries(cohortData.placementFunnel || {}).map(([stage, count]) => (
                      <div key={stage} style={styles.funnelItem}>
                        <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{stage.replace('_', ' ')}</span>
                        <span className="badge badge-role">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h4 style={styles.cardHeading}>Profile Readiness Distribution</h4>
                  <div style={styles.funnelRows}>
                    {Object.entries(cohortData.readinessDistribution || {}).map(([bucket, count]) => (
                      <div key={bucket} style={styles.funnelItem}>
                        <span>Completeness {bucket}%</span>
                        <strong style={{ color: 'var(--color-steel-dark)' }}>{count} students</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Branch & Skill Distribution */}
              <div style={styles.dualGrid}>
                <div className="card">
                  <h4 style={styles.cardHeading}>Top Student Branches</h4>
                  <div style={styles.chipsWrap}>
                    {(cohortData.branchDistribution || []).map((b) => (
                      <div key={b.branch} style={styles.distChip}>
                        <strong>{b.branch}:</strong> {b.count}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h4 style={styles.cardHeading}>Most Common Competencies</h4>
                  <div style={styles.chipsWrap}>
                    {(cohortData.skillDistribution || []).map((s) => (
                      <div key={s.skill} style={styles.distChip}>
                        <span>{s.skill}</span>
                        <span className="badge badge-role" style={{ fontSize: '10px' }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Tab 2: Recruitment Analytics ---------------- */}
          {activeTab === 'recruitment' && industryData && (
            <div style={styles.tabContent}>
              <div style={styles.statsGrid}>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Total Opportunities</span>
                  <strong style={styles.statVal}>{industryData.totalOpportunities || 0}</strong>
                  <span style={styles.statSub}>{industryData.activeOpportunities || 0} currently published</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Applications Received</span>
                  <strong style={styles.statVal}>{industryData.applicationsReceived || 0}</strong>
                  <span style={styles.statSub}>Across all listings</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Average Compatibility</span>
                  <strong style={{ ...styles.statVal, color: 'var(--color-primary)' }}>
                    {industryData.averageCompatibility || 0}%
                  </strong>
                  <span style={styles.statSub}>Explainable match average</span>
                </div>
                <div className="card" style={styles.statCard}>
                  <span style={styles.statLabel}>Shortlist Conversion Rate</span>
                  <strong style={styles.statVal}>{industryData.shortlistRate || 0}%</strong>
                  <span style={styles.statSub}>Applications to interview</span>
                </div>
              </div>

              {/* Pipeline Breakdown */}
              <div className="card">
                <h4 style={styles.cardHeading}>Recruiter Application Pipeline</h4>
                <div style={styles.pipelineGrid}>
                  {Object.entries(industryData.pipeline || {}).map(([stage, count]) => (
                    <div key={stage} style={styles.pipelineCol}>
                      <span style={styles.pipelineStage}>{stage.replace('_', ' ')}</span>
                      <strong style={styles.pipelineCount}>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Applicant Skills */}
              <div className="card">
                <h4 style={styles.cardHeading}>Top Skills Found in Applicant Pool</h4>
                <div style={styles.chipsWrap}>
                  {(industryData.topCandidateSkills || []).map((s) => (
                    <div key={s.skill} style={styles.distChip}>
                      <span>{s.skill}</span>
                      <span className="badge badge-role" style={{ fontSize: '10px' }}>{s.count} candidates</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Tab 3: Demand Rankings ---------------- */}
          {activeTab === 'demand' && (
            <div style={styles.tabContent}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h4 style={styles.cardHeading}>Industry Skill Demand Rankings</h4>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Ranked by frequency and importance weighting in currently published opportunities.
                    </p>
                  </div>
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Skill Name</th>
                        <th style={styles.th}>Opportunities Requesting</th>
                        <th style={styles.th}>Weighted Demand Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillDemand.map((s, idx) => (
                        <tr key={s.slug || idx} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.rankBadge}>#{idx + 1}</span>
                          </td>
                          <td style={styles.td}>
                            <strong>{s.name}</strong>
                          </td>
                          <td style={styles.td}>{s.demand}</td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                              {s.weightedDemand}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  actionBtn: { fontSize: 'var(--font-size-xs)' },
  subtabsBar: { display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' },
  subtabBtn: { padding: 'var(--space-2) var(--space-4)', borderBottom: '2px solid transparent', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: 'var(--font-size-sm)', cursor: 'pointer', transition: 'all var(--transition-fast)' },
  activeSubtab: { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: '600' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' },
  statCard: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-4)' },
  statLabel: { fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', fontWeight: '600' },
  statVal: { fontSize: 'var(--font-size-3xl)', fontFamily: 'var(--font-family-display)', fontWeight: 'bold' },
  statSub: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' },
  dualGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' },
  cardHeading: { fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: 'var(--space-3)' },
  funnelRows: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  funnelItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)' },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  distChip: { display: 'flex', alignItems: 'center', gap: '6px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)' },
  pipelineGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' },
  pipelineCol: { padding: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-md)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' },
  pipelineStage: { fontSize: 'var(--font-size-xs)', textTransform: 'capitalize', color: 'var(--color-text-muted)' },
  pipelineCount: { fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' },
  th: { padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid var(--color-border-subtle)' },
  td: { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' },
  rankBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-sky-blue-light)', color: 'var(--color-steel-dark)', fontWeight: 'bold', fontSize: '11px' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
};

export default PlatformAnalyticsView;
