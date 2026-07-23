import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import { DepositsIcon, WithdrawIcon, ChevronRightIcon, ApprovalsIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminScreen, navigateToAdminProfile } from '../utils/navigation';
import { getAdminTabBarPadding } from '../components/AdminTabBar';
import { adminColors, adminShadow } from '../theme/adminTheme';

const FundCard = ({
  tone,
  icon,
  title,
  subtitle,
  pendingCount,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) => {
  const isDeposit = tone === 'deposit';
  const accent = isDeposit
    ? {
        border: 'rgba(52, 211, 153, 0.4)',
        bg: 'rgba(52, 211, 153, 0.08)',
        chipBg: 'rgba(52, 211, 153, 0.18)',
        chipText: '#34D399',
        iconBg: 'rgba(52, 211, 153, 0.16)',
      }
    : {
        border: 'rgba(251, 146, 60, 0.4)',
        bg: 'rgba(251, 146, 60, 0.08)',
        chipBg: 'rgba(251, 146, 60, 0.18)',
        chipText: '#FB923C',
        iconBg: 'rgba(251, 146, 60, 0.16)',
      };

  return (
    <View style={[styles.card, { borderColor: accent.border, backgroundColor: accent.bg }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: accent.iconBg }]}>{icon}</View>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{subtitle}</Text>
        </View>
        {pendingCount > 0 ? (
          <View style={[styles.pendingChip, { backgroundColor: accent.chipBg }]}>
            <Text style={[styles.pendingChipText, { color: accent.chipText }]}>
              {pendingCount} pending
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onPrimary} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        <ChevronRightIcon color="#1a1208" size={16} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.85}>
        <ApprovalsIcon focused size={16} />
        <Text style={[styles.secondaryBtnText, { color: accent.chipText }]}>{secondaryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const AdminDepositsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, stats } = useAdmin();

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={user && user.name}
        compact
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: getAdminTabBarPadding(insets) },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Funds</Text>
        <Text style={styles.pageSub}>
          Deposits and withdraws are separate. Pick one path below — no mix-up.
        </Text>

        <FundCard
          tone="deposit"
          icon={<DepositsIcon focused size={22} />}
          title="Fund Deposit"
          subtitle="Money coming into user wallets"
          pendingCount={stats.totalPending || 0}
          primaryLabel="Open deposit list"
          onPrimary={() =>
            navigateToAdminScreen(navigation, 'FundDepositList', { initialTab: 'all' })
          }
          secondaryLabel="Approve deposits"
          onSecondary={() =>
            navigation.navigate('AdminApprovals', {
              kind: 'deposit',
              initialTab: 'pending_manager',
            })
          }
        />

        <FundCard
          tone="withdraw"
          icon={<WithdrawIcon focused size={22} />}
          title="Fund Withdraw"
          subtitle="Money going out to user banks"
          pendingCount={stats.withdrawTotalPending || 0}
          primaryLabel="Open withdraw list"
          onPrimary={() =>
            navigateToAdminScreen(navigation, 'FundWithdrawList', { initialTab: 'all' })
          }
          secondaryLabel="Approve withdraws"
          onSecondary={() =>
            navigation.navigate('AdminApprovals', {
              kind: 'withdraw',
              initialTab: 'pending_manager',
            })
          }
        />

        <Text style={styles.hint}>
          Tip: use the menu (☰) for Users, Buy/Sell gold, and Audits — Deposit and Withdraw stay
          separate.
        </Text>
      </ScrollView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageTitle: {
    color: adminColors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  pageSub: {
    color: adminColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...adminShadow,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitles: { flex: 1 },
  cardTitle: {
    color: adminColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  cardSub: {
    color: adminColors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  pendingChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: adminColors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#1a1208',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    color: adminColors.textDim,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
});

export default AdminDepositsScreen;
