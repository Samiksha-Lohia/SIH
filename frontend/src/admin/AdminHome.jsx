import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { adminApi } from './admin.api.js';

import { OpportunityQueueView } from './components/OpportunityQueueView.jsx';
import { SkillsTaxonomyView } from './components/SkillsTaxonomyView.jsx';
import { RolesTaxonomyView } from './components/RolesTaxonomyView.jsx';
import { AssessmentBankView } from './components/AssessmentBankView.jsx';
import { PlatformAnalyticsView } from './components/PlatformAnalyticsView.jsx';
import { AuditLogView } from './components/AuditLogView.jsx';
import { UserGovernanceView } from './components/UserGovernanceView.jsx';
import { InstitutionGovernanceView } from './components/InstitutionGovernanceView.jsx';
import { CompanyGovernanceView } from './components/CompanyGovernanceView.jsx';

const ADMIN_TABS = [
  { id: 'overview', label: 'Platform Cockpit' },
  { id: 'users', label: 'User Governance' },
  { id: 'institutions', label: 'Institutions' },
  { id: 'companies', label: 'Companies' },
  { id: 'moderation', label: 'Moderation Queue' },
  { id: 'skills', label: 'Skills Taxonomy' },
  { id: 'roles', label: 'Role Competency' },
  { id: 'assessments', label: 'Assessment Bank' },
  { id: 'analytics', label: 'Platform Analytics' },
  { id: 'audit', label: 'Audit Trail' },
];

