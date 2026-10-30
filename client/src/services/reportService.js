import apiClient from './apiClient';

export const reportService = {
  // Laboratory
  getLabOrders: async (params = {}) => {
    return apiClient.get('/lab/orders', { params });
  },

  createLabOrder: async (data) => {
    return apiClient.post('/lab/orders', data);
  },

  updateOrderStatus: async (id, status) => {
    return apiClient.patch(`/lab/orders/${id}/status`, { status });
  },

  uploadReport: async (formData) => {
    return apiClient.post('/lab/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getReports: async (params = {}) => {
    return apiClient.get('/lab/reports', { params });
  },

  publishReport: async (id) => {
    return apiClient.post(`/lab/reports/${id}/publish`);
  },

  // Patient Portal
  getPatientReports: async () => {
    return apiClient.get('/patient/reports');
  },

  getPatientReportById: async (id) => {
    return apiClient.get(`/patient/reports/${id}`);
  },

  getDownloadLink: async (id) => {
    return apiClient.post(`/patient/reports/${id}/download-link`);
  },
};
