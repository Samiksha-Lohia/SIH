import { api } from '../api/client.js';

export const adminApi = {
  // ---------------- Audit Logs ----------------
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.actor) query.set('actor', params.actor);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/audit${qs}`);
    return { logs: res.data?.logs || [], meta: res.meta };
  },

  // ---------------- Platform Analytics ----------------
  async getInstitutionAnalytics() {
    const res = await api.get('/analytics/institution');
    return res.data;
  },

  async getIndustryAnalytics() {
    const res = await api.get('/analytics/industry');
    return res.data;
  },

  async getSkillDemand(limit = 20) {
    const res = await api.get(`/analytics/skills?limit=${limit}`);
    return res.data?.skills || [];
  },

  async recomputeSkillDemand() {
    const res = await api.post('/analytics/skills/recompute');
    return res.data; // { updated, evaluated }
  },

  // ---------------- Opportunities / Moderation Queue ----------------
  async listOpportunities(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.status) query.set('status', params.status);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/opportunities${qs}`);
    return { opportunities: res.data?.opportunities || [], meta: res.meta };
  },

  async updateOpportunityStatus(id, status) {
    const res = await api.patch(`/opportunities/${id}/status`, { status });
    return res.data?.opportunity;
  },

  async deleteOpportunity(id) {
    const res = await api.delete(`/opportunities/${id}`);
    return res.data;
  },

  // ---------------- Skills Taxonomy ----------------
  async listSkills(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/skills${qs}`);
    return { skills: res.data?.skills || [], meta: res.meta };
  },

  async createSkill(payload) {
    const res = await api.post('/skills', payload);
    return res.data?.skill;
  },

  async updateSkill(id, payload) {
    const res = await api.put(`/skills/${id}`, payload);
    return res.data?.skill;
  },

  async deleteSkill(id) {
    const res = await api.delete(`/skills/${id}`);
    return res.data;
  },

  // ---------------- Role Competency Models ----------------
  async listRoles(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/roles${qs}`);
    return { roles: res.data?.roles || [], meta: res.meta };
  },

  async createRole(payload) {
    const res = await api.post('/roles', payload);
    return res.data?.role;
  },

  async updateRole(id, payload) {
    const res = await api.put(`/roles/${id}`, payload);
    return res.data?.role;
  },

  async deleteRole(id) {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  },

  // ---------------- Assessment Bank ----------------
  async listQuestions(params = {}) {
    const query = new URLSearchParams();
    if (params.skill) query.set('skill', params.skill);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/assessments/questions${qs}`);
    return { questions: res.data?.questions || [], meta: res.meta };
  },

  async createQuestion(payload) {
    const res = await api.post('/assessments/questions', payload);
    return res.data?.question;
  },

  async listAssessments(params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/assessments${qs}`);
    return { assessments: res.data?.assessments || [], meta: res.meta };
  },

  async createAssessment(payload) {
    const res = await api.post('/assessments', payload);
    return res.data?.assessment;
  },

  async deleteAssessment(id) {
    const res = await api.delete(`/assessments/${id}`);
    return res.data;
  },

  // ---------------- User Governance ----------------
  async listUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/users${qs}`);
    return { users: res.data?.users || [], meta: res.meta };
  },

  async createUser(payload) {
    const res = await api.post('/users', payload);
    return res.data?.user;
  },

  // ---------------- Institution Governance ----------------
  async listInstitutions(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.status) query.set('status', params.status);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/institutions${qs}`);
    return { institutions: res.data?.institutions || [], meta: res.meta };
  },

  async verifyInstitution(id, status) {
    const res = await api.patch(`/institutions/${id}/verify`, { status });
    return res.data?.institution;
  },

  // ---------------- Company Governance ----------------
  async listIndustries(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.status) query.set('status', params.status);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/industries${qs}`);
    return { industries: res.data?.industries || [], meta: res.meta };
  },

  async verifyIndustry(id, status) {
    const res = await api.patch(`/industries/${id}/verify`, { status });
    return res.data?.industry;
  },
};
