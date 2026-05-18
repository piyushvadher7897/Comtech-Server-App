// import React, { useEffect } from 'react';
// import {View, Image, StyleSheet, Text, StatusBar} from 'react-native';
// import SplashScreen from './src/screens/SplashScreen';
// import HomeScreen from './src/screens/HomeScreen';
// import {AlertMessage} from './src/utils/AlertMessage';
// import messaging from '@react-native-firebase/messaging';

// const App = () => {
//   const [isSplashVisible, setIsSplashVisible] = React.useState(true);
//   const [lastMessageId, setLastMessageId] = React.useState(null);

//   // Request permission for notifications
//   const requestUserPermission = async () => {
//     try {
//       const authStatus = await messaging().requestPermission();
//       const enabled =
//         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//       if (enabled) {
//         console.log('Authorization status:', authStatus);
//         // Get FCM token
//         const token = await messaging().getToken();
//         console.log('FCM Token:', token);
//       }
//     } catch (error) {
//       console.log('Permission request error:', error);
//     }
//   };

//   useEffect(() => {
//     // Request permission when app starts
//     requestUserPermission();

//     // Handle foreground messages
//     const unsubscribe = messaging().onMessage(async remoteMessage => {
//       console.log('Received foreground message:', remoteMessage);
      
//       if (remoteMessage.messageId === lastMessageId) {
//         return; // Skip duplicate message
//       }
      
//       setLastMessageId(remoteMessage.messageId);
//       let notify = remoteMessage.notification;
//       AlertMessage({
//         title: notify.title,
//         message: notify.body,
//         okText: 'Ok',
//         okButton: () => {},
//       });
//     });

//     // Handle notification open when app is in background
//     messaging().onNotificationOpenedApp(remoteMessage => {
//       console.log('Notification opened app from background:', remoteMessage);
//       if (remoteMessage.notification) {
//         AlertMessage({
//           title: remoteMessage.notification.title,
//           message: remoteMessage.notification.body,
//           okText: 'Ok',
//           okButton: () => {},
//         });
//       }
//     });

//     // Handle notification open when app is closed
//     messaging()
//       .getInitialNotification()
//       .then(remoteMessage => {
//         if (remoteMessage) {
//           console.log('Notification opened app from quit state:', remoteMessage);
//           AlertMessage({
//             title: remoteMessage.notification.title,
//             message: remoteMessage.notification.body,
//             okText: 'Ok',
//             okButton: () => {},
//           });
//         }
//       });

//     return unsubscribe;
//   }, [lastMessageId]);

//   return (
//     <View style={{flex: 1}}>
//       {isSplashVisible ? (
//         <SplashScreen onAnimationComplete={() => setIsSplashVisible(false)} />
//       ) : ( 
//         <HomeScreen/>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection:'column',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'black',
//     gap:100
//   },
//   homeContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//   },
//   image: {
//     width: 170,
//     height: 170,
//     resizeMode: 'contain',
//   },
//   text: {
//     fontSize: 30,
//     fontWeight: 'bold',
//     color:'white',
//     textAlign:'center'
//   },
// });

// export default App;




import React, { useEffect } from 'react';
import { View } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import CronData from './src/screens/CronData';
import { AlertMessage } from './src/utils/AlertMessage';
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isSplashVisible, setIsSplashVisible] = React.useState(true);
  const [lastMessageId, setLastMessageId] = React.useState(null);

  // 🔔 Request permission for notifications
  const requestUserPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
      }
    } catch (error) {
      console.log('Permission request error:', error);
    }
  };

  useEffect(() => {
    requestUserPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Received foreground message:', remoteMessage);
      if (remoteMessage.messageId === lastMessageId) return;

      setLastMessageId(remoteMessage.messageId);
      let notify = remoteMessage.notification;
      AlertMessage({
        title: notify.title,
        message: notify.body,
        okText: 'Ok',
        okButton: () => {},
      });
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background:', remoteMessage);
      if (remoteMessage.notification) {
        AlertMessage({
          title: remoteMessage.notification.title,
          message: remoteMessage.notification.body,
          okText: 'Ok',
          okButton: () => {},
        });
      }
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          AlertMessage({
            title: remoteMessage.notification.title,
            message: remoteMessage.notification.body,
            okText: 'Ok',
            okButton: () => {},
          });
        }
      });

    return unsubscribe;
  }, [lastMessageId]);

  return (
    <SafeAreaProvider>
    <View style={{ flex: 1 }}>
      {isSplashVisible ? (
        <SplashScreen onAnimationComplete={() => setIsSplashVisible(false)} />
      ) : (
        <NavigationContainer>
          <Stack.Navigator initialRouteName="HomeScreen">
            <Stack.Screen
              name="HomeScreen"
              component={HomeScreen}
              options={{ title: 'Home', headerShown: false }}
            />
            <Stack.Screen
              name="CronData"
              component={CronData}
              options={{ title: 'Weekend Cron Data', headerShown: true, headerStyle: {
      backgroundColor: '#023020', // ✅ sets background color
    },
    headerTitleAlign: 'center',
    headerTintColor: '#fff', // ✅ sets back button + title color
    headerTitleStyle: {
      fontWeight: '600',
      fontSize: 18,
    }, }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </View>
    </SafeAreaProvider>
  );
};

export default App;

