import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminInput, AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { BackIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors } from '../theme/adminTheme';

const RESEND_COOLDOWN_SECONDS = 60;

const formatCountdown = seconds => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const AdminOtpScreen = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { pendingLogin, verifyOtp, resendOtp } = useAdmin();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timerId = setTimeout(() => {
      setResendTimer(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [resendTimer]);

  const handleVerify = async () => {
    setError('');
    if (otp.trim().length < 4) {
      setError('Please enter the OTP sent to your email');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(otp.trim());
    setLoading(false);
    if (!result.success) setError(result.message);
  };

  const canResend = resendTimer <= 0 && !resending;

  const handleResend = async () => {
    if (!canResend) return;
    setError('');
    setResendSuccess(false);
    setResending(true);
    const result = await resendOtp();
    setResending(false);
    if (result.success) {
      setResendSuccess(true);
      setResendTimer(RESEND_COOLDOWN_SECONDS);
      setOtp('');
    } else {
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
            Enter the OTP sent to{'\n'}
            <Text style={styles.email}>{pendingLogin?.email}</Text>
          </Text>

          <AdminInput
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GoldButton title="VERIFY" onPress={handleVerify} loading={loading} />

          {resendSuccess ? (
            <Text style={styles.resendSuccess}>OTP sent to your email</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleResend}
            style={styles.resend}
            disabled={!canResend}>
            {resending ? (
              <Text style={styles.resendMuted}>Sending OTP...</Text>
            ) : resendTimer > 0 ? (
              <Text style={styles.resendMuted}>
                Resend OTP in {formatCountdown(resendTimer)}
              </Text>
            ) : (
              <Text style={styles.resendText}>Resend OTP</Text>
            )}
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
    marginBottom: 8,
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
  resendMuted: {
    color: adminColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  resendSuccess: {
    color: '#4ADE80',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AdminOtpScreen;
