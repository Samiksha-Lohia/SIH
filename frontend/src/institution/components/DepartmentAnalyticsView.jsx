import React, { useState, useEffect } from 'react';
import { institutionApi } from '../institution.api.js';

export function DepartmentAnalyticsView() {
  const [analytics, setAnalytics] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Frontend Developer');
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, rolesData] = await Promise.all([
        institutionApi.getInstitutionAnalytics(),
        institutionApi.listRoles(),
      ]);
      setAnalytics(analyticsData);
      setRoles(rolesData || []);
      if (rolesData && rolesData.length > 0) {
        setSelectedRole(rolesData[0].title);
      }
    } catch (err) {
      console.error('Failed to load department analytics:', err);
      setError(err.message || 'Failed to load department analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runSimulation = async (roleTitle) => {
    const roleToTest = roleTitle || selectedRole;
    if (!roleToTest) return;
    setSimulatorLoading(true);
    try {
      // Gather top student skills from the institution's skill distribution
      const studentSkills = (analytics?.skillDistribution || []).map((s) => ({
        name: s.skill,
        level: 'intermediate',
      }));

      const res = await institutionApi.analyzeSkillGap({
        role: roleToTest,
        studentSkills: studentSkills.length ? studentSkills : undefined,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulatorLoading(false);
    }
  };

  useEffect(() => {
    if (analytics && selectedRole) {
      runSimulation(selectedRole);
    }
  }, [selectedRole, analytics]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #334155', borderTopColor: '#38bdf8', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Computing department-wise competencies and skill distributions from live records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', background: '#450a0a', border: '1px solid #dc2626', borderRadius: '8px', color: '#fca5a5' }}>
        <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>Error Loading Department Analytics</h4>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>
        <button
          onClick={fetchData}
          style={{ padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Retry
        </button>
      </div>
    );
  }

  const branches = analytics?.branchDistribution || [];
  const totalBranchStudents = branches.reduce((acc, b) => acc + (b.count || 0), 0) || 1;
  const skills = analytics?.skillDistribution || [];
  const maxSkillCount = Math.max(...skills.map((s) => s.count || 0), 1);

  // Safe extraction of simulation attributes
  const roleDisplayTitle = simulationResult?.role
    ? typeof simulationResult.role === 'object'
      ? simulationResult.role.title || selectedRole
      : simulationResult.role
    : selectedRole;

  const readinessScore = simulationResult?.readiness ?? simulationResult?.readinessScore ?? 0;
  
  // Strong/verified competencies from engine
  const verifiedSkills = Array.isArray(simulationResult?.strong)
    ? simulationResult.strong
    : Array.isArray(simulationResult?.matches)
    ? simulationResult.matches.map(m => (typeof m === 'string' ? m : m.skill || m.name))
    : [];

  // Gaps / missing competencies from engine
  const gapItems = Array.isArray(simulationResult?.gaps)
    ? simulationResult.gaps.filter(g => g.status !== 'met')
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
          🏛️ Department-Wise Skill-Gap & Competency Analytics
        </h3>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
          Real-time intelligence aggregated across institutional academic branches, student skill profiles, and industry role benchmarks.
        </p>
      </div>

      {/* 2-Column: Department Breakdown & Skills Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Left: Department Enrollment */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Academic Branch / Department Enrollment</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Student cohort distribution across registered institutional academic branches.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {branches.map((b) => {
              const percent = Math.round((b.count / totalBranchStudents) * 100);
              return (
                <div key={b.branch} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>
                      🏛️ {b.branch}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {b.count} student{b.count === 1 ? '' : 's'} ({percent}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: '#0f172a', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: '#38bdf8', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && (
              <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                No branch records found in current student cohort.
              </p>
            )}
          </div>
        </div>

        {/* Right: Technical Skill Inventory */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Institutional Technical Skills Inventory</h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Top technical competencies verified across the student body.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {skills.map((s) => {
              const percent = Math.round((s.count / maxSkillCount) * 100);
              return (
                <div key={s.skill} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {s.skill}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                      {s.count} student{s.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: '#0f172a', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: '#34d399', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
            {skills.length === 0 && (
              <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                No student skills registered yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Institutional Skill-Gap Simulator */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1.25rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              🎯 Institutional Role Alignment Simulator
            </h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Simulate your student cohort's collective proficiency against standardized industry roles using SUTRA's gap engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Target Role:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '0.85rem',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {roles.map((r) => (
                <option key={r.slug || r.title || r.id} value={r.title || r.name}>
                  {r.title || r.name}
                </option>
              ))}
              {!roles.some((r) => (r.title || r.name) === selectedRole) && (
                <option value={selectedRole}>{selectedRole}</option>
              )}
            </select>
            <button
              onClick={() => runSimulation(selectedRole)}
              disabled={simulatorLoading}
              style={{
                padding: '0.5rem 1rem',
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: simulatorLoading ? 'not-allowed' : 'pointer',
                opacity: simulatorLoading ? 0.7 : 1
              }}
            >
              {simulatorLoading ? 'Evaluating...' : 'Recalculate Gap'}
            </button>
          </div>
        </div>

        {simulationResult && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Score Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem',
              background: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Institutional Alignment Score for <strong style={{ color: '#f8fafc' }}>{roleDisplayTitle}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: readinessScore >= 60 ? '#34d399' : '#facc15' }}>
                    {Math.round(readinessScore)}%
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    ({verifiedSkills.length} verified competencies, {gapItems.length} priority gaps)
                  </span>
                </div>
              </div>
              <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                Active SUTRA Engine Simulation
              </span>
            </div>

            {/* Gaps Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* Verified Competencies */}
              <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#34d399', fontWeight: 700 }}>
                  ✅ Verified Department Competencies ({verifiedSkills.length})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {verifiedSkills.map((m, idx) => (
                    <span key={idx} style={{ background: '#064e3b', border: '1px solid #059669', color: '#6ee7b7', fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 500 }}>
                      {m}
                    </span>
                  ))}
                  {verifiedSkills.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      No matching cohort skills detected for this target role.
                    </span>
                  )}
                </div>
              </div>

              {/* Priority Curriculum Gaps */}
              <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>
                  ⚠️ Priority Curriculum Gaps ({gapItems.length})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {gapItems.map((g, idx) => (
                    <span key={idx} style={{ background: '#450a0a', border: '1px solid #b91c1c', color: '#fca5a5', fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 500 }}>
                      {g.skill} ({g.severity || 'gap'})
                    </span>
                  ))}
                  {gapItems.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                      All core role requirements are met by current student cohort!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentAnalyticsView;
