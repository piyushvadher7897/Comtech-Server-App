import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { adminColors } from '../theme/adminTheme';

const GoldButton = ({ title, onPress, disabled, loading, variant = 'primary', style }) => {
  const isOutline = variant === 'outline';
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isOutline && styles.buttonOutline,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      android_ripple={
        isOutline
          ? { color: 'rgba(212, 175, 55, 0.18)' }
          : { color: 'rgba(26, 18, 8, 0.12)' }
      }
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}>
      {loading ? (
        <ActivityIndicator color={isOutline ? adminColors.gold : '#1a1208'} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: adminColors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0D78C',
    shadowColor: adminColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 54,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: adminColors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  text: {
    color: '#1a1208',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  textOutline: {
    color: adminColors.gold,
  },
});

export default GoldButton;
