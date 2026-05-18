import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme/theme';

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth={1.2} opacity={0.9} />
    <Path
      d="M4.2 7.2l1.8 1.8 3.8-4"
      stroke="#fff"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CrossIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Circle cx="7" cy="7" r="6" stroke="#fff" strokeWidth={1.2} opacity={0.9} />
    <Line x1="5" y1="5" x2="9" y2="9" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" />
    <Line x1="9" y1="5" x2="5" y2="9" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" />
  </Svg>
);

const StatusBadge = ({ on }) => (
  <View style={[styles.badge, on ? styles.badgeOn : styles.badgeOff]}>
    {on ? <CheckIcon /> : <CrossIcon />}
    <Text style={styles.label}>{on ? 'ON' : 'OFF'}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  badgeOn: {
    backgroundColor: '#15803D',
    borderColor: 'rgba(74, 222, 128, 0.45)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeOff: {
    backgroundColor: '#B91C1C',
    borderColor: 'rgba(248, 113, 113, 0.45)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.6,
  },
});

export default StatusBadge;
