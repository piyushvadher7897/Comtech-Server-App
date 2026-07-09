import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import { AlertMessage } from './src/utils/AlertMessage';
import {
  initializeFirebaseMessaging,
  setupForegroundNotificationHandlers,
} from './src/services/firebaseMessaging';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabNavigator from './src/navigation/MainTabNavigator';

const App = () => {
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    let cleanupMessaging = () => {};

    const setup = async () => {
      cleanupMessaging = await initializeFirebaseMessaging();
    };

    setup();

    // Server Side tab — monitoring alerts only (Redis/PM2/disk from production backend)
    const unsubscribe = setupForegroundNotificationHandlers(remoteMessage => {
      if (remoteMessage.messageId === lastMessageIdRef.current) {
        return;
      }

      // Fund deposit pushes are handled on Admin Side (adminFirebaseMessaging.js)
      if (remoteMessage?.data?.type === 'fund_deposit_pending') {
        return;
      }

      lastMessageIdRef.current = remoteMessage.messageId;
      const notify = remoteMessage.notification;
      if (!notify) {
        return;
      }

      AlertMessage({
        title: notify.title,
        message: notify.body,
        okText: 'Ok',
        okButton: () => {},
      });
    });

    return () => {
      cleanupMessaging();
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {isSplashVisible ? (
          <SplashScreen onAnimationComplete={() => setIsSplashVisible(false)} />
        ) : (
          <NavigationContainer>
            <MainTabNavigator />
          </NavigationContainer>
        )}
      </View>
    </SafeAreaProvider>
  );
};

export default App;
