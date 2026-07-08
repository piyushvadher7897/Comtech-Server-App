import { Platform } from 'react-native';

// ─── Server Side tab (prices, socket, server status, notifications) ───
// Always production — independent of Admin Side local dev settings.
const SERVER_PROD_URL = 'https://appapi.comtechgold.com';
const SERVER_SOCKET_PROD = 'ws://78.129.235.51:5080';

// ─── Admin Side tab (fund deposit approval — /api/appadmin/*) ───
const ADMIN_PROD_URL = 'https://appapi.comtechgold.com';
const ADMIN_LOCAL_PORT = 5056; // match cgoldBack_new_transform/envs/local.env PORT

// Set Mac LAN IP when testing admin on a physical phone (e.g. '192.168.1.42')
const ADMIN_LOCAL_HOST = null;

const getLocalAdminUrl = () => {
  if (ADMIN_LOCAL_HOST) {
    return `http://${ADMIN_LOCAL_HOST}:${ADMIN_LOCAL_PORT}`;
  }
  if (Platform.OS === 'android') {
    return `http://78.129.235.52:${ADMIN_LOCAL_PORT}`;
  }
  return `http://localhost:${ADMIN_LOCAL_PORT}`;
};

// Server Side — always uses production/remote backend (prices, status socket, notifications)
export const SERVER_APP_URL = SERVER_PROD_URL;
export const Shoket_URL = SERVER_SOCKET_PROD;

// Admin Side — local backend in dev, production in release
export const ADMIN_APP_URL = __DEV__ ? getLocalAdminUrl() : ADMIN_PROD_URL;

// Backward compatibility for server-side screens (HomeScreen socket, etc.)
export const APP_URL = SERVER_APP_URL;

if (__DEV__) {
  console.log('[Server Side] API:', SERVER_APP_URL);
  console.log('[Server Side] Socket:', Shoket_URL);
  console.log('[Admin Side]  API:', ADMIN_APP_URL);
}
