import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Platform} from 'react-native';
import {SERVER_APP_URL} from '../global/constant';

const API_URL = SERVER_APP_URL;

const requestUserPermission = async () => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Notification permission not granted');
    return false;
  }

  console.log('Authorization status:', authStatus);
  return true;
};

const updateToken = async fcmToken => {
  try {
    const result = await axios.post(
      `${API_URL}/notification/device-token`,
      {token: fcmToken},
      {
        timeout: 10000,
        headers: {'Content-Type': 'application/json'},
      },
    );

    if (result.status === 200) {
      await AsyncStorage.setItem('tokenstored', 'Yes');
      console.log('Token stored successfully');
    }
  } catch (err) {
    console.error('Error updating token:', err.response?.data || err.message);
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
    console.log('Failed to receive FCM token');
    return null;
  }

  const storedToken = await AsyncStorage.getItem('fcm_token');
  const storedStatus = await AsyncStorage.getItem('tokenstored');

  if (!storedStatus || storedStatus !== 'Yes' || storedToken !== fcmToken) {
    await updateToken(fcmToken);
    await AsyncStorage.setItem('fcm_token', fcmToken);
  }

  console.log('Your Firebase Token is:', fcmToken);
  return fcmToken;
};

export const initializeFirebaseMessaging = async () => {
  try {
    await getFcmToken();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
      console.log('FCM Token refreshed:', newToken);
      await updateToken(newToken);
      await AsyncStorage.setItem('fcm_token', newToken);
    });

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log(
        'A new FCM message arrived in foreground!',
        JSON.stringify(remoteMessage),
      );
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  } catch (error) {
    console.error('Error initializing messaging:', error);
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
    console.log('Notification opened from background:', remoteMessage);
    if (remoteMessage?.notification) {
      onForegroundMessage(remoteMessage);
    }
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage?.notification) {
        console.log('Notification opened app from quit state:', remoteMessage);
        onForegroundMessage(remoteMessage);
      }
    });

  return unsubscribe;
};
