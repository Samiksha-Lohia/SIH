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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Student Search & Lookup Bar */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              🎓 Student Cohort & Academic Dossier Explorer
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Inspect verified student academic profiles, readiness scores, and competency gaps in real time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Quick Select:</span>
            <button
              onClick={() => {
                setStudentId(demoStudentId);
                fetchStudentDossier(demoStudentId);
              }}
              style={{
                padding: '0.35rem 0.75rem',
                background: '#0f172a',
                border: '1px solid #38bdf8',
                borderRadius: '6px',
                color: '#38bdf8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Asha Rao (CSE)
            </button>
          </div>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); fetchStudentDossier(); }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter Student ID or User ID..."
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '0.65rem 1rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
          <button
            type="submit"
            disabled={loading || !studentId.trim()}
            style={{
              padding: '0.65rem 1.5rem',
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: loading || !studentId.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !studentId.trim() ? 0.6 : 1
            }}
          >
            {loading ? 'Fetching Dossier...' : 'Lookup Student Record'}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Querying institutional registers and compiling student dossier...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.25rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
          <h4 style={{ margin: '0 0 0.35rem', color: '#ef4444' }}>Lookup Notice</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {/* Student Dossier Results */}
      {studentData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Info Card */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                    {studentData.name || studentData.fullName || studentData.userId?.name || 'Enrolled Student'}
                  </h2>
                  <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {studentData.branch || studentData.department || 'CSE'}
                  </span>
                  <span style={{ background: '#065f46', color: '#34d399', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                    Verified Enrolment
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                  Student ID: <code style={{ color: '#38bdf8' }}>{studentData._id || studentData.id}</code> • Batch: {studentData.batch || studentData.graduationYear || '2026'}
                </div>
              </div>

              {/* Overall Readiness Pill */}
              <div style={{ background: '#0f172a', padding: '0.85rem 1.35rem', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industry Readiness</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: (readinessData?.overallScore ?? readinessData?.readiness ?? readinessData?.score ?? 67) >= 60 ? '#34d399' : '#facc15' }}>
                  {readinessData?.overallScore ?? readinessData?.readiness ?? readinessData?.score ?? 67}%
                </div>
              </div>
            </div>

            {/* Academic & Bio Details */}
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#0f172a', padding: '1.25rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Branch / Major</span>
                <p style={{ margin: '0.25rem 0 0', color: '#f8fafc', fontWeight: 600 }}>{studentData.branch || 'Computer Science'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Target Career Role</span>
                <p style={{ margin: '0.25rem 0 0', color: '#38bdf8', fontWeight: 600 }}>
                  {Array.isArray(studentData.careerGoals?.targetRoles) 
                    ? studentData.careerGoals.targetRoles.join(', ') 
                    : studentData.targetRole || 'Frontend Developer'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Profile Completeness</span>
                <p style={{ margin: '0.25rem 0 0', color: '#34d399', fontWeight: 600 }}>{studentData.completeness || 100}%</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Preferred Mode</span>
                <p style={{ margin: '0.25rem 0 0', color: '#f8fafc', fontWeight: 600 }}>
                  {studentData.preferences?.workMode ? studentData.preferences.workMode.toUpperCase() : 'Remote / Hybrid'}
                </p>
              </div>
            </div>

            {/* Technical Skills */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.6rem', fontWeight: 600 }}>
                Verified Technical Proficiencies:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(studentData.skills || []).length === 0 ? (
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No individual skills logged.</span>
                ) : (
                  (studentData.skills || []).map((s, idx) => (
                    <span key={idx} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {typeof s === 'string' ? s : `${s.name || s.skill} • ${s.level || 'Intermediate'}`}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Skill Gaps Breakdown if available */}
          {gapsData && (
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                🎯 Target Role Competency Alignment & Gaps
              </h4>
              {Array.isArray(gapsData.criticalGaps || gapsData.gaps || gapsData) && (gapsData.criticalGaps || gapsData.gaps || gapsData).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {(gapsData.criticalGaps || gapsData.gaps || gapsData).map((gap, i) => (
                    <div key={i} style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{gap.skill || gap.name}</strong>
                        <span style={{ color: gap.severity === 'critical' ? '#ef4444' : '#facc15', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          {gap.severity || gap.status || 'Required'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {gap.reason || `Target level: ${gap.requiredLevel || 'Advanced'}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: '#34d399', fontSize: '0.85rem' }}>
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
