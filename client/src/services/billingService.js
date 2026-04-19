import api from './api';

export const billingService = {
  list: async (params = {}) => {
    const { data } = await api.get('/bills', { params });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post('/bills', payload);
    return data;
  },
  pay: async (id) => {
    const { data } = await api.patch(`/bills/${id}/pay`);
    return data;
  },
};
