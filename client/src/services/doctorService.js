import api from './api';

export const doctorService = {
  list: async (search = '') => {
    const { data } = await api.get('/doctors', {
      params: { search },
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/doctors/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/doctors', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/doctors/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/doctors/${id}`);
    return data;
  },
};
