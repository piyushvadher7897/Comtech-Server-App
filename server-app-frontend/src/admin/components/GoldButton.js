import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { adminColors } from '../theme/adminTheme';

const GoldButton = ({ title, onPress, disabled, loading, variant = 'primary', style }) => {
  const isOutline = variant === 'outline';
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={isOutline ? adminColors.gold : '#1a1208'} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </TouchableOpacity>
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
