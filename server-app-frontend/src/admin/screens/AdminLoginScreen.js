import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminInput, AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { MailIcon, LockIcon, ShieldIcon, CheckboxCheckIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors } from '../theme/adminTheme';

const AdminLoginScreen = ({ onForgotPassword }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.message);
  };

  return (
    <AdminScreenLayout>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandBlock}>
            <Image
              source={require('../../../asset/images/logo-white.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your admin account</Text>
          </View>

          <View style={styles.formCard}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AdminInput
              label="Email or Mobile"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email or mobile number"
              keyboardType="email-address"
              leftIcon={<MailIcon />}
            />
            <AdminInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={secure}
              onToggleSecure={() => setSecure(s => !s)}
              leftIcon={<LockIcon />}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rememberRow}
                activeOpacity={0.8}
                onPress={() => setRemember(r => !r)}>
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <CheckboxCheckIcon /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onForgotPassword}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <GoldButton
              title="LOGIN"
              onPress={handleLogin}
              loading={loading}
              disabled={!isFormValid || loading}
            />
          </View>

          <View style={styles.secureFooter}>
            <ShieldIcon size={15} />
            <Text style={styles.secureText}>Secure access for authorized users only</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: '68%',
    height: 50,
    marginBottom: 18,
  },
  welcome: {
    color: adminColors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: adminColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formCard: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 20,
    gap: 4,
  },
  error: {
    color: adminColors.errorText,
    backgroundColor: adminColors.errorBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: adminColors.gold,
    borderColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    color: adminColors.textMuted,
    fontSize: 13,
  },
  forgot: {
    color: adminColors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.12)',
  },
  secureText: {
    color: adminColors.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AdminLoginScreen;
