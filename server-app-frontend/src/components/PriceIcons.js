import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/theme';

const STROKE = colors.gold;
const SW = 1.35;

/** Three gold bars in a pyramid (two bottom, one top) */
export const GoldBarsIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4.5" y="14.5" width="6.5" height="3.2" rx="0.7" stroke={STROKE} strokeWidth={SW} />
    <Rect x="13" y="14.5" width="6.5" height="3.2" rx="0.7" stroke={STROKE} strokeWidth={SW} />
    <Rect x="8.25" y="9.5" width="7.5" height="3.4" rx="0.7" stroke={STROKE} strokeWidth={SW} />
    <Line x1="4.5" y1="16.1" x2="11" y2="16.1" stroke={STROKE} strokeWidth={0.75} opacity={0.65} />
    <Line x1="13" y1="16.1" x2="19.5" y2="16.1" stroke={STROKE} strokeWidth={0.75} opacity={0.65} />
    <Line x1="8.25" y1="11.2" x2="15.75" y2="11.2" stroke={STROKE} strokeWidth={0.75} opacity={0.65} />
  </Svg>
);

/** Balance scale */
export const BalanceScaleIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="4" x2="12" y2="19" stroke={STROKE} strokeWidth={SW} />
    <Line x1="6" y1="7" x2="18" y2="7" stroke={STROKE} strokeWidth={SW} />
    <Path
      d="M6 7c0 2.5-1.2 4-3 4.5M18 7c0 2.5 1.2 4 3 4.5"
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinecap="round"
    />
    <Path d="M3 11.5h4.5M16.5 11.5H21" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
    <Circle cx="5.2" cy="12" r="2.2" stroke={STROKE} strokeWidth={SW} />
    <Circle cx="18.8" cy="12" r="2.2" stroke={STROKE} strokeWidth={SW} />
    <Path d="M9 19h6" stroke={STROKE} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

export const PriceIconBadge = ({ children }) => (
  <View style={styles.badge}>{children}</View>
);

const styles = StyleSheet.create({
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
});
