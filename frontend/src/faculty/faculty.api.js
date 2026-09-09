import { api } from '../api/client.js';

export const facultyApi = {
  // ---------------- 1. Profile ----------------
  async getMyProfile() {
    const res = await api.get('/profiles/me');
    return res.data; // { role: 'faculty', profile, exists }
  },

  async updateProfile(id, data) {
    const res = await api.put(`/faculty/${id}`, data);
    return res.data?.profile;
  },

  // ---------------- 2. Academician Opportunities ----------------
  async listAcademicOpportunities(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/academician-opportunities${qs}`);
    return {
      opportunities: res.data?.opportunities || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async getAcademicOpportunity(id) {
    const res = await api.get(`/academician-opportunities/${id}`);
    return res.data?.opportunity;
  },

  async expressInterest(id, message) {
    const res = await api.post(`/academician-opportunities/${id}/interest`, { message });
    return res.data; // { interested: true, interestedCount }
  },

  // ---------------- 3. Mentorship ----------------
  async discoverMentors(params = {}) {
    const query = new URLSearchParams();
    if (params.expertise) query.set('expertise', params.expertise);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/mentorship/mentors${qs}`);
    return {
      mentors: res.data?.mentors || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async listMyMentorships(params = {}) {
    const query = new URLSearchParams();
    if (params.as) query.set('as', params.as); // 'mentor' | 'mentee'
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/mentorship/me${qs}`);
    return {
      mentorships: res.data?.mentorships || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async requestMentorship(data) {
    // data: { mentorId, topic, message, slots }
    const res = await api.post('/mentorship', data);
    return res.data?.mentorship;
  },

  async respondMentorship(id, status, responseMessage) {
    const res = await api.patch(`/mentorship/${id}/respond`, { status, responseMessage });
    return res.data?.mentorship;
  },

  async completeMentorship(id) {
    const res = await api.patch(`/mentorship/${id}/complete`);
    return res.data?.mentorship;
  },

  async cancelMentorship(id) {
    const res = await api.patch(`/mentorship/${id}/cancel`);
    return res.data?.mentorship;
  },

  // ---------------- 4. Learning & FDP Programs ----------------
  async listLearningPrograms(params = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.provider) query.set('provider', params.provider);
    if (params.skill) query.set('skill', params.skill);
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/learning${qs}`);
    return {
      programs: res.data?.programs || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async enrollLearningProgram(id) {
    const res = await api.post(`/learning/${id}/enroll`);
    return res.data?.enrollment;
  },

  async listMyEnrollments(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/learning/me/enrollments${qs}`);
    return {
      enrollments: res.data?.enrollments || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  async updateLearningProgress(id, progress) {
    const res = await api.patch(`/learning/${id}/progress`, { progress });
    return res.data?.enrollment;
  },

  // ---------------- 5. Live Projects & Collaboration ----------------
  async listLiveProjects(params = {}) {
    const query = new URLSearchParams();
    query.set('type', 'live_project');
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit || 20));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/opportunities${qs}`);
    return {
      projects: res.data?.opportunities || [],
      meta: res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },
};

export default facultyApi;
