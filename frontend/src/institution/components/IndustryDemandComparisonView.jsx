import React, { useState, useEffect, useMemo } from 'react';
import { institutionApi } from '../institution.api.js';

export function IndustryDemandComparisonView() {
  const [skillDemandList, setSkillDemandList] = useState([]);
  const [institutionAnalytics, setInstitutionAnalytics] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillsData, analyticsData] = await Promise.all([
        institutionApi.getSkillDemand({ limit: 100 }),
        institutionApi.getInstitutionAnalytics(),
      ]);
      setSkillDemandList(skillsData || []);
      setInstitutionAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to load industry demand analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map student skill count by normalized lowercase name
  const studentSkillMap = useMemo(() => {
    const map = new Map();
    (institutionAnalytics?.skillDistribution || []).forEach((item) => {
      if (item.skill) {
        map.set(item.skill.toLowerCase().trim(), item.count || 0);
      }
    });
    return map;
  }, [institutionAnalytics]);

  // Combine industry demand with student competency
  const comparisonData = useMemo(() => {
    return skillDemandList.map((item) => {
      const name = item.name || item.slug;
      const normalizedName = (name || '').toLowerCase().trim();
      const studentCount = studentSkillMap.get(normalizedName) || 0;
      const demandScore = item.demandScore || item.weightedDemand || item.demand || 0;

      let alignmentStatus = 'Balanced';
      let statusColor = 'var(--color-sky)';
      let badgeClass = 'badge-sky';

      if (demandScore >= 5 && studentCount === 0) {
        alignmentStatus = 'Critical Market Gap';
        statusColor = 'var(--color-danger)';
        badgeClass = 'badge-rose';
      } else if (demandScore >= 3 && studentCount < 2) {
        alignmentStatus = 'Supply Deficit';
        statusColor = 'var(--color-amber)';
        badgeClass = 'badge-amber';
      } else if (studentCount >= 2) {
        alignmentStatus = 'Well Aligned';
        statusColor = 'var(--color-emerald)';
        badgeClass = 'badge-emerald';
      }

      return {
        id: item._id || item.slug || name,
        name,
        category: item.category || 'General',
        demandScore,
        demandCount: item.count || item.demand || 0,
        studentCount,
        alignmentStatus,
        statusColor,
        badgeClass,
      };
    });
  }, [skillDemandList, studentSkillMap]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    comparisonData.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [comparisonData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return comparisonData.filter((row) => {
      const matchesSearch = search ? row.name.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesCategory = categoryFilter ? row.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [comparisonData, search, categoryFilter]);

  if (loading) {
    return (
      <div style={styles.stateBox}>
        <div style={styles.spinner} />
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Computing industry demand vs. institutional talent supply...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.stateBox}>
        <p style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: 'var(--space-3)' }}>{error}</p>
        <button onClick={fetchData} className="btn btn-primary" style={{ fontSize: 'var(--font-size-xs)' }}>
          Retry
        </button>
      </div>
    );
  }

  const criticalGapsCount = comparisonData.filter((r) => r.alignmentStatus === 'Critical Market Gap').length;
  const alignedCount = comparisonData.filter((r) => r.alignmentStatus === 'Well Aligned').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
          Industry Skill-Demand Comparison Matrix
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
          Comparative view analyzing live recruiter hiring requirements from active job/internship postings against your institution's verified student skills.
        </p>
      </div>

      {/* Quick Summary Strip using B2B KPI Grid */}
      <div className="b2b-kpi-grid">
        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Industry Skills Evaluated</div>
          <div className="b2b-kpi-value">{skillDemandList.length}</div>
          <div className="b2b-kpi-subtext">Active market competencies</div>
        </div>
        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Well Aligned Competencies</div>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-emerald)' }}>{alignedCount}</div>
          <div className="b2b-kpi-subtext">Sufficient student supply</div>
        </div>
        <div className="b2b-kpi-tile">
          <div className="b2b-kpi-label">Critical Market Gaps</div>
          <div className="b2b-kpi-value" style={{ color: 'var(--color-burgundy-red)' }}>{criticalGapsCount}</div>
          <div className="b2b-kpi-subtext">High demand with zero supply</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-surface)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills (e.g. React, Python, Docker)..."
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-xs)',
              backgroundColor: 'var(--color-bg-app)',
              flex: 2,
              minWidth: '200px',
              color: 'var(--color-text)'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-xs)',
              backgroundColor: 'var(--color-bg-app)',
              flex: 1,
              minWidth: '160px',
              color: 'var(--color-text)'
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {(search || categoryFilter) && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); }}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Skill Competency</th>
              <th>Category</th>
              <th>Industry Demand Weight</th>
              <th>Institution Student Supply</th>
              <th>Market Alignment</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => {
              const statusPillClass =
                row.alignmentStatus === 'Well Aligned'
                  ? 'status-verified'
                  : row.alignmentStatus === 'Supply Deficit'
                  ? 'status-pending'
                  : 'status-rejected';

              return (
                <tr key={row.id || idx}>
                  <td>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {row.name}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-sky" style={{ fontSize: '11px' }}>
                      {row.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: '700' }}>
                        {row.demandScore}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        ({row.demandCount} postings)
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: '700', color: row.studentCount > 0 ? 'var(--color-primary)' : 'var(--color-burgundy-red)' }}>
                        {row.studentCount}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        student{row.studentCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${statusPillClass}`}>
                      <span className="status-pill-dot" />
                      {row.alignmentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No skill comparison records match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  stateBox: { padding: 'var(--space-12)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' },
  spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' },
};

export default IndustryDemandComparisonView;
