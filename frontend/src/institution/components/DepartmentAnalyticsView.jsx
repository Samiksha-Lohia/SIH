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
      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          Computing department-wise competencies and skill distributions from live records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', borderLeft: '4px solid var(--color-danger)' }}>
        <h4 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-danger)', fontSize: 'var(--font-size-md)' }}>Error Loading Department Analytics</h4>
        <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{error}</p>
        <button
          onClick={fetchData}
          className="btn btn-primary"
          style={{ fontSize: 'var(--font-size-xs)' }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
          Department-Wise Skill-Gap & Competency Analytics
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Real-time intelligence aggregated across institutional academic branches, student skill profiles, and industry role benchmarks.
        </p>
      </div>

      {/* 2-Column: Department Breakdown & Skills Inventory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-4)' }}>
        {/* Left: Department Enrollment */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600 }}>Academic Branch / Department Enrollment</h4>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Student cohort distribution across registered institutional academic branches.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {branches.map((b) => {
              const percent = Math.round((b.count / totalBranchStudents) * 100);
              return (
                <div key={b.branch} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {b.branch}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {b.count} student{b.count === 1 ? '' : 's'} ({percent}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: 'var(--color-steel-blue)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
            {branches.length === 0 && (
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 'var(--font-size-xs)' }}>
                No branch records found in current student cohort.
              </p>
            )}
          </div>
        </div>

        {/* Right: Technical Skill Inventory */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600 }}>Institutional Technical Skills Inventory</h4>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Top technical competencies verified across the student body.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '320px', overflowY: 'auto', paddingRight: 'var(--space-1)' }}>
            {skills.map((s) => {
              const percent = Math.round((s.count / maxSkillCount) * 100);
              return (
                <div key={s.skill} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                      {s.skill}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {s.count} student{s.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: 'var(--color-emerald)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
            {skills.length === 0 && (
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 'var(--font-size-xs)' }}>
                No student skills registered yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Institutional Skill-Gap Simulator */}
      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)', fontWeight: 600 }}>
              Institutional Role Alignment Simulator
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
              Simulate your student cohort's collective proficiency against standardized industry roles using SUTRA's gap engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Target Role:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text)',
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
              className="btn btn-primary"
              style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
            >
              {simulatorLoading ? 'Evaluating...' : 'Recalculate Gap'}
            </button>
          </div>
        </div>

        {simulationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Score Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Institutional Alignment Score for <strong style={{ color: 'var(--color-primary)' }}>{roleDisplayTitle}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                  <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: readinessScore >= 60 ? 'var(--color-emerald)' : 'var(--color-amber)' }}>
                    {Math.round(readinessScore)}%
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    ({verifiedSkills.length} verified competencies, {gapItems.length} priority gaps)
                  </span>
                </div>
              </div>
              <span className="badge badge-sky" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                Active SUTRA Engine Simulation
              </span>
            </div>

            {/* Gaps Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-3)' }}>
              {/* Verified Competencies */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <h5 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-emerald)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Verified Department Competencies ({verifiedSkills.length})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {verifiedSkills.map((m, idx) => (
                    <span key={idx} className="status-pill status-verified" style={{ fontSize: '11px' }}>
                      <span className="status-pill-dot" />
                      {m}
                    </span>
                  ))}
                  {verifiedSkills.length === 0 && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No matching cohort skills detected for this target role.
                    </span>
                  )}
                </div>
              </div>

              {/* Priority Curriculum Gaps */}
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <h5 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Priority Curriculum Gaps ({gapItems.length})
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {gapItems.map((g, idx) => (
                    <span key={idx} className="status-pill status-rejected" style={{ fontSize: '11px' }}>
                      <span className="status-pill-dot" />
                      {g.skill} ({g.severity || 'gap'})
                    </span>
                  ))}
                  {gapItems.length === 0 && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-emerald)', fontWeight: 600 }}>
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
