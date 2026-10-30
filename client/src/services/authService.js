import apiClient from './apiClient';

export const authService = {
  login: async (credentials) => {
    return apiClient.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return apiClient.post('/auth/register', userData);
  },

  getMe: async () => {
    return apiClient.get('/auth/me');
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  forgotPassword: async (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },
};
