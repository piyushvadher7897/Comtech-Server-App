import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { adminColors } from '../theme/adminTheme';
import { EyeIcon, EyeOffIcon } from './AdminIcons';

export const AdminInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  onToggleSecure,
  keyboardType,
  autoCapitalize,
  leftIcon,
  maxLength,
}) => (
  <View style={styles.wrap}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <View style={styles.inputRow}>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <TextInput
        style={[styles.input, leftIcon && styles.inputWithIcon]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={adminColors.textDim}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        maxLength={maxLength}
      />
      {onToggleSecure ? (
        <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn}>
          {secureTextEntry ? <EyeIcon /> : <EyeOffIcon />}
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

export const AdminScreenLayout = ({ children }) => (
  <View style={styles.bg}>
    <View style={styles.glowTop} />
    <View style={styles.glowBottom} />
    <View style={styles.inner}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(212, 175, 55, 0.055)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(212, 175, 55, 0.025)',
  },
  inner: {
    flex: 1,
  },
  wrap: {
    marginBottom: 16,
  },
  label: {
    color: adminColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
  },
  leftIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    color: adminColors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
