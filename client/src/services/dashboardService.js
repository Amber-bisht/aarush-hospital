import api from './api';

export const dashboardService = {
  getOverview: async () => {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },
};