export function AdminHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Quick stats on Overview tab
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalInstitutions: 0,
    totalCompanies: 0,
    totalStudents: 0,
    activeOpportunities: 0,
    totalSkills: 0,
    totalRoles: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadKpis() {
      try {
        const [inst, ind, skillsRes, rolesRes, usersRes, instRes, indRes] = await Promise.allSettled([
          adminApi.getInstitutionAnalytics(),
          adminApi.getIndustryAnalytics(),
          adminApi.listSkills({ limit: 1 }),
          adminApi.listRoles({ limit: 1 }),
          adminApi.listUsers({ limit: 1 }),
          adminApi.listInstitutions({ limit: 1 }),
          adminApi.listIndustries({ limit: 1 }),
        ]);

        if (isMounted) {
          setKpis({
            totalStudents: inst.status === 'fulfilled' ? inst.value?.totalStudents || 0 : 0,
            activeOpportunities: ind.status === 'fulfilled' ? ind.value?.activeOpportunities || 0 : 0,
            totalSkills: skillsRes.status === 'fulfilled' ? skillsRes.value?.meta?.total || 0 : 0,
            totalRoles: rolesRes.status === 'fulfilled' ? rolesRes.value?.meta?.total || 0 : 0,
            totalUsers: usersRes.status === 'fulfilled' ? usersRes.value?.meta?.total || 0 : 0,
            totalInstitutions: instRes.status === 'fulfilled' ? instRes.value?.meta?.total || 0 : 0,
            totalCompanies: indRes.status === 'fulfilled' ? indRes.value?.meta?.total || 0 : 0,
            loading: false,
          });
        }
      } catch {
        if (isMounted) setKpis((prev) => ({ ...prev, loading: false }));
      }
    }
    loadKpis();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={styles.page}>
      {/* Top Cockpit Header */}
      <div style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.breadcrumbs}>
            <span style={styles.crumbCategory}>Governance & Compliance</span>
            <span style={styles.crumbSeparator}>/</span>
            <span className="badge badge-burgundy">Administrator</span>
          </div>
          <h2 style={styles.pageTitle}>Platform Control Deck</h2>
          <p style={styles.subTitle}>
            Session authenticated as <strong>{user?.name || 'Administrator'}</strong> <span style={{ color: 'var(--color-text-muted)' }}>({user?.email})</span>
          </p>
        </div>
      </div>

      {/* Mobile Tab Select Navigation (<768px) */}
      <div className="b2b-mobile-tab-nav">
        <label style={styles.mobileNavLabel}>Active Governance View</label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="b2b-mobile-tab-select"
        >
          {ADMIN_TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop/Tablet Segmented Nav Tabs Ribbon (>=768px) */}
      <div className="nav-tabs-scroll hide-on-mobile" style={styles.tabBar}>
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`b2b-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      <div style={styles.contentArea}>
        {activeTab === 'overview' && (
          <div style={styles.overviewContainer}>
            {/* Quick Metric Cards */}
            <div style={styles.kpiGrid}>
              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('users')}
              >
                <span className="b2b-kpi-label">Total Users</span>
                <span className="b2b-kpi-value">{kpis.loading ? '...' : kpis.totalUsers}</span>
                <span className="b2b-kpi-subtext">Manage user directory →</span>
              </div>

              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('institutions')}
              >
                <span className="b2b-kpi-label">Institutions</span>
                <span className="b2b-kpi-value">{kpis.loading ? '...' : kpis.totalInstitutions}</span>
                <span className="b2b-kpi-subtext">Accreditation status →</span>
              </div>

              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('companies')}
              >
                <span className="b2b-kpi-label">Companies</span>
                <span className="b2b-kpi-value">{kpis.loading ? '...' : kpis.totalCompanies}</span>
                <span className="b2b-kpi-subtext">Recruiter accounts →</span>
              </div>

              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('moderation')}
              >
                <span className="b2b-kpi-label">Active Opportunities</span>
                <span className="b2b-kpi-value" style={{ color: 'var(--color-burgundy-red)' }}>
                  {kpis.loading ? '...' : kpis.activeOpportunities}
                </span>
                <span className="b2b-kpi-subtext">Moderation queue →</span>
              </div>

              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('skills')}
              >
                <span className="b2b-kpi-label">Canonical Skills</span>
                <span className="b2b-kpi-value">{kpis.loading ? '...' : kpis.totalSkills}</span>
                <span className="b2b-kpi-subtext">Taxonomy items →</span>
              </div>

              <div
                className="b2b-kpi-tile"
                onClick={() => setActiveTab('roles')}
              >
                <span className="b2b-kpi-label">Role Models</span>
                <span className="b2b-kpi-value">{kpis.loading ? '...' : kpis.totalRoles}</span>
                <span className="b2b-kpi-subtext">Competency matrix →</span>
              </div>
            </div>

            {/* Quick Modules Directory */}
            <div className="card" style={{ marginTop: 'var(--space-1)' }}>
              <div style={styles.directoryHeader}>
                <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Platform Capabilities Directory</h4>
                <span style={styles.directorySub}>Direct access to system administration modules</span>
              </div>

              <div style={styles.modulesGrid}>
                <div style={styles.moduleItem} onClick={() => setActiveTab('users')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>User Identity & Governance</strong>
                    <p style={styles.moduleDesc}>
                      Filter by role and account status, search directory, and inspect verification records.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('institutions')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Institution Governance</strong>
                    <p style={styles.moduleDesc}>
                      Audit college profiles, review department structures, and manage institutional verification badges.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('companies')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Company Governance</strong>
                    <p style={styles.moduleDesc}>
                      Inspect employer registrations, review profile completeness, and verify or reject corporate accounts.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('moderation')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Content Moderation Queue</strong>
                    <p style={styles.moduleDesc}>
                      Review, approve, pause, or remove published opportunities and job postings from recruiters.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('skills')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Skills Taxonomy Management</strong>
                    <p style={styles.moduleDesc}>
                      Create and categorize canonical skills and map industry aliases for matching normalization.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('roles')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Role Competency Models</strong>
                    <p style={styles.moduleDesc}>
                      Configure target job roles and their skill weights used by the matching engine.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('assessments')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Assessment & Question Bank</strong>
                    <p style={styles.moduleDesc}>
                      Author technical questions, difficulty levels, passing thresholds, and skill quizzes.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('analytics')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>Platform-Wide Analytics</strong>
                    <p style={styles.moduleDesc}>
                      Inspect cohort placement funnels, recruiter pipeline stats, and live skill demand scores.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('audit')}>
                  <div style={styles.moduleAccent} />
                  <div>
                    <strong style={styles.moduleTitle}>System Audit Trail</strong>
                    <p style={styles.moduleDesc}>
                      Review immutable access logs, verification events, status transitions, and IP records.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserGovernanceView />}
        {activeTab === 'institutions' && <InstitutionGovernanceView />}
        {activeTab === 'companies' && <CompanyGovernanceView />}
        {activeTab === 'moderation' && <OpportunityQueueView />}
        {activeTab === 'skills' && <SkillsTaxonomyView />}
        {activeTab === 'roles' && <RolesTaxonomyView />}
        {activeTab === 'assessments' && <AssessmentBankView />}
        {activeTab === 'analytics' && <PlatformAnalyticsView />}
        {activeTab === 'audit' && <AuditLogView />}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 'var(--space-2)',
    borderBottom: '1px solid var(--color-border)',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  crumbCategory: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: '600',
  },
  crumbSeparator: {
    fontSize: '11px',
    color: 'var(--color-pebble-grey)',
  },
  pageTitle: {
    fontSize: 'var(--font-size-xl)',
    color: 'var(--color-text-primary)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  subTitle: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    margin: 0,
  },
  mobileNavLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px',
  },
  tabBar: {
    display: 'flex',
    gap: '2px',
    borderBottom: '1px solid var(--color-border)',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  },
  contentArea: {
    minHeight: '450px',
  },
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
    gap: 'var(--space-3)',
  },
  directoryHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: 'var(--space-3)',
  },
  directorySub: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: 'var(--space-3)',
  },
  moduleItem: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
    alignItems: 'flex-start',
  },
  moduleAccent: {
    width: '4px',
    height: '24px',
    borderRadius: '2px',
    backgroundColor: 'var(--color-steel-blue)',
    flexShrink: 0,
    marginTop: '2px',
  },
  moduleTitle: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    display: 'block',
  },
  moduleDesc: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
    lineHeight: '1.4',
    margin: 0,
  },
};

export default AdminHome;
