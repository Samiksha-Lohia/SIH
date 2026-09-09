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
      {/* Top Banner */}
      <div className="card" style={styles.bannerCard}>
        <div style={styles.bannerLeft}>
          <div style={styles.badgeWrap}>
            <span className="badge badge-burgundy">Administrator</span>
            <span style={styles.welcomeText}>SUTRA Governance Center</span>
          </div>
          <h2 style={styles.bannerTitle}>Administrator Control Deck</h2>
          <p style={styles.bannerSub}>
            Logged in as <strong>{user?.name || 'Administrator'}</strong> ({user?.email}).
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={styles.tabBar}>
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.activeTabButton : {}),
            }}
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
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('users')}
              >
                <span style={styles.kpiLabel}>Total Users</span>
                <strong style={styles.kpiVal}>{kpis.loading ? '...' : kpis.totalUsers}</strong>
                <span style={styles.kpiHint}>Manage user accounts →</span>
              </div>

              <div
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('institutions')}
              >
                <span style={styles.kpiLabel}>Institutions</span>
                <strong style={styles.kpiVal}>{kpis.loading ? '...' : kpis.totalInstitutions}</strong>
                <span style={styles.kpiHint}>Accreditation & verification →</span>
              </div>

              <div
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('companies')}
              >
                <span style={styles.kpiLabel}>Companies</span>
                <strong style={styles.kpiVal}>{kpis.loading ? '...' : kpis.totalCompanies}</strong>
                <span style={styles.kpiHint}>Corporate recruiter governance →</span>
              </div>

              <div
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('moderation')}
              >
                <span style={styles.kpiLabel}>Active Opportunities</span>
                <strong style={{ ...styles.kpiVal, color: 'var(--color-primary)' }}>
                  {kpis.loading ? '...' : kpis.activeOpportunities}
                </strong>
                <span style={styles.kpiHint}>Review moderation queue →</span>
              </div>

              <div
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('skills')}
              >
                <span style={styles.kpiLabel}>Canonical Skills</span>
                <strong style={styles.kpiVal}>{kpis.loading ? '...' : kpis.totalSkills}</strong>
                <span style={styles.kpiHint}>Manage taxonomy →</span>
              </div>

              <div
                className="card"
                style={styles.kpiCard}
                onClick={() => setActiveTab('roles')}
              >
                <span style={styles.kpiLabel}>Role Competency Models</span>
                <strong style={styles.kpiVal}>{kpis.loading ? '...' : kpis.totalRoles}</strong>
                <span style={styles.kpiHint}>Manage role models →</span>
              </div>
            </div>

            {/* Quick Modules Directory */}
            <div className="card" style={{ marginTop: 'var(--space-2)' }}>
              <h4 style={{ marginBottom: 'var(--space-3)' }}>Admin Capabilities Directory</h4>
              <div style={styles.modulesGrid}>
                <div style={styles.moduleItem} onClick={() => setActiveTab('users')}>
                  <span style={styles.moduleIcon}>👥</span>
                  <div>
                    <strong>User Identity & Governance</strong>
                    <p style={styles.moduleDesc}>
                      Filter by role and account status, search user directory, and inspect verification records.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('institutions')}>
                  <span style={styles.moduleIcon}>🏛️</span>
                  <div>
                    <strong>Institution Governance</strong>
                    <p style={styles.moduleDesc}>
                      Audit college profiles, review department structures, and grant institutional verification badges.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('companies')}>
                  <span style={styles.moduleIcon}>🏢</span>
                  <div>
                    <strong>Company Governance</strong>
                    <p style={styles.moduleDesc}>
                      Inspect enterprise employer registrations, review profile completeness, and verify or reject corporate accounts.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('moderation')}>
                  <span style={styles.moduleIcon}>📋</span>
                  <div>
                    <strong>Content Moderation Queue</strong>
                    <p style={styles.moduleDesc}>
                      Filter, review, approve, pause, or remove published opportunities from recruiters.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('skills')}>
                  <span style={styles.moduleIcon}>🏷️</span>
                  <div>
                    <strong>Skills Taxonomy Management</strong>
                    <p style={styles.moduleDesc}>
                      Create and categorize canonical skills and map industry aliases for normalization.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('roles')}>
                  <span style={styles.moduleIcon}>🎯</span>
                  <div>
                    <strong>Role Competency Models</strong>
                    <p style={styles.moduleDesc}>
                      Configure target job roles and their skill weights used by the matching engine.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('assessments')}>
                  <span style={styles.moduleIcon}>📝</span>
                  <div>
                    <strong>Assessment & Question Bank</strong>
                    <p style={styles.moduleDesc}>
                      Author technical questions, difficulty levels, passing thresholds, and tests.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('analytics')}>
                  <span style={styles.moduleIcon}>📊</span>
                  <div>
                    <strong>Platform-Wide Analytics</strong>
                    <p style={styles.moduleDesc}>
                      Inspect cohort placement funnels, recruiter pipeline stats, and live skill demand scores.
                    </p>
                  </div>
                </div>

                <div style={styles.moduleItem} onClick={() => setActiveTab('audit')}>
                  <span style={styles.moduleIcon}>🛡️</span>
                  <div>
                    <strong>System Audit Trail</strong>
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
    gap: 'var(--space-6)',
  },
  bannerCard: {
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
  },
  bannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  badgeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-1)',
  },
  welcomeText: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 'var(--font-size-2xl)',
    color: 'var(--color-primary)',
  },
  bannerSub: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
  tabBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-2)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: 'var(--space-1)',
  },
  tabButton: {
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  activeTabButton: {
    backgroundColor: 'var(--color-burgundy-light)',
    color: 'var(--color-burgundy-red)',
    borderColor: 'rgba(114, 16, 16, 0.3)',
    fontWeight: '600',
  },
  contentArea: {
    minHeight: '400px',
  },
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'var(--space-3)',
  },
  kpiCard: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
  },
  kpiLabel: {
    fontSize: 'var(--font-size-xs)',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
    letterSpacing: '0.04em',
  },
  kpiVal: {
    fontSize: 'var(--font-size-3xl)',
    fontFamily: 'var(--font-family-display)',
    fontWeight: 'bold',
  },
  kpiHint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-steel-dark)',
    marginTop: 'var(--space-1)',
    fontWeight: '500',
  },
  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 'var(--space-3)',
  },
  moduleItem: {
    display: 'flex',
    gap: 'var(--space-3)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-mist-light)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  moduleIcon: {
    fontSize: '24px',
  },
  moduleDesc: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
    lineHeight: '1.4',
  },
};

export default AdminHome;
