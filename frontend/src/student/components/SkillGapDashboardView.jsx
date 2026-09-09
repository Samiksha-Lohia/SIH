import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { studentApi } from '../student.api.js';

export function SkillGapDashboardView({ studentId }) {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [readinessData, setReadinessData] = useState(null);
  const [gapReport, setGapReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load available roles list first
  useEffect(() => {
    let isMounted = true;
    async function loadRoles() {
      try {
        const res = await studentApi.listRoles({ limit: 50 });
        if (isMounted) {
          const list = res.roles || res.items || [];
          setRoles(list);
          if (list.length > 0) {
            setSelectedRoleId(list[0].id || list[0]._id);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load taxonomy roles');
      }
    }
    loadRoles();
    return () => { isMounted = false; };
  }, []);

  const loadAnalysis = useCallback(async () => {
    const activeUserId = studentId || user?.id || user?._id;
    if (!activeUserId || !selectedRoleId) return;
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, gapsRes] = await Promise.all([
        studentApi.getReadiness(activeUserId, { roleId: selectedRoleId }),
        studentApi.getSkillGaps(activeUserId, { roleId: selectedRoleId }),
      ]);
      setReadinessData(readinessRes);
      setGapReport(gapsRes);
    } catch (err) {
      setError(err.message || 'Failed to compute skill-gap analysis');
    } finally {
      setLoading(false);
    }
  }, [studentId, user?.id, user?._id, selectedRoleId]);

  useEffect(() => {
    if (selectedRoleId) {
      loadAnalysis();
    }
  }, [selectedRoleId, loadAnalysis]);

  const formatSummaryText = (summary) => {
    if (!summary) {
      return 'Based on your verified competencies, here is your readiness evaluation and missing required skills.';
    }
    if (typeof summary === 'string') {
      return summary;
    }
    if (typeof summary === 'object') {
      const parts = [];
      if (summary.met !== undefined && summary.total !== undefined) {
        const pct = Math.round((summary.met / (summary.total || 1)) * 100);
        parts.push(`${summary.met} of ${summary.total} required competencies fulfilled (${pct}% coverage).`);
      }
      if (summary.critical > 0) {
        parts.push(`${summary.critical} critical skill gap${summary.critical > 1 ? 's' : ''} require targeted upskilling.`);
      } else if (summary.moderate > 0) {
        parts.push(`${summary.moderate} moderate competency gap${summary.moderate > 1 ? 's' : ''} to improve role alignment.`);
      } else if (summary.met === summary.total && summary.total > 0) {
        parts.push('Outstanding alignment with no critical competency gaps detected.');
      }
      return parts.join(' ') || 'Evaluation completed against role taxonomy.';
    }
    return String(summary);
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
      case 'missing':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'moderate':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'minor':
        return { backgroundColor: 'var(--color-sky-light)', color: 'var(--color-steel-dark)', border: '1px solid rgba(141, 161, 185, 0.3)' };
      case 'met':
      default:
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', border: '1px solid rgba(34, 197, 94, 0.3)' };
    }
  };

  const getReadinessColor = (score) => {
    if (score >= 80) return '#15803d'; // Green
    if (score >= 60) return '#b45309'; // Amber
    return '#b91c1c'; // Red
  };

  const getReadinessLabel = (score) => {
    if (score >= 85) return 'Industry Ready / High Employability';
    if (score >= 70) return 'Well Aligned / Candidate for Placement';
    if (score >= 50) return 'Developing Competencies / Moderate Gap';
    return 'Significant Skill Gap / Needs Upskilling';
  };

  return (
    <div style={styles.container}>
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={{ margin: 0 }}>Industry Readiness & Skill-Gap Matrix</h3>
          <p style={styles.description}>
            Real-time computed readiness algorithms evaluate your verified skills against industry role competency models.
          </p>
        </div>

        {/* Target Role Switcher */}
        <div style={styles.rolePicker}>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
            Evaluating Target Role:
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            style={styles.select}
          >
            {roles.map((r) => (
              <option key={r.id || r._id} value={r.id || r._id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.stateBox}>
          <div style={styles.spinner}></div>
          <p>Computing real-time gap analysis against target role...</p>
        </div>
      ) : error ? (
        <div style={styles.stateBox}>
          <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>{error}</p>
          <button onClick={loadAnalysis} className="btn btn-primary">Recalculate Analysis</button>
        </div>
      ) : readinessData ? (
        <>
          {/* Top KPI Metrics Grid */}
          <div className="b2b-kpi-grid">
            {/* Overall Readiness Tile */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={styles.kpiLabel}>Overall Readiness Index</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', fontFamily: 'var(--font-family-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-main)' }}>
                  {Math.round(readinessData.readiness || 0)}%
                </span>
                <span className="status-pill status-active" style={{ fontSize: '11px' }}>
                  <span className="status-pill-dot" />
                  {getReadinessLabel(readinessData.readiness || 0)}
                </span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'var(--color-mist-light)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ height: '100%', width: `${Math.round(readinessData.readiness || 0)}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {/* Evaluation Summary Tile */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                <div>
                  <span style={styles.kpiLabel}>Archetype Target Summary</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--color-text-main)' }}>
                    {readinessData.role?.title || 'Target Role'}
                  </h4>
                </div>
                <span className="badge badge-role" style={{ fontSize: '11px' }}>
                  Completeness: {readinessData.profileCompleteness || 0}%
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                {formatSummaryText(readinessData.summary)}
              </p>

              <div style={styles.statsRow}>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatVal}>{readinessData.topStrengths?.length || 0}</span>
                  <span style={styles.miniStatLabel}>Strong Competencies</span>
                </div>
                <div style={styles.miniStat}>
                  <span style={{ ...styles.miniStatVal, color: 'var(--color-primary)' }}>
                    {readinessData.criticalGaps?.length || 0}
                  </span>
                  <span style={styles.miniStatLabel}>Critical Gaps</span>
                </div>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatVal}>{readinessData.profileCompleteness || 0}%</span>
                  <span style={styles.miniStatLabel}>Profile Completeness</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown: Strengths vs Gaps */}
          <div style={styles.columnsGrid}>
            {/* Strengths Column */}
            <div className="card" style={styles.sectionCard}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>Validated Strengths</h4>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>Competencies meeting or exceeding target benchmarks</p>
              </div>

              {readinessData.topStrengths?.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                  No target role competencies fully matched yet. Update skills in your profile to improve alignment.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {readinessData.topStrengths?.map((item, idx) => (
                    <div key={idx} style={styles.strengthItem}>
                      <div>
                        <strong style={{ color: 'var(--color-text-main)' }}>{typeof item === 'string' ? item : item.skill}</strong>
                        {item.level && <span style={styles.levelTag}>• Level: {item.level}</span>}
                      </div>
                      <span className="status-pill status-verified" style={{ fontSize: '10px' }}>
                        <span className="status-pill-dot" />
                        Met
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critical Gaps Column */}
            <div className="card" style={styles.sectionCard}>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>Competency Gaps</h4>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>Missing or below required threshold</p>
              </div>

              {readinessData.criticalGaps?.length === 0 ? (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-mist-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-main)', fontWeight: '600', fontSize: 'var(--font-size-xs)' }}>All Required Competencies Met</span>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                    You fulfill the primary skill requirements for this position.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {readinessData.criticalGaps?.map((gap, idx) => (
                    <div key={idx} style={styles.gapItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-main)' }}>{gap.skill}</strong>
                        <span className="status-pill status-rejected" style={{ fontSize: '10px' }}>
                          <span className="status-pill-dot" />
                          {gap.severity || 'Gap'}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {gap.reason || 'Skill missing from profile or below required threshold.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full Gap Engine Table if present */}
          {gapReport?.gaps?.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <h5 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>Full Role Competency Alignment Matrix</h5>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>Weighted algorithmic comparison between profile assets and role taxonomy.</p>
              </div>
              <div className="data-table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Required Skill</th>
                      <th style={{ width: '80px' }}>Weight</th>
                      <th>Expected Level</th>
                      <th>Your Level</th>
                      <th>Gap Status</th>
                      <th>Engine Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapReport.gaps.map((g, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: 'var(--color-text-main)' }}>{g.skill}</strong></td>
                        <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{g.weight || 1}x</td>
                        <td><span className="badge" style={{ fontSize: '10px', backgroundColor: 'var(--color-mist-light)', border: '1px solid var(--color-border)' }}>{g.requiredLevel || 'intermediate'}</span></td>
                        <td>
                          {g.studentLevel ? (
                            <span className="badge badge-role" style={{ fontSize: '10px' }}>{g.studentLevel}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Not recorded</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${g.severity === 'critical' ? 'status-rejected' : g.severity === 'moderate' ? 'status-pending' : 'status-active'}`} style={{ fontSize: '10px' }}>
                            <span className="status-pill-dot" />
                            {g.severity}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--color-text-muted)', maxWidth: '280px' }}>
                          {g.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' },
  description: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' },
  rolePicker: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-surface)' },
  kpiLabel: { fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600', letterSpacing: '0.04em' },
  statsRow: { display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', flexWrap: 'wrap' },
  miniStat: { display: 'flex', flexDirection: 'column' },
  miniStatVal: { fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-text-main)', fontVariantNumeric: 'tabular-nums' },
  miniStatLabel: { fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  columnsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-3)' },
  sectionCard: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
  strengthItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)', fontSize: 'var(--font-size-xs)' },
  levelTag: { fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' },
  gapItem: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-mist-light)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default SkillGapDashboardView;
