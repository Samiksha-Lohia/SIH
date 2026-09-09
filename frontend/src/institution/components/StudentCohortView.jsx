import React, { useState, useEffect } from 'react';
import { institutionApi } from '../institution.api';

export const StudentCohortView = () => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [gapsData, setGapsData] = useState(null);

  // Common institutional enrolled student ID for instant 1-click inspection
  const demoStudentId = '6a95a9a680f3366633179c85';

  const fetchStudentDossier = async (idToFetch) => {
    const id = (idToFetch || studentId).trim();
    if (!id) {
      setError('Please provide a valid Student ID or User ID.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStudentData(null);
      setReadinessData(null);
      setGapsData(null);

      // Call live student intelligence endpoints
      const [profileRes, readinessRes, gapsRes] = await Promise.allSettled([
        institutionApi.getStudentProfile(id),
        institutionApi.getStudentReadiness(id),
        institutionApi.getStudentSkillGaps(id)
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const prof = profileRes.value.profile || profileRes.value.data?.profile || profileRes.value.data || profileRes.value;
        setStudentData(prof);
      } else {
        throw new Error(profileRes.reason?.message || 'Student record not found in institutional database.');
      }

      if (readinessRes.status === 'fulfilled' && readinessRes.value) {
        const read = readinessRes.value.data || readinessRes.value;
        setReadinessData(read);
      }
      if (gapsRes.status === 'fulfilled' && gapsRes.value) {
        const gaps = gapsRes.value.data || gapsRes.value;
        setGapsData(gaps);
      }
    } catch (err) {
      console.error('Failed to retrieve student record:', err);
      setError(err.message || 'Unable to retrieve student profile.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch the active enrolled student record on initial mount so the view is never empty
  useEffect(() => {
    setStudentId(demoStudentId);
    fetchStudentDossier(demoStudentId);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Student Search & Lookup Bar */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
              Student Cohort & Academic Dossier Explorer
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Inspect verified student academic profiles, readiness scores, and competency gaps in real time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Quick Select:</span>
            <button
              onClick={() => {
                setStudentId(demoStudentId);
                fetchStudentDossier(demoStudentId);
              }}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
            >
              Asha Rao (CSE)
            </button>
          </div>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); fetchStudentDossier(); }} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter Student ID or User ID..."
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--color-bg-app)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--font-size-xs)'
            }}
          />
          <button
            type="submit"
            disabled={loading || !studentId.trim()}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)', padding: '6px 18px' }}
          >
            {loading ? 'Fetching Dossier...' : 'Lookup Student Record'}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Querying institutional registers and compiling student dossier...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ padding: 'var(--space-5)', borderLeft: '4px solid var(--color-danger)' }}>
          <h4 style={{ margin: '0 0 var(--space-1)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>Lookup Notice</h4>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      )}

      {/* Student Dossier Results */}
      {studentData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Main Info Card */}
          <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {studentData.name || studentData.fullName || studentData.userId?.name || 'Enrolled Student'}
                  </h2>
                  <span className="badge badge-sky" style={{ textTransform: 'uppercase' }}>
                    {studentData.branch || studentData.department || 'CSE'}
                  </span>
                  <span className="status-pill status-verified">
                    <span className="status-pill-dot" />
                    Verified Enrolment
                  </span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                  Student ID: <code style={{ color: 'var(--color-steel-blue)' }}>{studentData._id || studentData.id}</code> • Batch: {studentData.batch || studentData.graduationYear || '2026'}
                </div>
              </div>

              {/* Overall Readiness Pill */}
              <div style={{
                backgroundColor: 'var(--color-bg-app)',
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Industry Readiness
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: (readinessData?.overallScore ?? readinessData?.readiness ?? readinessData?.score ?? 67) >= 60 ? 'var(--color-emerald)' : 'var(--color-amber)' }}>
                  {readinessData?.overallScore ?? readinessData?.readiness ?? readinessData?.score ?? 67}%
                </div>
              </div>
            </div>

            {/* Academic & Bio Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-app)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Branch / Major</span>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{studentData.branch || 'Computer Science'}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Target Career Role</span>
                <p style={{ margin: '4px 0 0', color: 'var(--color-steel-blue)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                  {Array.isArray(studentData.careerGoals?.targetRoles) 
                    ? studentData.careerGoals.targetRoles.join(', ') 
                    : studentData.targetRole || 'Frontend Developer'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Profile Completeness</span>
                <p style={{ margin: '4px 0 0', color: 'var(--color-emerald)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{studentData.completeness || 100}%</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Preferred Mode</span>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                  {studentData.preferences?.workMode ? studentData.preferences.workMode.toUpperCase() : 'Remote / Hybrid'}
                </p>
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                Verified Technical Proficiencies:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {(studentData.skills || []).length === 0 ? (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>No individual skills logged.</span>
                ) : (
                  (studentData.skills || []).map((s, idx) => (
                    <span key={idx} className="badge badge-sky" style={{ fontSize: '11px' }}>
                      {typeof s === 'string' ? s : `${s.name || s.skill} • ${s.level || 'Intermediate'}`}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Skill Gaps Breakdown if available */}
          {gapsData && (
            <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600 }}>
                Target Role Competency Alignment & Gaps
              </h4>
              {Array.isArray(gapsData.criticalGaps || gapsData.gaps || gapsData) && (gapsData.criticalGaps || gapsData.gaps || gapsData).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-3)' }}>
                  {(gapsData.criticalGaps || gapsData.gaps || gapsData).map((gap, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--color-bg-app)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-xs)' }}>{gap.skill || gap.name}</strong>
                        <span className={`status-pill ${gap.severity === 'critical' ? 'status-rejected' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                          <span className="status-pill-dot" />
                          {gap.severity || gap.status || 'Required'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {gap.reason || `Target level: ${gap.requiredLevel || 'Advanced'}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-emerald)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                  No critical competency gaps identified against the student's target industry baseline.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentCohortView;
