import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import { ADMIN_APP_URL, SERVER_APP_HEADERS } from '../global/constant';

export const ADMIN_TOKEN_KEY = 'adminToken';
export const ADMIN_SESSION_KEY = 'adminSession';
export const ADMIN_LOGIN_TS_KEY = 'adminLoginTimestamp';

const REFRESH_BEFORE_EXPIRY_SEC = 12 * 60 * 60;
const EXPIRED_GRACE_SEC = 24 * 60 * 60;

let refreshPromise = null;
let onForceLogout = null;

export const setAdminTokenRefreshHandlers = ({ onLogout } = {}) => {
  onForceLogout = typeof onLogout === 'function' ? onLogout : null;
};

export const decodeAdminJwt = token => {
  const raw = String(token || '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  const parts = raw.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    if (typeof global.atob !== 'function') {
      return null;
    }
    const json = global.atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isAdminTokenBeyondGrace = token => {
  const payload = decodeAdminJwt(token);
  if (!payload?.exp) return false;
  return Date.now() / 1000 - payload.exp > EXPIRED_GRACE_SEC;
};

export const shouldRefreshAdminToken = token => {
  const payload = decodeAdminJwt(token);
  if (!payload?.exp) return true;

  const nowSec = Date.now() / 1000;
  if (payload.exp <= nowSec) {
    return !isAdminTokenBeyondGrace(token);
  }
  return payload.exp - nowSec < REFRESH_BEFORE_EXPIRY_SEC;
};

export const saveAdminToken = async (token, { resetLoginTimestamp = false } = {}) => {
  const normalized = String(token || '').startsWith('Bearer ')
    ? String(token)
    : `Bearer ${token}`;
  await AsyncStorage.setItem(ADMIN_TOKEN_KEY, normalized);
  if (resetLoginTimestamp) {
    await AsyncStorage.setItem(ADMIN_LOGIN_TS_KEY, Date.now().toString());
  }

  const raw = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw);
      session.token = normalized;
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } catch {
      // ignore corrupt session payload
    }
  }
  return normalized;
};

export const clearAdminAuthStorage = async () => {
  await AsyncStorage.multiRemove([ADMIN_SESSION_KEY, ADMIN_TOKEN_KEY, ADMIN_LOGIN_TS_KEY]);
};

const requestAdminTokenRefresh = async token => {
  const deviceID = await DeviceInfo.getUniqueId();
  const { data } = await axios.post(
    `${ADMIN_APP_URL}/api/appadmin/auth/refresh-token`,
    { deviceID },
    {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...SERVER_APP_HEADERS,
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const refreshAdminTokenIfNeeded = async ({ force = false } = {}) => {
  const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return { refreshed: false, token: null };
  }

  if (isAdminTokenBeyondGrace(token)) {
    return { refreshed: false, token: null, expired: true };
  }

  if (!force && !shouldRefreshAdminToken(token)) {
    return { refreshed: false, token };
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const data = await requestAdminTokenRefresh(token);
      if (data?.success && data?.token) {
        const updated = await saveAdminToken(data.token, { resetLoginTimestamp: true });
        return { refreshed: true, token: updated };
      }
      return { refreshed: false, token: null, expired: true };
    } catch (err) {
      const forceLogout = err?.response?.data?.forceLogout === true;
      const current = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!forceLogout && current && !isAdminTokenBeyondGrace(current)) {
        return { refreshed: false, token: current };
      }
      return { refreshed: false, token: null, expired: true };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const handleAdminUnauthorized = async () => {
  if (onForceLogout) {
    await onForceLogout();
  } else {
    await clearAdminAuthStorage();
  }
};
