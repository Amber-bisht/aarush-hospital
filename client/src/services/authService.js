import api from './api';

export const authService = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },
  logout: async (refreshToken) => {
    const { data } = await api.post('/auth/logout', { refreshToken });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};
