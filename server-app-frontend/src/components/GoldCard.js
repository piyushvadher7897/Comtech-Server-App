import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, cardShadow } from '../theme/theme';

const GoldCard = ({ children, style, compact, centered }) => (
  <View
    style={[
      styles.card,
      compact && styles.cardCompact,
      centered && styles.cardCentered,
      style,
    ]}>
    {children}
  </View>
);

export const GoldMeta = ({ children, style, centered }) => (
  <Text
    style={[styles.meta, centered && styles.metaCentered, style]}
    numberOfLines={2}>
    {children}
  </Text>
);

export const GoldLabel = ({ children, style, centered, light }) => (
  <Text
    style={[
      styles.label,
      centered && styles.labelCentered,
      light && styles.labelLight,
      style,
    ]}
    numberOfLines={2}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 14,
    ...cardShadow,
  },
  cardCompact: {
    padding: 12,
  },
  cardCentered: {
    alignItems: 'center',
  },
  label: {
    color: colors.goldMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelCentered: {
    textAlign: 'center',
  },
  labelLight: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  metaCentered: {
    textAlign: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    minHeight: 28,
  },
  valueReady: {
    color: colors.goldLight,
  },
  valueLoading: {
    color: colors.goldMuted,
    fontSize: 26,
    letterSpacing: 4,
  },
  valueUnavailable: {
    color: colors.textDim,
    fontSize: 24,
  },
  valueStale: {
    color: colors.goldLight,
    opacity: 0.72,
  },
  valueSmall: {
    fontSize: 18,
  },
  valueLarge: {
    fontSize: 26,
    minHeight: 34,
  },
  valueCentered: {
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
});

const valueVariantStyles = {
  ready: styles.valueReady,
  loading: styles.valueLoading,
  unavailable: styles.valueUnavailable,
  stale: styles.valueStale,
};

const valueLightStyles = {
  ready: { color: colors.textPrimary },
  loading: { color: colors.textMuted, fontSize: 26, letterSpacing: 4 },
  unavailable: { color: colors.textDim, fontSize: 24 },
  stale: { color: colors.textPrimary, opacity: 0.75 },
};

export const GoldValue = ({
  children,
  style,
  small,
  large,
  centered,
  light,
  variant = 'ready',
}) => (
  <Text
    style={[
      styles.value,
      small && styles.valueSmall,
      large && styles.valueLarge,
      centered && styles.valueCentered,
      light
        ? valueLightStyles[variant] ?? valueLightStyles.ready
        : valueVariantStyles[variant] ?? valueVariantStyles.ready,
      style,
    ]}>
    {children}
  </Text>
);

export default GoldCard;
