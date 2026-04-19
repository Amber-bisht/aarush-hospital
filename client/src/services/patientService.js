import api from './api';

export const patientService = {
  list: async (search = '') => {
    const { data } = await api.get('/patients', {
      params: { search },
    });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/patients/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/patients', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/patients/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(`/patients/${id}`);
    return data;
  },
};
