import { api } from '../api/client.js';

export const studentApi = {
  // ---------------- 1. Profile & Onboarding ----------------
  async getMyProfile() {
    const res = await api.get('/profiles/me');
    return res.data; // { role, profile, exists }
  },

  async getStudentProfile(userId) {
    const res = await api.get(`/students/${userId}`);
    return res.data; // { profile, exists }
  },

  async updateStudentProfile(userId, data) {
    const res = await api.put(`/students/${userId}`, data);
    return res.data?.profile;
  },

  async extractVoiceProfile(userId, transcript, autoMerge = false) {
    const res = await api.post(`/students/${userId}/voice-profile`, { transcript, autoMerge });
    return res.data; // { source, extracted, merged, profile }
  },

  async transcribeVoice(userId, { audioBlob, transcript = '', autoMerge = false }) {
    const formData = new FormData();
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }
    if (transcript) {
      formData.append('transcript', transcript);
    }
    formData.append('autoMerge', String(autoMerge));

    const res = await api.post(`/students/${userId}/voice-transcribe`, formData);
    return res.data; // { source, transcript, extracted, merged, profile }
  },

  // ---------------- 2. Skill Assessments ----------------
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

  async listMyAssignedAssessments() {
    const res = await api.get('/assessments/my-assignments');
    return { assignments: res.data?.assignments || [] };
  },

  async getAssessment(id) {
    const res = await api.get(`/assessments/${id}`);
    return res.data?.assessment;
  },

  async submitAssessmentAttempt(id, { answers, applyToProfile = true, campaignId, startedAt }) {
    const res = await api.post(`/assessments/${id}/submit`, { answers, applyToProfile, campaignId, startedAt });
    return res.data?.attempt;
  },

  async getAttemptResult(attemptId) {
    const res = await api.get(`/assessments/results/${attemptId}`);
    return res.data?.attempt;
  },

  async listMyAttempts(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/assessments/attempts/me${qs}`);
    return { attempts: res.data?.attempts || [], meta: res.meta };
  },

  // ---------------- 3. Skill-Gap & Readiness ----------------
  async getReadiness(userId, params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.roleId) query.set('roleId', params.roleId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/students/${userId}/readiness${qs}`);
    return res.data; // { role, readiness, profileCompleteness, topStrengths, criticalGaps, summary }
  },

  async getSkillGaps(userId, params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.roleId) query.set('roleId', params.roleId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/students/${userId}/skill-gaps${qs}`);
    return res.data; // { role, readiness, gaps, strong, missing, summary }
  },

  async analyzeSkillGap(payload) {
    const res = await api.post('/skill-gap/analyze', payload);
    return res.data;
  },

  async listRoles(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 50));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/roles${qs}`);
    return { roles: res.data?.roles || [], meta: res.meta };
  },

  // ---------------- 4. Opportunities Marketplace & Matching ----------------
  async listOpportunities(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.workMode) query.set('workMode', params.workMode);
    if (params.location) query.set('location', params.location);
    if (params.skills) query.set('skills', params.skills);
    if (params.minStipend) query.set('minStipend', String(params.minStipend));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/opportunities${qs}`);
    return { opportunities: res.data?.opportunities || [], meta: res.meta };
  },

  async getOpportunity(id) {
    const res = await api.get(`/opportunities/${id}`);
    return res.data?.opportunity;
  },

  async matchOpportunities(payload = {}) {
    const res = await api.post('/matching/opportunities', payload);
    return res.data; // { matches: [{ opportunity, score, scoreBreakdown, matchedSkills, missingSkills }], evaluatedCount }
  },

  async applyToOpportunity(id, { resumeUrl, coverLetter } = {}) {
    const res = await api.post(`/opportunities/${id}/apply`, { resumeUrl, coverLetter });
    return res.data?.application;
  },

  // ---------------- 5. Application Tracker ----------------
  async listMyApplications(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/applications/me${qs}`);
    return { applications: res.data?.applications || [], meta: res.meta };
  },

  async getApplication(id) {
    const res = await api.get(`/applications/${id}`);
    return res.data?.application;
  },

  async withdrawApplication(id) {
    const res = await api.post(`/applications/${id}/withdraw`);
    return res.data?.application;
  },

  // ---------------- 6. Digital Portfolio ----------------
  async listMyPortfolio(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/portfolio/me${qs}`);
    return { items: res.data?.items || [], meta: res.meta };
  },

  async createPortfolioItem(data) {
    const res = await api.post('/portfolio', data);
    return res.data?.item;
  },

  async updatePortfolioItem(id, data) {
    const res = await api.put(`/portfolio/${id}`, data);
    return res.data?.item;
  },

  async deletePortfolioItem(id) {
    const res = await api.delete(`/portfolio/${id}`);
    return res.data;
  },

  async generateResume() {
    const res = await api.post('/portfolio/resume');
    return res.data; // { name, email, skills, softSkills, education, projects, certifications, summary }
  },

  async getPortfolioShare(userId) {
    const res = await api.get(`/portfolio/share/${userId}`);
    return res.data; // { user, summary, verifiedCount, items }
  },

  // ---------------- 7. Notifications ----------------
  async listNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/notifications${qs}`);
    return { notifications: res.data?.notifications || [], meta: res.meta };
  },

  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return res.data?.count ?? 0;
  },

  async getUnreadNotificationCount() {
    const res = await api.get('/notifications/unread-count');
    return { count: res.data?.count ?? 0 };
  },

  async markNotificationRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data?.notification;
  },

  async markAllNotificationsRead() {
    const res = await api.post('/notifications/read-all');
    return res.data; // { updated }
  },

  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default studentApi;
