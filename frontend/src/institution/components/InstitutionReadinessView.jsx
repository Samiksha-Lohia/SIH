import React, { useState, useEffect } from 'react';
import { institutionApi } from '../institution.api.js';

export function InstitutionReadinessView() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportFeedback, setExportFeedback] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await institutionApi.getInstitutionAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch institutional readiness analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportCSV = () => {
    if (!analytics) return;
    try {
      const headers = ['Category', 'Metric', 'Value'];
      const rows = [
        ['Summary', 'Total Students', analytics.totalStudents || 0],
        ['Summary', 'Assessed Students', analytics.assessedStudents || 0],
        ['Summary', 'Average Assessment Score', `${analytics.averageAssessmentScore || 0}%`],
        ['Training', 'Enrollments', analytics.training?.enrollments || 0],
        ['Training', 'Completed', analytics.training?.completed || 0],
      ];

      const readiness = analytics.readinessDistribution || {};
      Object.entries(readiness).forEach(([bucket, count]) => {
        rows.push(['Readiness Bucket', `${bucket}%`, count]);
      });

      const branches = analytics.branchDistribution || [];
      branches.forEach((b) => {
        rows.push(['Department', b.branch || 'Unknown', b.count || 0]);
      });

      const funnel = analytics.placementFunnel || {};
      Object.entries(funnel).forEach(([stage, count]) => {
        rows.push(['Placement Funnel', stage.replace('_', ' ').toUpperCase(), count]);
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SUTRA_Institution_Readiness_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportFeedback({ type: 'success', message: 'Readiness report CSV exported successfully!' });
    } catch (err) {
      setExportFeedback({ type: 'error', message: 'CSV export failed: ' + err.message });
    }
  };

  const exportJSON = () => {
    if (!analytics) return;
    try {
      const jsonContent = JSON.stringify(analytics, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SUTRA_Institution_Analytics_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportFeedback({ type: 'success', message: 'Full analytics JSON exported successfully!' });
    } catch (err) {
      setExportFeedback({ type: 'error', message: 'JSON export failed: ' + err.message });
    }
  };

  if (loading) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.spinner} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Loading live placement readiness metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateBox}>
        <p style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>{error}</p>
        <button onClick={fetchAnalytics} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
          Retry Fetching Analytics
        </button>
      </div>
    );
  }

  const readiness = analytics?.readinessDistribution || {};
  const totalReadiness = Object.values(readiness).reduce((a, b) => a + b, 0) || 1;
  const training = analytics?.training || { enrollments: 0, completed: 0 };
  const trainingRate = training.enrollments ? Math.round((training.completed / training.enrollments) * 100) : 0;
  const assessedPercent = analytics?.totalStudents ? Math.round((analytics.assessedStudents / analytics.totalStudents) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Action Header */}
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.heading}>Placement Readiness Dashboard & Reports</h3>
          <p style={styles.subHeading}>
            Real-time institutional readiness indices, assessment benchmark distributions, and cohort training milestones.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} className="btn btn-outline" style={styles.actionBtn}>
            📥 Export CSV Report
          </button>
          <button onClick={exportJSON} className="btn btn-primary" style={styles.actionBtn}>
            📥 Export Full JSON
          </button>
        </div>
      </div>

      {/* Export Feedback Banner */}
      {exportFeedback && (
        <div
          style={{
            ...styles.feedbackBox,
            backgroundColor: exportFeedback.type === 'error' ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: exportFeedback.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          <span>{exportFeedback.message}</span>
          <button onClick={() => setExportFeedback(null)} style={styles.closeBtn}>×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiIcon}>👥</span>
          <div style={styles.kpiLabel}>Total Enrolled Students</div>
          <div style={styles.kpiValue}>{analytics?.totalStudents || 0}</div>
          <div style={styles.kpiMeta}>Platform-verified student profiles</div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiIcon}>🎯</span>
          <div style={styles.kpiLabel}>Assessed Students</div>
          <div style={styles.kpiValue}>{analytics?.assessedStudents || 0}</div>
          <div style={styles.kpiMeta}>{assessedPercent}% of student body tested</div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiIcon}>📈</span>
          <div style={styles.kpiLabel}>Average Assessment Score</div>
          <div style={styles.kpiValue}>{analytics?.averageAssessmentScore || 0}%</div>
          <div style={styles.kpiMeta}>Across technical and role evaluations</div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <span style={styles.kpiIcon}>🎓</span>
          <div style={styles.kpiLabel}>Upskilling Completion Rate</div>
          <div style={styles.kpiValue}>{trainingRate}%</div>
          <div style={styles.kpiMeta}>{training.completed} of {training.enrollments} completed</div>
        </div>
      </div>

      {/* Readiness Distribution Section */}
      <div className="card" style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h4 style={styles.cardTitle}>Student Placement Readiness Distribution</h4>
            <p style={styles.cardSub}>
              Based on profile completeness, demonstrated skills, verified certifications, and assessment scores.
            </p>
          </div>
          <span className="badge badge-sky">Live Metric</span>
        </div>

        <div style={styles.bucketGrid}>
          {[
            { bucket: '0-25', label: 'Early Stage (0 - 25%)', color: 'var(--color-pebble-grey)', count: readiness['0-25'] || 0 },
            { bucket: '26-50', label: 'Developing (26 - 50%)', color: 'var(--color-amber)', count: readiness['26-50'] || 0 },
            { bucket: '51-75', label: 'Progressing (51 - 75%)', color: 'var(--color-sky)', count: readiness['51-75'] || 0 },
            { bucket: '76-100', label: 'Industry-Ready (76 - 100%)', color: 'var(--color-emerald)', count: readiness['76-100'] || 0 },
          ].map((item) => {
            const percentage = Math.round((item.count / totalReadiness) * 100);
            return (
              <div key={item.bucket} style={styles.bucketCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 'var(--font-size-xs)' }}>{item.label}</strong>
                  <span style={{ fontSize: 'var(--font-size-md)', fontWeight: '700', color: item.color }}>
                    {item.count} <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>({percentage}%)</span>
                  </span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional Training & Learning Programs Status */}
      <div className="card" style={styles.card}>
        <h4 style={styles.cardTitle}>Skill Building & Curriculum Training Pipeline</h4>
        <p style={styles.cardSub}>
          Tracking student participation across institutional workshops and certified training modules.
        </p>

        <div style={styles.trainingMetricsRow}>
          <div style={styles.metricItem}>
            <span style={styles.metricItemLabel}>Active Enrollments</span>
            <span style={styles.metricItemValue}>{training.enrollments}</span>
          </div>
          <div style={styles.metricItem}>
            <span style={styles.metricItemLabel}>Graduated / Completed</span>
            <span style={styles.metricItemValue}>{training.completed}</span>
          </div>
          <div style={styles.metricItem}>
            <span style={styles.metricItemLabel}>In-Progress Learners</span>
            <span style={styles.metricItemValue}>
              {Math.max(0, training.enrollments - training.completed)}
            </span>
          </div>
          <div style={styles.metricItem}>
            <span style={styles.metricItemLabel}>Benchmark Success Rate</span>
            <span style={{ ...styles.metricItemValue, color: 'var(--color-emerald)' }}>
              {trainingRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' },
  heading: { margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' },
  subHeading: { margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' },
  actionBtn: { fontSize: 'var(--font-size-xs)', padding: '6px 14px' },
  feedbackBox: { padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' },
  closeBtn: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' },
  kpiCard: { padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiIcon: { fontSize: '24px', marginBottom: '2px' },
  kpiLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: '600' },
  kpiValue: { fontSize: 'var(--font-size-xl)', fontWeight: '800', color: 'var(--color-primary)' },
  kpiMeta: { fontSize: '11px', color: 'var(--color-text-muted)' },
  card: { padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' },
  cardTitle: { margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)' },
  cardSub: { margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' },
  bucketGrid: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' },
  bucketCard: { display: 'flex', flexDirection: 'column', gap: '6px', padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' },
  barTrack: { height: '8px', borderRadius: '4px', backgroundColor: 'var(--color-border)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' },
  trainingMetricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' },
  metricItem: { padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px' },
  metricItemLabel: { fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' },
  metricItemValue: { fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--color-primary)' },
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default InstitutionReadinessView;
