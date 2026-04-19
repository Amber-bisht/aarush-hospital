import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let authBindings = {
  getAccessToken: null,
  getRefreshToken: null,
  onSessionRefreshed: null,
  onSessionExpired: null,
};

export const bindAuthHandlers = (bindings) => {
  authBindings = { ...authBindings, ...bindings };
};

api.interceptors.request.use((config) => {
  const token = authBindings.getAccessToken?.();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      originalRequest &&
      status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/register') &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      const refreshToken = authBindings.getRefreshToken?.();

      if (!refreshToken) {
        authBindings.onSessionExpired?.();
        return Promise.reject(error);
      }

      try {
        originalRequest._retry = true;
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        authBindings.onSessionRefreshed?.(refreshResponse.data);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        authBindings.onSessionExpired?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
