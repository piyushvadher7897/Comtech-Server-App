import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ServerStackNavigator from './ServerStackNavigator';
import AdminNavigator from './AdminNavigator';
import { ServerIcon, AdminSideIcon } from '../admin/components/AdminIcons';
import { colors } from '../theme/theme';
import { adminColors } from '../admin/theme/adminTheme';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isAdmin = route.name === 'AdminSide';

        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isAdmin ? adminColors.backgroundElevated : colors.cardBg,
            borderTopColor: isAdmin ? adminColors.cardBorder : colors.goldBorder,
            borderTopWidth: 1,
            height: 58 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: isAdmin ? adminColors.goldLight : colors.gold,
          tabBarInactiveTintColor: isAdmin ? adminColors.textMuted : colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
          tabBarIcon: ({ focused }) =>
            route.name === 'ServerSide' ? (
              <ServerIcon focused={focused} size={22} />
            ) : (
              <AdminSideIcon focused={focused} size={22} />
            ),
        };
      }}>
      <Tab.Screen
        name="ServerSide"
        component={ServerStackNavigator}
        options={{ tabBarLabel: 'Server Side' }}
      />
      <Tab.Screen
        name="AdminSide"
        component={AdminNavigator}
        options={{ tabBarLabel: 'Admin Side' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
