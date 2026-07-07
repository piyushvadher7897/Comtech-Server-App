import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_CONFIG, DEPOSIT_STATUS } from '../constants/depositStatus';

const DepositStatusBadge = ({ status, compact }) => {
  const config =
    STATUS_CONFIG[status] || STATUS_CONFIG[DEPOSIT_STATUS.PENDING_MANAGER];
  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}>
      <Text style={[styles.label, compact && styles.labelCompact, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: 10,
  },
});

export default DepositStatusBadge;
