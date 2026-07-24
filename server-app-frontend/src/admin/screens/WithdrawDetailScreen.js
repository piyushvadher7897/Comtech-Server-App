import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import DepositStatusBadge from '../components/DepositStatusBadge';
import GoldButton from '../components/GoldButton';
import { BackIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import {
  WITHDRAW_STATUS,
  APPROVAL_STAGE_LABELS,
  canUserActOnWithdraw,
} from '../constants/withdrawStatus';
import { navigateToAdminScreen } from '../utils/navigation';
import {
  getDisplayPaymentId,
  getDisplayReferenceNumber,
  isMissingWithdrawProfile,
} from '../../services/adminApi';
import { adminColors, adminShadow, getInitials } from '../theme/adminTheme';

const DetailRow = ({ label, value, highlight }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && styles.valueGreen]}>{value || '—'}</Text>
  </View>
);

const formatDate = iso => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const resolveRecordUserId = userID => {
  if (!userID) return '';
  if (typeof userID === 'object') return String(userID._id || userID.id || '');
  return String(userID);
};

const WithdrawDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { withdraws, isManager, isAdmin, isSuperAdmin, getWithdrawById } = useAdmin();
  const withdrawId = route.params?.withdrawId;
  const paramWithdraw = route.params?.withdraw;
  const cached = paramWithdraw || withdraws.find(d => d.id === withdrawId);
  const [withdraw, setWithdraw] = useState(cached || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    (async () => {
      if (cached && !isMissingWithdrawProfile(cached)) {
        setWithdraw(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      const detail = await getWithdrawById(withdrawId);
      if (active) {
        setWithdraw(detail || cached || null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cached, withdrawId, getWithdrawById]);

  if (loading) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator color={adminColors.gold} />
        </View>
      </AdminScreenLayout>
    );
  }

  if (!withdraw) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <Text style={styles.missing}>Withdraw not found.</Text>
        </View>
      </AdminScreenLayout>
    );
  }

  const canTakeAction = canUserActOnWithdraw(withdraw, { isManager, isAdmin, isSuperAdmin });
  const bank = withdraw.bank || {};
  const userId = resolveRecordUserId(withdraw.userID);
  const statusLabel =
    withdraw.status === WITHDRAW_STATUS.PENDING_MANAGER
      ? APPROVAL_STAGE_LABELS.PENDING_ADMIN
      : withdraw.status === WITHDRAW_STATUS.PENDING_ADMIN
        ? APPROVAL_STAGE_LABELS.PENDING_SUPER_ADMIN
        : null;

  const openUserList = () =>
    navigateToAdminScreen(navigation, 'UserList', {
      userId: userId || undefined,
      userName: withdraw.userName,
      email: withdraw.email,
    });

  return (
    <AdminScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(withdraw.userName)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{withdraw.userName}</Text>
            <Text style={styles.userEmail}>{withdraw.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.badgeWrap}>
          <DepositStatusBadge status={withdraw.status} />
          {statusLabel ? <Text style={styles.statusHint}>{statusLabel}</Text> : null}
        </View>

        <View style={styles.card}>
          <DetailRow label="Currency" value={withdraw.currency} />
          <DetailRow
            label="USD Amount"
            value={`$${Number(withdraw.amountUsd).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`}
          />
          <DetailRow
            label="AED Amount"
            value={`AED ${Number(withdraw.amountAed).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`}
            highlight
          />
          <DetailRow label="Payment Method" value={withdraw.paymentMethod} />
          <DetailRow label="Status" value={withdraw.dbStatus} />
          <DetailRow label="Approve Status" value={withdraw.approveStatus} />
          <DetailRow label="Payment ID" value={getDisplayPaymentId(withdraw)} />
          <DetailRow label="Reference Number" value={getDisplayReferenceNumber(withdraw)} />
          <DetailRow label="Description" value={withdraw.description} />
          <DetailRow label="Remarks" value={withdraw.comments || withdraw.lastRemarks || '—'} />
          <DetailRow label="Created At" value={formatDate(withdraw.createdAt)} />
          {bank.accountNumber || bank.bankName ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.activityTitle}>Bank</Text>
              <DetailRow label="Bank Name" value={bank.bankName} />
              <DetailRow label="Account Name" value={bank.accountName || bank.accountHolderName} />
              <DetailRow label="Account Number" value={bank.accountNumber} />
              <DetailRow label="IBAN" value={bank.iban} />
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GoldButton
          title="VIEW USER"
          variant="outline"
          onPress={openUserList}
          style={canTakeAction ? styles.viewUserBtn : undefined}
        />
        {canTakeAction ? (
          <GoldButton
            title="TAKE ACTION"
            onPress={() =>
              navigateToAdminScreen(navigation, 'TakeWithdrawAction', {
                withdrawId: withdraw.id,
                withdraw,
                queueType:
                  withdraw.status === WITHDRAW_STATUS.PENDING_ADMIN
                    ? 'pending_admin'
                    : 'pending_manager',
              })
            }
          />
        ) : null}
      </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: adminColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: { paddingHorizontal: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1a1208', fontSize: 18, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { color: adminColors.textPrimary, fontSize: 18, fontWeight: '800' },
  userEmail: { color: adminColors.textMuted, fontSize: 13, marginTop: 2 },
  badgeWrap: { marginBottom: 16, gap: 6 },
  statusHint: { color: adminColors.textMuted, fontSize: 12 },
  card: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 18,
    ...adminShadow,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 },
  row: { marginBottom: 14 },
  label: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: { color: adminColors.textPrimary, fontSize: 14, fontWeight: '500' },
  valueGreen: { color: adminColors.amountGreen, fontWeight: '700' },
  activityTitle: {
    color: adminColors.goldMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: adminColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 20,
    elevation: 12,
  },
  viewUserBtn: { marginBottom: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: adminColors.textMuted, fontSize: 16 },
});

export default WithdrawDetailScreen;
