/**
 * Admin Side only — fund deposit approval push notifications.
 * Registers FCM token with local ADMIN_APP_URL after admin login.
 */
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {PermissionsAndroid, Platform} from 'react-native';
import {ADMIN_APP_URL, SERVER_APP_HEADERS} from '../global/constant';
import {ADMIN_TOKEN_KEY} from './adminTokenRefresh';
import {handleFundDepositNotification, handleFundWithdrawNotification} from '../admin/utils/adminNotificationNavigation';

const ADMIN_DEVICE_TOKEN_KEY = 'admin_fcm_token';
const ADMIN_TOKEN_STORED_KEY = 'admin_token_stored';
const LOG = '[AdminFCM]';

export const isAdminNotificationsEnabled = async () => {
  const stored = await AsyncStorage.getItem(ADMIN_TOKEN_STORED_KEY);
  return stored === 'Yes';
};

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) {
      return true;
    }

    const permission =
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS ||
      'android.permission.POST_NOTIFICATIONS';

    const alreadyGranted = await PermissionsAndroid.check(permission);
    if (alreadyGranted) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission);
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    if (!granted) {
      console.warn(LOG, 'Android POST_NOTIFICATIONS denied:', result);
    }
    return granted;
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.warn(LOG, 'iOS notification permission denied');
  }
  return enabled;
};

export const registerAdminDeviceToken = async fcmToken => {
  if (!fcmToken) {
    console.warn(LOG, 'Skipped — empty FCM token');
    return {success: false, reason: 'no_token'};
  }

  const authToken = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
  if (!authToken) {
    console.warn(LOG, 'Skipped — log in to Admin Side first');
    return {success: false, reason: 'not_logged_in'};
  }

  const url = `${ADMIN_APP_URL}/api/appadmin/notification/device-token`;
  console.log(LOG, 'POST', url);

  try {
    const result = await axios.post(
      url,
      {token: fcmToken},
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          ...SERVER_APP_HEADERS,
          Authorization: authToken.startsWith('Bearer ')
            ? authToken
            : `Bearer ${authToken}`,
        },
      },
    );

    await AsyncStorage.setItem(ADMIN_TOKEN_STORED_KEY, 'Yes');
    await AsyncStorage.setItem(ADMIN_DEVICE_TOKEN_KEY, fcmToken);
    console.log(LOG, 'Registered OK:', result.status, result.data);
    return {success: true, data: result.data};
  } catch (err) {
    console.error(
      LOG,
      'Register FAILED:',
      err.response?.status,
      err.response?.data || err.message,
    );
    return {
      success: false,
      reason: 'api_error',
      status: err.response?.status,
      message: err.response?.data?.error || err.message,
    };
  }
};

export const syncAdminFcmToken = async () => {
  console.log(LOG, 'sync started | backend:', ADMIN_APP_URL);
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return {success: false, reason: 'permission_denied'};
    }

    await messaging().registerDeviceForRemoteMessages();
    const fcmToken = await messaging().getToken();

    if (!fcmToken) {
      console.warn(LOG, 'getToken returned empty');
      return {success: false, reason: 'no_fcm_token'};
    }

    console.log(LOG, 'token:', fcmToken.slice(0, 24) + '...');
    const result = await registerAdminDeviceToken(fcmToken);
    return {...result, tokenPrefix: fcmToken.slice(0, 24)};
  } catch (err) {
    console.error(LOG, 'sync error:', err?.message || err);
    return {success: false, reason: 'error', message: err?.message || String(err)};
  }
};

export const setupAdminNotificationHandlers = (onDepositNotification, lastMessageIdRef) => {
  const handleMessage = remoteMessage => {
    const type = remoteMessage?.data?.type;
    const isDeposit = type === 'fund_deposit_pending';
    const isWithdraw = type === 'fund_withdraw_pending';

    if (isDeposit) {
      console.log(LOG, 'Fund deposit push:', remoteMessage?.notification?.title);
      handleFundDepositNotification(remoteMessage);
      onDepositNotification?.(remoteMessage);
    } else if (isWithdraw) {
      console.log(LOG, 'Fund withdraw push:', remoteMessage?.notification?.title);
      handleFundWithdrawNotification(remoteMessage);
      onDepositNotification?.(remoteMessage);
    }
  };

  const onMessage = remoteMessage => {
    if (remoteMessage.messageId === lastMessageIdRef?.current) {
      return;
    }
    if (lastMessageIdRef) {
      lastMessageIdRef.current = remoteMessage.messageId;
    }
    handleMessage(remoteMessage);
  };

  const unsubscribe = messaging().onMessage(onMessage);

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(LOG, 'Opened from background');
    onMessage(remoteMessage);
  });

  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      console.log(LOG, 'Opened from quit');
      onMessage(remoteMessage);
    }
  });

  const unsubscribeRefresh = messaging().onTokenRefresh(async newToken => {
    console.log(LOG, 'Token refreshed — re-registering with local backend');
    await registerAdminDeviceToken(newToken);
    await AsyncStorage.setItem(ADMIN_DEVICE_TOKEN_KEY, newToken);
  });

  return () => {
    unsubscribe();
    unsubscribeRefresh();
  };
};
