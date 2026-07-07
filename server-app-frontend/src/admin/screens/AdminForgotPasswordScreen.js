import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminInput, AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { BackIcon, MailIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors } from '../theme/adminTheme';

const AdminForgotPasswordScreen = ({ onBack, onOtpSent }) => {
  const insets = useSafeAreaInsets();
  const { requestForgotPasswordOtp } = useAdmin();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    setError('');
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    const result = await requestForgotPasswordOtp(normalizedEmail);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    onOtpSent(normalizedEmail);
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
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>Enter your admin email to receive a reset OTP.</Text>
          <AdminInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            leftIcon={<MailIcon />}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GoldButton
            title="SEND OTP"
            onPress={handleSendOtp}
            loading={loading}
            disabled={!email.trim() || loading}
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
});

export default AdminForgotPasswordScreen;
