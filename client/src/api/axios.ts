import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'http://localhost:4000/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshEndpoint = `${getBaseUrl()}/auth/refresh`;
        const { data } = await axios.post(
          refreshEndpoint,
          {},
          { withCredentials: true, timeout: 5000 }
        );
        useAuthStore.getState().setToken(data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
