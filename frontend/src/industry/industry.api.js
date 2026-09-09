import { api } from '../api/client.js';

export const industryApi = {
  // ---------------- 1. Profile ----------------
  async getMyProfile() {
    const res = await api.get('/profiles/me');
    return res.data; // { role: 'industry', profile, exists }
  },

  async updateProfile(id, data) {
    const res = await api.put(`/industries/${id}`, data);
    return res.data?.profile;
  },

  // ---------------- 2. Opportunities ----------------
  async listMyOpportunities(params = {}) {
    const query = new URLSearchParams();
    query.set('mine', 'true');
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.workMode) query.set('workMode', params.workMode);
    if (params.location) query.set('location', params.location);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));
    if (params.sort) query.set('sort', params.sort);

    const res = await api.get(`/opportunities?${query.toString()}`);
    return {
      opportunities: res.data?.opportunities || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getOpportunity(id) {
    const res = await api.get(`/opportunities/${id}`);
    return res.data?.opportunity;
  },

  async createOpportunity(data) {
    const res = await api.post('/opportunities', data);
    return res.data?.opportunity;
  },

  async updateOpportunity(id, data) {
    const res = await api.put(`/opportunities/${id}`, data);
    return res.data?.opportunity;
  },

  async changeOpportunityStatus(id, status) {
    const res = await api.patch(`/opportunities/${id}/status`, { status });
    return res.data?.opportunity;
  },

  async deleteOpportunity(id) {
    const res = await api.delete(`/opportunities/${id}`);
    return res.data;
  },

  // ---------------- 3. Candidate Recommendations ----------------
  async matchCandidates(opportunityId, limit = 15) {
    const res = await api.post('/matching/candidates', { opportunityId, limit });
    return {
      opportunity: res.data?.opportunity,
      count: res.data?.count || 0,
      candidates: res.data?.candidates || [],
    };
  },

  // ---------------- 4. Applications & Review ----------------
  async listApplicants(opportunityId, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/applications/opportunity/${opportunityId}${qs}`);
    return {
      applications: res.data?.applications || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getApplication(id) {
    const res = await api.get(`/applications/${id}`);
    return res.data?.application;
  },

  async updateApplicationStatus(id, status, note) {
    const res = await api.patch(`/applications/${id}/status`, { status, note });
    return res.data?.application;
  },

  async addApplicationNote(id, note) {
    const res = await api.post(`/applications/${id}/notes`, { note });
    return res.data?.application;
  },

  async addInterviewStage(id, stage) {
    const res = await api.post(`/applications/${id}/interviews`, stage);
    return res.data?.application;
  },

  // ---------------- 5. Analytics ----------------
  async getIndustryAnalytics() {
    const res = await api.get('/analytics/industry');
    return res.data;
  },

  async getSkillDemand(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/analytics/skills${qs}`);
    return res.data?.skills || [];
  },
};

export default industryApi;
