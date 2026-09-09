import { api } from '../api/client.js';

export const institutionApi = {
  // ---------------- 1. Profile ----------------
  async getMyProfile() {
    const res = await api.get('/profiles/me');
    return res.data; // { role: 'institution', profile, exists }
  },

  async updateProfile(id, data) {
    const res = await api.put(`/institutions/${id}`, data);
    return res.data?.profile;
  },

  // ---------------- 2. Institutional Analytics ----------------
  async getInstitutionAnalytics() {
    const res = await api.get('/analytics/institution');
    return res.data;
  },

  async getSkillDemand(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/analytics/skills${qs}`);
    return res.data?.skills || [];
  },

  // ---------------- 3. Assessments & Question Bank ----------------
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

  async getAssessment(id) {
    const res = await api.get(`/assessments/${id}`);
    return res.data?.assessment;
  },

  async createAssessment(data) {
    const res = await api.post('/assessments', data);
    return res.data?.assessment;
  },

  async updateAssessment(id, data) {
    const res = await api.put(`/assessments/${id}`, data);
    return res.data?.assessment;
  },

  async deleteAssessment(id) {
    const res = await api.delete(`/assessments/${id}`);
    return res.data;
  },

  async listQuestions(params = {}) {
    const query = new URLSearchParams();
    if (params.skill) query.set('skill', params.skill);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/assessments/questions${qs}`);
    return { questions: res.data?.questions || [], meta: res.meta };
  },

  async createQuestion(data) {
    const res = await api.post('/assessments/questions', data);
    return res.data?.question;
  },

  // ---------------- 4. Opportunities & Internships ----------------
  async listInternships(params = {}) {
    const query = new URLSearchParams();
    query.set('type', 'internship');
    if (params.q) query.set('q', params.q);
    if (params.workMode) query.set('workMode', params.workMode);
    if (params.location) query.set('location', params.location);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/opportunities${qs}`);
    return { opportunities: res.data?.opportunities || [], meta: res.meta };
  },

  // ---------------- 5. Learning Programs ----------------
  async listLearningPrograms(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/learning${qs}`);
    return { programs: res.data?.programs || [], meta: res.meta };
  },

  async createLearningProgram(data) {
    const res = await api.post('/learning', data);
    return res.data?.program;
  },

  // ---------------- 6. Skill Gap Simulator & Roles ----------------
  async listRoles(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.limit) query.set('limit', String(params.limit || 50));
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/roles${qs}`);
    return res.data?.roles || [];
  },

  async analyzeSkillGap(data) {
    const res = await api.post('/skill-gap/analyze', data);
    return res.data; // { role, readinessScore, gaps, matches, matchedSkills, missingSkills }
  },

  // ---------------- 7. Student Lookup ----------------
  async lookupStudent(id) {
    const res = await api.get(`/students/${id}`);
    return res.data?.profile;
  },

  async getStudentProfile(id) {
    return this.lookupStudent(id);
  },

  async lookupStudentReadiness(id, params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/students/${id}/readiness${qs}`);
    return res.data;
  },

  async getStudentReadiness(id, params = {}) {
    return this.lookupStudentReadiness(id, params);
  },

  async lookupStudentSkillGaps(id, params = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/students/${id}/skill-gaps${qs}`);
    return res.data;
  },

  async getStudentSkillGaps(id, params = {}) {
    return this.lookupStudentSkillGaps(id, params);
  },

  async lookupStudentAnalytics(id) {
    const res = await api.get(`/analytics/student/${id}`);
    return res.data;
  },

  async getStudentAnalytics(id) {
    return this.lookupStudentAnalytics(id);
  },
};

export default institutionApi;
