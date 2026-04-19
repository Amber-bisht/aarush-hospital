import api from './api';

export const appointmentService = {
  list: async (params = {}) => {
    const { data } = await api.get('/appointments', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/appointments/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/appointments', payload);
    return data;
  },
  reschedule: async (id, payload) => {
    const { data } = await api.patch(`/appointments/${id}/reschedule`, payload);
    return data;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/appointments/${id}/cancel`);
    return data;
  },
  savePrescription: async (id, payload) => {
    const { data } = await api.post(`/appointments/${id}/prescription`, payload);
    return data;
  },
};
