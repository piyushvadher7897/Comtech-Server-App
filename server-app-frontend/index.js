// /**
//  * @format
//  */

// import messaging from '@react-native-firebase/messaging';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// const API_URL = 'http://78.129.235.5:5080'; // Your API URL

// // Get and store FCM token
// const getFcmToken = async () => {
//   try {
//     await messaging().registerDeviceForRemoteMessages();
//     const fcmToken = await messaging().getToken();
//     if (fcmToken) {
//       const storedStatus = await AsyncStorage.getItem('tokenstored');

//       if (!storedStatus || storedStatus !== 'Yes') {
//         updateToken(fcmToken);
//       }
  
//       console.log('Your Firebase Token is:', fcmToken);
//     } else {
//       console.log('Failed', 'No token received');
//     }
//   } catch (error) {
//     console.error('Error getting FCM token:', error);
//   }
// };

// const updateToken = async fcmToken => {
//   try {
//     const result = await axios.post(API_URL + '/notification/device-token', {
//       token: fcmToken,
//     });
//     if (result.status === 200) {
//       await AsyncStorage.setItem('tokenstored', 'Yes');
//       console.log('Token stored successfully');
//     }
//   } catch (err) {
//     console.log('Error updating token:', err);
//   }
// };

// // Call getFcmToken when app starts
// getFcmToken();

// // Register background handler before anything else
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('Message handled in the background!', remoteMessage);
//   // You can perform background tasks here if needed
//   return Promise.resolve();
// });

// // Listen for token refresh
// messaging().onTokenRefresh(async newToken => {
//   console.log('FCM Token refreshed:', newToken);
//   updateToken(newToken);
// });

// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';

// AppRegistry.registerComponent(appName, () => App);





/**
 * @format
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {Platform} from 'react-native';

const API_URL = 'http://78.129.235.51:5080'; // Your API URL

// Register background handler FIRST - this must be at the top level
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  // You can perform background tasks here if needed
  return Promise.resolve();
});

// Request permission for iOS
const requestUserPermission = async () => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    } else {
      console.log('Permission denied');
      return false;
    }
  }
  return true; // Android doesn't need explicit permission for FCM
};

// Get and store FCM token
const getFcmToken = async () => {
  try {
    // Request permission first (especially for iOS)
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    // Register device for remote messages
    await messaging().registerDeviceForRemoteMessages();
    
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      const storedToken = await AsyncStorage.getItem('fcm_token');
      const storedStatus = await AsyncStorage.getItem('tokenstored');

      // Update token if it's new or not stored before
      if (!storedStatus || storedStatus !== 'Yes' || storedToken !== fcmToken) {
        await updateToken(fcmToken);
        await AsyncStorage.setItem('fcm_token', fcmToken);
      }
  
      console.log('Your Firebase Token is:', fcmToken);
    } else {
      console.log('Failed', 'No token received');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};

const updateToken = async fcmToken => {
  try {
    const result = await axios.post(
      `${API_URL}/notification/device-token`,
      {
        token: fcmToken,
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (result.status === 200) {
      await AsyncStorage.setItem('tokenstored', 'Yes');
      console.log('Token stored successfully');
    }
  } catch (err) {
    console.error('Error updating token:', err.response?.data || err.message);
    // Don't throw error to prevent app crash
  }
};

// Initialize messaging when app starts
const initializeMessaging = async () => {
  try {
    await getFcmToken();
    
    // Listen for token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
      console.log('FCM Token refreshed:', newToken);
      await updateToken(newToken);
      await AsyncStorage.setItem('fcm_token', newToken);
    });

    // Listen for foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      // Handle foreground message here
    });

    // Return cleanup function
    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }
};

// Initialize messaging
initializeMessaging();

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);