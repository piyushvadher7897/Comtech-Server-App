import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_APP_URL } from '../global/constant';
import {
  ADMIN_TOKEN_KEY,
  handleAdminUnauthorized,
  refreshAdminTokenIfNeeded,
} from './adminTokenRefresh';

const api = axios.create({
  baseURL: ADMIN_APP_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let handling401 = false;

api.interceptors.request.use(async config => {
  if (!config.url?.includes('/auth/refresh-token')) {
    await refreshAdminTokenIfNeeded();
  }

  const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh-token');

    if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      const result = await refreshAdminTokenIfNeeded({ force: true });
      if (result.token) {
        originalRequest.headers.Authorization = result.token.startsWith('Bearer ')
          ? result.token
          : `Bearer ${result.token}`;
        return api(originalRequest);
      }
    }

    if (status === 401 && !isRefreshCall && !handling401) {
      handling401 = true;
      try {
        await handleAdminUnauthorized();
      } finally {
        setTimeout(() => {
          handling401 = false;
        }, 500);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
