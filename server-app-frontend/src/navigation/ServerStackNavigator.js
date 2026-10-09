import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CronData from '../screens/CronData';
import DbSyncDetailScreen from '../screens/DbSyncDetailScreen';

const Stack = createNativeStackNavigator();

const ServerStackNavigator = () => (
  <Stack.Navigator initialRouteName="HomeScreen">
    <Stack.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CronData"
      component={CronData}
      options={{
        title: 'Weekend Cron Data',
        headerShown: true,
        headerStyle: { backgroundColor: '#023020' },
        headerTitleAlign: 'center',
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    />
    <Stack.Screen
      name="DbSyncDetail"
      component={DbSyncDetailScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default ServerStackNavigator;
