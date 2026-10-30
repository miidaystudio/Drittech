import apiClient from './apiClient';

export const queueService = {
  getQueue: async (params = {}) => {
    return apiClient.get('/queue', { params });
  },

  createQueueEntry: async (data) => {
    return apiClient.post('/queue', data);
  },

  callNextPatient: async (data = {}) => {
    return apiClient.post('/queue/call-next', data);
  },

  recallPatient: async (id) => {
    return apiClient.post(`/queue/${id}/recall`);
  },

  skipPatient: async (id) => {
    return apiClient.post(`/queue/${id}/skip`);
  },

  completePatient: async (id) => {
    return apiClient.post(`/queue/${id}/complete`);
  },

  trackToken: async (trackingToken) => {
    return apiClient.get(`/queue/track/${trackingToken}`);
  },

  getDisplayData: async (clinicId, departmentId = 'all') => {
    return apiClient.get(`/queue/display/${clinicId}/${departmentId}`);
  },
};
