/**
 * Server Side tab only — monitoring alerts (Redis/PM2/disk).
 * Registers FCM token with production SERVER_APP_URL. Do not use for Admin Side.
 */
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Platform} from 'react-native';
import {SERVER_APP_URL} from '../global/constant';

const LOG = '[ServerFCM]';

const requestUserPermission = async () => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log(LOG, 'Notification permission not granted');
    return false;
  }

  return true;
};

const updateMonitoringToken = async fcmToken => {
  try {
    const result = await axios.post(
      `${SERVER_APP_URL}/notification/device-token`,
      {token: fcmToken},
      {
        timeout: 10000,
        headers: {'Content-Type': 'application/json'},
      },
    );

    if (result.status === 200 || result.status === 201) {
      await AsyncStorage.setItem('tokenstored', 'Yes');
      console.log(LOG, 'Monitoring token stored on', SERVER_APP_URL);
    }
  } catch (err) {
    console.warn(LOG, 'Monitoring token failed:', err.response?.data || err.message);
  }
};

const getFcmToken = async () => {
  const hasPermission = await requestUserPermission();
  if (!hasPermission) {
    return null;
  }

  await messaging().registerDeviceForRemoteMessages();
  const fcmToken = await messaging().getToken();

  if (!fcmToken) {
    console.log(LOG, 'No FCM token received');
    return null;
  }

  const storedToken = await AsyncStorage.getItem('fcm_token');
  const storedStatus = await AsyncStorage.getItem('tokenstored');

  if (!storedStatus || storedStatus !== 'Yes' || storedToken !== fcmToken) {
    await updateMonitoringToken(fcmToken);
    await AsyncStorage.setItem('fcm_token', fcmToken);
  }

  console.log(LOG, 'Token prefix:', fcmToken.slice(0, 20) + '...');
  return fcmToken;
};

export const initializeFirebaseMessaging = async () => {
  try {
    await getFcmToken();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
      console.log(LOG, 'Token refreshed');
      await updateMonitoringToken(newToken);
      await AsyncStorage.setItem('fcm_token', newToken);
    });

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log(LOG, 'Foreground message:', JSON.stringify(remoteMessage));
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  } catch (error) {
    console.error(LOG, 'Init error:', error);
    return () => {};
  }
};

export const setupForegroundNotificationHandlers = (
  onForegroundMessage,
  lastMessageId,
) => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    if (remoteMessage.messageId === lastMessageId) {
      return;
    }
    onForegroundMessage(remoteMessage);
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(LOG, 'Opened from background:', remoteMessage);
    if (remoteMessage?.notification) {
      onForegroundMessage(remoteMessage);
    }
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage?.notification) {
        console.log(LOG, 'Opened from quit:', remoteMessage);
        onForegroundMessage(remoteMessage);
      }
    });

  return unsubscribe;
};
