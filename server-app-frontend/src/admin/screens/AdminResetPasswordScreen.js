import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminInput, AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { BackIcon, LockIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors } from '../theme/adminTheme';

const AdminResetPasswordScreen = ({ email, otp, onBack, onSuccess }) => {
  const insets = useSafeAreaInsets();
  const { resetForgotPassword } = useAdmin();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    setError('');
    setSuccessMessage('');
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await resetForgotPassword({ email, otp, password });
    setLoading(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSuccessMessage(result.message || 'Password reset successfully');
    setTimeout(() => onSuccess(), 700);
  };

  return (
    <AdminScreenLayout>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>Create a new password for your admin account.</Text>
          <AdminInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            secureTextEntry={secure}
            onToggleSecure={() => setSecure(v => !v)}
            leftIcon={<LockIcon />}
          />
          <AdminInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry={secureConfirm}
            onToggleSecure={() => setSecureConfirm(v => !v)}
            leftIcon={<LockIcon />}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
          <GoldButton
            title="RESET PASSWORD"
            onPress={handleReset}
            loading={loading}
            disabled={!password.trim() || !confirmPassword.trim() || loading}
          />
        </View>
      </KeyboardAvoidingView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: adminColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  subtitle: {
    color: adminColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  error: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  success: {
    color: '#4ADE80',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AdminResetPasswordScreen;
