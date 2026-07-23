import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DashboardIcon,
  DepositsIcon,
  ApprovalsIcon,
  ProfileIcon,
} from './AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors, adminShadow } from '../theme/adminTheme';

export const ADMIN_TAB_BAR_HEIGHT = 68;

const TAB_CONFIG = [
  { route: 'AdminDashboard', label: 'Home', Icon: DashboardIcon },
  { route: 'AdminDeposits', label: 'Funds', Icon: DepositsIcon },
  {
    route: 'AdminApprovals',
    label: 'Approve',
    Icon: ApprovalsIcon,
    badgeKey: 'combinedTotalPending',
  },
  { route: 'AdminProfile', label: 'Profile', Icon: ProfileIcon },
];

const TabItem = ({ focused, label, Icon, badge, onPress, onLongPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.04 : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 140,
    }).start();
  }, [focused, scale]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
      style={styles.tabTouchable}>
      <Animated.View
        style={[
          styles.tabItem,
          focused && styles.tabItemActive,
          { transform: [{ scale }] },
        ]}>
        <View style={styles.iconWrap}>
          <Icon focused={focused} size={22} />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[styles.tabLabel, focused && styles.tabLabelActive]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const AdminTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { stats } = useAdmin();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.glowLine} />
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find(t => t.route === route.name) || TAB_CONFIG[0];
          const badge =
            config.badgeKey && stats?.[config.badgeKey] ? stats[config.badgeKey] : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              focused={isFocused}
              label={options.tabBarLabel ?? config.label}
              Icon={config.Icon}
              badge={badge}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

export const getAdminTabBarPadding = insets =>
  ADMIN_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 20;

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    zIndex: 50,
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 1,
    ...Platform.select({
      ios: {
        shadowColor: adminColors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {},
    }),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 23, 20, 0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    paddingHorizontal: 4,
    paddingVertical: 6,
    minHeight: ADMIN_TAB_BAR_HEIGHT,
    ...adminShadow,
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 14,
    width: '100%',
    minHeight: 54,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: adminColors.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  tabLabel: {
    color: adminColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
    lineHeight: 13,
  },
  tabLabelActive: {
    color: adminColors.goldLight,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: adminColors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 10,
  },
});

export default AdminTabBar;
