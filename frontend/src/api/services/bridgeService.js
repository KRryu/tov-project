import axios from '../axios';

const bridgeService = {
  // 사용자 여정 정보 조회
  getUserJourney: async () => {
    try {
      const response = await axios.get('/api/bridge/journey');
      return response;
    } catch (error) {
      // 임시 목업 데이터 반환
      return {
        data: {
          data: {
            currentStep: 2,
            completedPrograms: ['BUDDY'],
            inProgressPrograms: ['KOKO'],
            points: 150,
            level: 'Explorer',
            achievements: [
              { id: 1, name: 'First Friend', icon: '🤝', date: '2024-01-15' },
              { id: 2, name: 'Korean Beginner', icon: '🇰🇷', date: '2024-01-20' }
            ]
          }
        }
      };
    }
  },

  // 프로그램 목록 조회
  getPrograms: async () => {
    return axios.get('/api/bridge/programs');
  },

  // 퀘스트 목록 조회
  getQuests: async () => {
    return axios.get('/api/bridge/quests');
  },

  // 업적 조회
  getAchievements: async () => {
    return axios.get('/api/bridge/achievements');
  },

  // Buddy APIs
  getBuddyRecommendations: () => {
    return axios.get('/api/bridge/buddy/recommendations');
  },

  requestBuddyMatch: (buddyId, message) => {
    return axios.post('/api/bridge/buddy/request', { buddyId, message });
  },

  respondToBuddyMatch: (matchId, accept) => {
    return axios.post('/api/bridge/buddy/respond', { matchId, accept });
  },

  addBuddyActivity: (matchId, activity) => {
    return axios.post('/api/bridge/buddy/activity', { matchId, activity });
  },

  getMyBuddyMatches: (status) => {
    const params = status ? `?status=${status}` : '';
    return axios.get(`/api/bridge/buddy/matches${params}`);
  },

  // Program Progress APIs
  startProgram: (programId) => {
    return axios.post('/api/bridge/journey/program/start', { programId });
  },

  completeProgram: (programId) => {
    return axios.post('/api/bridge/journey/program/complete', { programId });
  },

  updateProgramProgress: (programId, progress) => {
    return axios.put('/api/bridge/journey/program/progress', { programId, progress });
  },

  getLeaderboard: (limit = 10) => {
    return axios.get(`/api/bridge/journey/leaderboard?limit=${limit}`);
  },

  // Event APIs
  getEvents: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/api/bridge/events?${queryString}`);
  },

  getEvent: (eventId) => {
    return axios.get(`/api/bridge/events/${eventId}`);
  },

  getMyEvents: (status = 'upcoming') => {
    return axios.get(`/api/bridge/events/my?status=${status}`);
  },

  getRecommendedEvents: () => {
    return axios.get('/api/bridge/events/recommended');
  },

  createEvent: (eventData) => {
    return axios.post('/api/bridge/events', eventData);
  },

  registerForEvent: (eventId) => {
    return axios.post(`/api/bridge/events/${eventId}/register`);
  },

  cancelRegistration: (eventId) => {
    return axios.post(`/api/bridge/events/${eventId}/cancel`);
  },

  updateEvent: (eventId, eventData) => {
    return axios.put(`/api/bridge/events/${eventId}`, eventData);
  },

  cancelEvent: (eventId) => {
    return axios.delete(`/api/bridge/events/${eventId}`);
  }
};

export default bridgeService;