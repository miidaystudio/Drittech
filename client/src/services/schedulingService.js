import apiClient from './apiClient';

export const schedulingService = {
  getAvailability: async (params = {}) => {
    return apiClient.get('/scheduling/availability', { params });
  },

  getCalendarSummary: async (params = {}) => {
    return apiClient.get('/scheduling/calendar-summary', { params });
  },

  getAppointmentTypes: async (params = {}) => {
    return apiClient.get('/scheduling/types', { params });
  },

  createAppointmentType: async (data) => {
    return apiClient.post('/scheduling/types', data);
  },

  updateAppointmentType: async (id, data) => {
    return apiClient.put(`/scheduling/types/${id}`, data);
  },

  getDoctorSchedule: async (doctorId) => {
    return apiClient.get(`/scheduling/doctor-schedule/${doctorId}`);
  },

  saveDoctorSchedule: async (data) => {
    return apiClient.post('/scheduling/doctor-schedule', data);
  },

  getExceptions: async (params = {}) => {
    return apiClient.get('/scheduling/exceptions', { params });
  },

  createException: async (data) => {
    return apiClient.post('/scheduling/exceptions', data);
  },

  deleteException: async (id) => {
    return apiClient.delete(`/scheduling/exceptions/${id}`);
  },

  getPolicy: async () => {
    return apiClient.get('/scheduling/policy');
  },

  updatePolicy: async (data) => {
    return apiClient.put('/scheduling/policy', data);
  },

  getSchedulingAnalytics: async (params = {}) => {
    return apiClient.get('/scheduling/analytics', { params });
  },
};
