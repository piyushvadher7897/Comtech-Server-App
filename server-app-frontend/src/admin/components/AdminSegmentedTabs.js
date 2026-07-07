import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { adminColors } from '../theme/adminTheme';

const VARIANT_COLORS = {
  gold: adminColors.gold,
  manager: adminColors.managerAccent,
  admin: adminColors.adminAccent,
  neutral: adminColors.goldMuted,
};

const getActiveTextColor = variant => (variant === 'admin' ? '#FFFFFF' : '#1a1208');

const TRACK_PADDING = 4;

const AdminSegmentedTabs = ({ tabs, activeId, onChange, style }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;

  const activeTab = tabs.find(t => t.id === activeId);
  const indicatorColor =
    VARIANT_COLORS[activeTab?.variant || 'gold'] || VARIANT_COLORS.gold;
  const tabCount = tabs.length || 1;
  const tabWidth = useMemo(() => {
    if (containerWidth <= 0) return 0;
    return (containerWidth - TRACK_PADDING * 2) / tabCount;
  }, [containerWidth, tabCount]);

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex(tab => tab.id === activeId)),
    [tabs, activeId],
  );

  useEffect(() => {
    if (!tabWidth) return;
    Animated.timing(slideX, {
      toValue: activeIndex * tabWidth,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, slideX, tabWidth]);

  return (
    <View
      style={[styles.container, style]}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {tabWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: indicatorColor,
              transform: [{ translateX: slideX }],
            },
          ]}
        />
      ) : null}

      {tabs.map(tab => {
        const isActive = activeId === tab.id;
        const activeTextColor = getActiveTextColor(tab.variant || 'gold');

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.85}>
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                isActive && { color: activeTextColor },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}>
              {tab.label}
            </Text>
            {typeof tab.count === 'number' && tab.count > 0 ? (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text
                  style={[
                    styles.countText,
                    isActive && styles.countTextActive,
                    isActive && { color: activeTextColor },
                  ]}>
                  {tab.count > 99 ? '99+' : tab.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: adminColors.tabTrack,
    borderRadius: 14,
    padding: TRACK_PADDING,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 11,
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    color: adminColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  countText: {
    color: adminColors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  countTextActive: {},
});

export default AdminSegmentedTabs;
