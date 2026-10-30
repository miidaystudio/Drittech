import apiClient from './apiClient';

export const patientService = {
  getPatients: async (params = {}) => {
    return apiClient.get('/patients', { params });
  },

  getPatientById: async (id) => {
    return apiClient.get(`/patients/${id}`);
  },

  registerPatient: async (data) => {
    return apiClient.post('/patients', data);
  },

  updatePatient: async (id, data) => {
    return apiClient.patch(`/patients/${id}`, data);
  },
};
