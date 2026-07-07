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
  DEPOSIT_STATUS,
  APPROVAL_STAGE_LABELS,
  canUserActOnDeposit,
} from '../constants/depositStatus';
import { navigateToAdminScreen } from '../utils/navigation';
import { getDisplayPaymentId, getDisplayReferenceNumber } from '../../services/adminApi';
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

const DepositDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { deposits, user, isManager, isAdmin, isSuperAdmin, getDepositById } = useAdmin();
  const depositId = route.params?.depositId;
  const cached = deposits.find(d => d.id === depositId);
  const [deposit, setDeposit] = useState(cached || null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    (async () => {
      if (cached) {
        setDeposit(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      const detail = await getDepositById(depositId);
      if (active) {
        setDeposit(detail);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cached, depositId, getDepositById]);

  if (loading) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator color={adminColors.gold} />
        </View>
      </AdminScreenLayout>
    );
  }

  if (!deposit) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <Text style={styles.missing}>Deposit not found.</Text>
        </View>
      </AdminScreenLayout>
    );
  }

  const canTakeAction = canUserActOnDeposit(deposit, { isManager, isAdmin, isSuperAdmin });

  const statusLabel =
    deposit.status === DEPOSIT_STATUS.PENDING_MANAGER
      ? APPROVAL_STAGE_LABELS.PENDING_ADMIN
      : deposit.status === DEPOSIT_STATUS.PENDING_ADMIN
        ? APPROVAL_STAGE_LABELS.PENDING_SUPER_ADMIN
        : null;

  return (
    <AdminScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (canTakeAction ? 100 : 24) },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(deposit.userName)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{deposit.userName}</Text>
            <Text style={styles.userEmail}>{deposit.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.badgeWrap}>
          <DepositStatusBadge status={deposit.status} />
          {statusLabel ? <Text style={styles.statusHint}>{statusLabel}</Text> : null}
        </View>

        <View style={styles.card}>
          <DetailRow label="Currency" value={deposit.currency} />
          <DetailRow
            label="USD Amount"
            value={`$${Number(deposit.amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          />
          <DetailRow
            label="AED Amount"
            value={`AED ${Number(deposit.amountAed).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            highlight
          />
          <DetailRow label="Payment Method" value={deposit.paymentMethod} />
          <DetailRow label="Status" value={deposit.dbStatus} />
          <DetailRow label="Approve Status" value={deposit.approveStatus} />
          {(isAdmin || isSuperAdmin) && (
            <DetailRow
              label={`${APPROVAL_STAGE_LABELS.ADMIN} Approved By`}
              value={deposit.adminApprovedByName || deposit.managerApprovedByName}
            />
          )}
          {(isAdmin || isSuperAdmin) && (
            <DetailRow
              label={`${APPROVAL_STAGE_LABELS.SUPER_ADMIN} Approved By`}
              value={deposit.superAdminApprovedByName}
            />
          )}
          {deposit.adminApprovedViaLabel || deposit.managerApprovedViaLabel ? (
            <DetailRow
              label={APPROVAL_STAGE_LABELS.ADMIN_APPROVED_VIA}
              value={deposit.adminApprovedViaLabel || deposit.managerApprovedViaLabel}
            />
          ) : null}
          {deposit.superAdminApprovedViaLabel ? (
            <DetailRow
              label={APPROVAL_STAGE_LABELS.SUPER_ADMIN_APPROVED_VIA}
              value={deposit.superAdminApprovedViaLabel}
            />
          ) : null}
          <DetailRow label="Payment ID" value={getDisplayPaymentId(deposit)} />
          <DetailRow label="Transaction No" value={deposit.transactionNo} />
          <DetailRow label="Reference Number" value={getDisplayReferenceNumber(deposit)} />
          <DetailRow label="Description" value={deposit.description} />
          <DetailRow label="Comments" value={deposit.comments || '—'} />
          <DetailRow label="Created At" value={formatDate(deposit.createdAt)} />

          {deposit.activity?.length > 0 ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.activityTitle}>Activity</Text>
              {deposit.activity.map((a, i) => (
                <Text key={i} style={styles.activityItem}>
                  {a.action} — {formatDate(a.at)}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      {canTakeAction ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <GoldButton
            title="TAKE ACTION"
            onPress={() =>
              navigateToAdminScreen(navigation, 'TakeAction', {
                depositId: deposit.id,
                deposit,
                queueType:
                  deposit.status === DEPOSIT_STATUS.PENDING_ADMIN
                    ? 'pending_admin'
                    : 'pending_manager',
              })
            }
          />
        </View>
      ) : null}
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
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
  activityItem: { color: adminColors.textMuted, fontSize: 12, marginBottom: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: adminColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: adminColors.textMuted, fontSize: 16 },
});

export default DepositDetailScreen;
