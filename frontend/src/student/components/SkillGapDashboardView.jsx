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
          <div style={styles.kpiGrid}>
            {/* Gauge Card */}
            <div className="card" style={{ ...styles.kpiCard, alignItems: 'center', textAlign: 'center' }}>
              <span style={styles.kpiLabel}>Overall Readiness Index</span>
              <div
                style={{
                  ...styles.scoreWheel,
                  borderColor: getReadinessColor(readinessData.readiness || 0),
                  color: getReadinessColor(readinessData.readiness || 0),
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'var(--font-family-display)' }}>
                  {Math.round(readinessData.readiness || 0)}%
                </span>
              </div>
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  marginTop: 'var(--space-2)',
                  backgroundColor: `${getReadinessColor(readinessData.readiness || 0)}20`,
                  color: getReadinessColor(readinessData.readiness || 0),
                }}
              >
                {getReadinessLabel(readinessData.readiness || 0)}
              </span>
            </div>

            {/* Evaluation Summary Card */}
            <div className="card" style={{ ...styles.kpiCard, flex: 2 }}>
              <span style={styles.kpiLabel}>Archetype Target Summary</span>
              <h4 style={{ color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>
                {readinessData.role?.title || 'Target Role'}
              </h4>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', lineHeight: 1.5 }}>
                {formatSummaryText(readinessData.summary)}
              </p>

              <div style={styles.statsRow}>
                <div style={styles.miniStat}>
                  <span style={styles.miniStatVal}>{readinessData.topStrengths?.length || 0}</span>
                  <span style={styles.miniStatLabel}>Strong Competencies</span>
                </div>
                <div style={styles.miniStat}>
                  <span style={{ ...styles.miniStatVal, color: '#b91c1c' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '18px' }}>💪</span>
                <h4 style={{ margin: 0 }}>Validated Strengths</h4>
              </div>

              {readinessData.topStrengths?.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No target role competencies fully matched yet. Update skills in your profile to improve alignment.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {readinessData.topStrengths?.map((item, idx) => (
                    <div key={idx} style={styles.strengthItem}>
                      <div>
                        <strong>{typeof item === 'string' ? item : item.skill}</strong>
                        {item.level && <span style={styles.levelTag}>• Level: {item.level}</span>}
                      </div>
                      <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', fontSize: '10px' }}>
                        ✓ Requirement Met
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critical Gaps Column */}
            <div className="card" style={styles.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <h4 style={{ margin: 0 }}>Critical Skill Gaps</h4>
              </div>

              {readinessData.criticalGaps?.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ color: '#15803d', fontWeight: 'bold' }}>All Required Competencies Met!</span>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    You fulfill the primary skill requirements for this position.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {readinessData.criticalGaps?.map((gap, idx) => (
                    <div key={idx} style={styles.gapItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{gap.skill}</strong>
                        <span className="badge" style={{ ...getSeverityStyle(gap.severity), fontSize: '10px', textTransform: 'capitalize' }}>
                          {gap.severity || 'Gap'}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
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
            <div className="card" style={{ marginTop: 'var(--space-4)' }}>
              <h5 style={{ marginBottom: 'var(--space-3)' }}>Full Role Competency Alignment Matrix</h5>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Required Skill</th>
                      <th style={styles.th}>Weight</th>
                      <th style={styles.th}>Expected Level</th>
                      <th style={styles.th}>Your Level</th>
                      <th style={styles.th}>Gap Severity</th>
                      <th style={styles.th}>Engine Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gapReport.gaps.map((g, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}><strong>{g.skill}</strong></td>
                        <td style={styles.td}>{g.weight || 1}x</td>
                        <td style={styles.td}><span className="badge badge-mist">{g.requiredLevel || 'intermediate'}</span></td>
                        <td style={styles.td}>
                          {g.studentLevel ? (
                            <span className="badge badge-sky">{g.studentLevel}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Not possessed</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span className="badge" style={{ ...getSeverityStyle(g.severity), fontSize: '10px', textTransform: 'capitalize' }}>
                            {g.severity}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
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
  rolePicker: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '240px' },
  select: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--color-bg-surface)' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' },
  kpiCard: { display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  kpiLabel: { fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: '600', letterSpacing: '0.04em' },
  scoreWheel: { width: '100px', height: '100px', borderRadius: '50%', border: '4px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'var(--space-2) 0' },
  statsRow: { display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--space-3)' },
  miniStat: { display: 'flex', flexDirection: 'column' },
  miniStatVal: { fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-primary)' },
  miniStatLabel: { fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  columnsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-3)' },
  sectionCard: { backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' },
  strengthItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.04)', fontSize: 'var(--font-size-xs)' },
  levelTag: { fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' },
  gapItem: { padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-app)' },
  tableWrapper: { overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-surface)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-size-sm)' },
  th: { padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-mist-light)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid var(--color-border-subtle)' },
  td: { padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default SkillGapDashboardView;
