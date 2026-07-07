import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import GoldButton from '../components/GoldButton';
import { MailIcon, ShieldIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { adminColors, adminShadow, getInitials } from '../theme/adminTheme';
import { getAdminTabBarPadding } from '../components/AdminTabBar';

const getRoleLabel = user => {
  if (user?.isSuperAdmin) return 'Super Admin';
  if (user?.role === 'admin') return 'Super Admin';
  return 'Admin';
};

const getRoleShort = user => {
  if (user?.isSuperAdmin) return 'Super Admin';
  if (user?.role === 'admin') return 'Super Admin';
  return 'Admin';
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const AdminProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAdmin();
  const displayName = user?.name || 'User';
  const roleLabel = getRoleLabel(user);

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={displayName}
        profileActive
        compact
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: 12, paddingBottom: getAdminTabBarPadding(insets) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <View style={styles.roleBadge}>
            <ShieldIcon size={14} />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.card}>
          <InfoRow
            icon={<ShieldIcon size={18} />}
            label="Role"
            value={getRoleShort(user)}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={<MailIcon size={18} />}
            label="Email"
            value={user?.email || '—'}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={<ShieldIcon size={18} color={adminColors.goldMuted} />}
            label="Application"
            value="ComTech Gold Deposit Approval"
          />
        </View>

        <GoldButton
          title="LOGOUT"
          onPress={logout}
          variant="outline"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: adminColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    ...adminShadow,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  avatarText: {
    color: '#1a1208',
    fontSize: 30,
    fontWeight: '800',
  },
  name: {
    color: adminColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  email: {
    color: adminColors.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 14,
  },
  roleText: {
    color: adminColors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: adminColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 28,
    ...adminShadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    color: adminColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  logoutBtn: {
    width: '100%',
  },
});

export default AdminProfileScreen;
