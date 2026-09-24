import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_APP_URL } from '../global/constant';
import { ADMIN_TOKEN_KEY } from './adminTokenRefresh';

const SOCKET_TRANSPORTS = ['websocket', 'polling'];

let priceSocket = null;
let lastAuthToken = null;

function readStoredToken() {
  return AsyncStorage.getItem(ADMIN_TOKEN_KEY).then(stored =>
    String(stored || '').trim(),
  );
}

export function getPriceSocket() {
  if (priceSocket) {
    return priceSocket;
  }

  priceSocket = io(SERVER_APP_URL, {
    transports: SOCKET_TRANSPORTS,
    auth: cb => {
      readStoredToken()
        .then(token => {
          lastAuthToken = token;
          cb({ token: token });
        })
        .catch(() => {
          cb({ token: '' });
        });
    },
  });

  return priceSocket;
}

/** Re-handshake when the admin JWT changes so the next connect sends the new token. */
export function syncPriceSocketAuth() {
  const socket = getPriceSocket();
  return readStoredToken()
    .then(token => {
      if (lastAuthToken === null || token === lastAuthToken) {
        lastAuthToken = token;
        return socket;
      }
      lastAuthToken = token;
      socket.disconnect();
      socket.connect();
      return socket;
    })
    .catch(() => socket);
}
