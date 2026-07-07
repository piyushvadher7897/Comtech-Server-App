import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminInput, AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { BackIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors } from '../theme/adminTheme';

const AdminForgotOtpScreen = ({ email, onBack, onContinue }) => {
  const insets = useSafeAreaInsets();
  const { requestForgotPasswordOtp } = useAdmin();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const handleContinue = () => {
    setError('');
    const normalizedOtp = String(otp || '').trim();
    if (normalizedOtp.length < 4) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    onContinue(normalizedOtp);
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    const result = await requestForgotPasswordOtp(email);
    setResending(false);
    if (!result.success) {
      setError(result.message || 'Could not resend OTP. Try again.');
    }
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
          <Text style={styles.headerTitle}>Verify OTP</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Enter the reset OTP sent to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
          <AdminInput
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter OTP"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GoldButton
            title="CONTINUE"
            onPress={handleContinue}
            disabled={!otp.trim()}
          />
          <TouchableOpacity onPress={handleResend} style={styles.resend} disabled={resending}>
            <Text style={styles.resendText}>{resending ? 'Sending...' : 'Resend OTP'}</Text>
          </TouchableOpacity>
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
  email: {
    color: adminColors.gold,
    fontWeight: '700',
  },
  error: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  resend: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: adminColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminForgotOtpScreen;
