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

// true = release APK also uses http://78.129.235.52:5056 for admin APIs.
// false = release APK uses https://appapi.comtechgold.com
const ADMIN_USE_REMOTE_TEST = false;

const getLocalAdminUrl = () => {
  if (ADMIN_LOCAL_HOST) {
    return `http://${ADMIN_LOCAL_HOST}:${ADMIN_LOCAL_PORT}`;
  }
  if (Platform.OS === 'android') {
    // return `http://192.168.1.5:${ADMIN_LOCAL_PORT}`;
  }
  return `http://localhost:${ADMIN_LOCAL_PORT}`;
};

// Server Side — always uses production/remote backend (prices, status socket, notifications)
export const SERVER_APP_URL = SERVER_PROD_URL;
export const Shoket_URL = SERVER_SOCKET_PROD;

// Admin Side — remote test server in dev + release (when ADMIN_USE_REMOTE_TEST), else production
// export const ADMIN_APP_URL =
//   __DEV__ || ADMIN_USE_REMOTE_TEST ? getLocalAdminUrl() : ADMIN_PROD_URL;
export const ADMIN_APP_URL = ADMIN_PROD_URL;
// export const ADMIN_APP_URL = getLocalAdminUrl();

// Sent on all Admin Side API calls so backend can:
// 1) identify this as the internal Server App
// 2) bypass mobile app-version enforcement (okhttp UA looks like Android)
export const SERVER_APP_USER_AGENT = 'ComTechServer/1.0';
export const SERVER_APP_HEADERS = {
  'User-Agent': SERVER_APP_USER_AGENT,
  comtechserver: 'true',
};

// Backward compatibility for server-side screens (HomeScreen socket, etc.)
export const APP_URL = SERVER_APP_URL;

// if (__DEV__ || ADMIN_USE_REMOTE_TEST) {
//   console.log('[Server Side] API:', SERVER_APP_URL);
//   console.log('[Server Side] Socket:', Shoket_URL);
//   console.log('[Admin Side]  API:', ADMIN_APP_URL);
// }
console.log('=== API ENVIRONMENT CONFIGURATION ===');
console.log('[Server Side] API URL:   ', SERVER_APP_URL);
console.log('[Server Side] Socket URL:', Shoket_URL);
console.log('[Admin Side]  API URL:   ', ADMIN_APP_URL);
console.log('======================================');
