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
          className={`b2b-tab ${activeTab === 'cohort' ? 'active' : ''}`}
        >
          Cohort & Academic Funnel
        </button>
        <button
          onClick={() => setActiveTab('recruitment')}
          className={`b2b-tab ${activeTab === 'recruitment' ? 'active' : ''}`}
        >
          Industry & Recruitment Funnel
        </button>
        <button
          onClick={() => setActiveTab('demand')}
          className={`b2b-tab ${activeTab === 'demand' ? 'active' : ''}`}
        >
          Skill Demand Rankings
        </button>
      </div>

      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Aggregating platform metrics...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>{error}</p>
          <button onClick={loadAllAnalytics} className="btn btn-primary">Try Again</button>
        </div>
      ) : (
        <>
          {/* ---------------- Tab 1: Cohort Analytics ---------------- */}
          {activeTab === 'cohort' && cohortData && (
            <div style={styles.tabContent}>
              {/* Stat Cards Grid */}
              <div style={styles.statsGrid}>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Total Students</span>
                  <span className="b2b-kpi-value">{cohortData.totalStudents || 0}</span>
                  <span className="b2b-kpi-subtext">Enrolled in platform</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Assessed Candidates</span>
                  <span className="b2b-kpi-value">{cohortData.assessedStudents || 0}</span>
                  <span className="b2b-kpi-subtext">Completed 1+ tests</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Avg Assessment Score</span>
                  <span className="b2b-kpi-value" style={{ color: 'var(--color-burgundy-red)' }}>
                    {cohortData.averageAssessmentScore || 0}%
                  </span>
                  <span className="b2b-kpi-subtext">Platform benchmark</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Training Completions</span>
                  <span className="b2b-kpi-value">{cohortData.training?.completed || 0}</span>
                  <span className="b2b-kpi-subtext">{cohortData.training?.enrollments || 0} enrollments</span>
                </div>
              </div>

              {/* Placement & Readiness Grids */}
              <div style={styles.dualGrid}>
                <div className="card">
                  <h4 style={styles.cardHeading}>Placement Application Funnel</h4>
                  <div style={styles.funnelRows}>
                    {Object.entries(cohortData.placementFunnel || {}).map(([stage, count]) => {
                      const total = cohortData.totalStudents || 1;
                      const pct = Math.min(100, Math.round((count / total) * 100));
                      return (
                        <div key={stage} style={styles.proportionalRow}>
                          <div style={styles.rowLabelRow}>
                            <span style={styles.stageLabel}>{stage.replace('_', ' ')}</span>
                            <span style={styles.stageCount}>{count} ({pct}%)</span>
                          </div>
                          <div style={styles.barBg}>
                            <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: 'var(--color-steel-blue)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card">
                  <h4 style={styles.cardHeading}>Profile Readiness Distribution</h4>
                  <div style={styles.funnelRows}>
                    {Object.entries(cohortData.readinessDistribution || {}).map(([bucket, count]) => {
                      const total = cohortData.totalStudents || 1;
                      const pct = Math.min(100, Math.round((count / total) * 100));
                      return (
                        <div key={bucket} style={styles.proportionalRow}>
                          <div style={styles.rowLabelRow}>
                            <span style={styles.stageLabel}>Completeness {bucket}%</span>
                            <span style={styles.stageCount}>{count} ({pct}%)</span>
                          </div>
                          <div style={styles.barBg}>
                            <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: 'var(--color-burgundy-red)' }} />
                          </div>
                        </div>
                      );
                    })}
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
                        <strong>{b.branch}:</strong> <span>{b.count}</span>
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
              <div className="b2b-kpi-grid">
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Total Opportunities</span>
                  <span className="b2b-kpi-value">{industryData.totalOpportunities || 0}</span>
                  <span className="b2b-kpi-subtext">{industryData.activeOpportunities || 0} currently published</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Applications Received</span>
                  <span className="b2b-kpi-value">{industryData.applicationsReceived || 0}</span>
                  <span className="b2b-kpi-subtext">Across all active listings</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Avg Compatibility</span>
                  <span className="b2b-kpi-value" style={{ color: 'var(--color-primary)' }}>
                    {industryData.averageCompatibility || 0}%
                  </span>
                  <span className="b2b-kpi-subtext">Explainable match score</span>
                </div>
                <div className="b2b-kpi-tile">
                  <span className="b2b-kpi-label">Shortlist Conversion</span>
                  <span className="b2b-kpi-value">{industryData.shortlistRate || 0}%</span>
                  <span className="b2b-kpi-subtext">Candidate advancement</span>
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
                      <span style={{ fontWeight: '500' }}>{s.skill}</span>
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
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                  <h4 style={{ ...styles.cardHeading, marginBottom: '2px' }}>Industry Skill Demand Rankings</h4>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                    Ranked by frequency and importance weighting in currently published opportunities.
                  </p>
                </div>

                <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '70px' }}>Rank</th>
                        <th>Skill Name</th>
                        <th style={{ textAlign: 'right' }}>Opportunities Requesting</th>
                        <th style={{ textAlign: 'right' }}>Weighted Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skillDemand.map((s, idx) => (
                        <tr key={s.slug || idx}>
                          <td>
                            <span style={styles.rankBadge}>#{idx + 1}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--color-text-main)' }}>{s.name}</strong>
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.demand}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
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
  dualGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' },
  cardHeading: { fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: 'var(--space-3)' },
  funnelRows: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  proportionalRow: { display: 'flex', flexDirection: 'column', gap: '4px' },
  rowLabelRow: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' },
  stageLabel: { color: 'var(--color-text-secondary)', textTransform: 'capitalize' },
  stageCount: { fontWeight: '600', color: 'var(--color-text-main)', fontVariantNumeric: 'tabular-nums' },
  barBg: { height: '6px', backgroundColor: 'var(--color-mist-light)', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  chipsWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  distChip: { display: 'flex', alignItems: 'center', gap: '6px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-xs)' },
  pipelineGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' },
  pipelineCol: { padding: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-sm)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--color-border)' },
  pipelineStage: { fontSize: 'var(--font-size-xs)', textTransform: 'capitalize', color: 'var(--color-text-muted)', fontWeight: '500' },
  pipelineCount: { fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' },
  rankBadge: { display: 'inline-block', padding: '2px 6px', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '11px' },
  feedbackBox: { padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' },
  closeFeedback: { fontSize: '18px', cursor: 'pointer', color: 'inherit' },
};

export default PlatformAnalyticsView;
