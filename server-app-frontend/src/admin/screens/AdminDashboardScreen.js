import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import {
  ClockIcon,
  CheckSmallIcon,
  CrossSmallIcon,
  PendingClockIcon,
  ChevronRightIcon,
  DepositsIcon,
  ApprovalsIcon,
  ShieldIcon,
} from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { DEPOSIT_STATUS, APPROVAL_STAGE_LABELS, formatApprovalActivity } from '../constants/depositStatus';
import { navigateToAdminScreen, navigateToAdminProfile } from '../utils/navigation';
import DepositFilterBar from '../components/DepositFilterBar';
import DepositFilterDrawer from '../components/DepositFilterDrawer';
import DepositNotificationCard from '../components/DepositNotificationCard';
import { getAdminTabBarPadding } from '../components/AdminTabBar';
import { adminColors, adminShadow } from '../theme/adminTheme';

const getFirstName = name => {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
};

const formatToday = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const ActivityIcon = ({ status }) => {
  if (status === DEPOSIT_STATUS.APPROVED) {
    return (
      <View style={[styles.actIcon, styles.actIconGreen]}>
        <CheckSmallIcon color="#4ADE80" size={15} />
      </View>
    );
  }
  if (status === DEPOSIT_STATUS.REJECTED) {
    return (
      <View style={[styles.actIcon, styles.actIconRed]}>
        <CrossSmallIcon color="#F87171" size={15} />
      </View>
    );
  }
  return (
    <View style={[styles.actIcon, styles.actIconBlue]}>
      <PendingClockIcon color="#60A5FA" size={15} />
    </View>
  );
};

const StatCard = ({ label, value, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderColor: accent.border, backgroundColor: accent.bg }]}
    onPress={onPress}
    activeOpacity={0.85}>
    <Text style={[styles.statValue, { color: accent.value }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const QuickLink = ({ icon, title, subtitle, count, accent, onPress }) => (
  <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.quickLinkIcon, { backgroundColor: accent.bg, borderColor: accent.border }]}>
      {icon}
    </View>
    <View style={styles.quickLinkBody}>
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <Text style={styles.quickLinkSub}>{subtitle}</Text>
    </View>
    <View style={styles.quickLinkRight}>
      {count > 0 ? (
        <View style={[styles.quickLinkBadge, { backgroundColor: accent.badgeBg }]}>
          <Text style={[styles.quickLinkBadgeText, { color: accent.icon }]}>{count}</Text>
        </View>
      ) : null}
      <ChevronRightIcon color={adminColors.textDim} size={16} />
    </View>
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    stats,
    deposits,
    depositTotal,
    withdrawTotal,
    withdraws,
    depositDateRange,
    statusFilter,
    loadAdminData,
    applyDepositFilters,
    resetDepositFilters,
    refreshing,
  } = useAdmin();
  const displayName = user?.name || 'Admin';
  const firstName = getFirstName(displayName);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAdminData({ silent: true });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const recentActivity = deposits
    .filter(d => d.activity?.length > 0)
    .flatMap(d =>
      d.activity.map((a, idx) => ({
        id: `${d.id}-${idx}`,
        userName: d.userName,
        action: formatApprovalActivity(a.action),
        status: d.status,
        time: new Date(a.at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })),
    )
    .slice(0, 5);

  const handleQuickStatus = useCallback(
    async nextStatus => {
      const range = depositDateRange || { startDate: '', endDate: '' };
      await applyDepositFilters({
        statusFilter: nextStatus,
        startDate: range.startDate,
        endDate: range.endDate,
      });
    },
    [applyDepositFilters, depositDateRange],
  );

  const openApprovals = (initialTab = 'pending_manager') => {
    navigation.navigate('AdminTabs', {
      screen: 'AdminApprovals',
      params: { initialTab },
    });
  };

  const openFilteredList = () => {
    navigateToAdminScreen(navigation, 'FundDepositList', { initialTab: 'all' });
  };

  const defaultApprovalTab =
    stats.pendingAdmin > 0 && stats.pendingManager === 0 ? 'pending_admin' : 'pending_manager';

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={displayName}
        compact
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: 8, paddingBottom: getAdminTabBarPadding(insets) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAdminData({ silent: true, force: true })}
            tintColor={adminColors.gold}
          />
        }
        showsVerticalScrollIndicator={false}>
        <DepositNotificationCard variant="compact" />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.greetingSub}>Here is your overview for today</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{formatToday()}</Text>
            </View>
          </View>

          {(stats.combinedTotalPending || stats.totalPending) > 0 ? (
            <TouchableOpacity
              style={styles.primaryCta}
              activeOpacity={0.9}
              onPress={() => openApprovals(defaultApprovalTab)}>
              <View style={styles.primaryCtaLeft}>
                <View style={styles.primaryCtaIcon}>
                  <ClockIcon color={adminColors.gold} size={20} />
                </View>
                <View>
                  <Text style={styles.primaryCtaTitle}>Review pending approvals</Text>
                  <Text style={styles.primaryCtaSub}>
                    {stats.combinedTotalPending || stats.totalPending} request
                    {(stats.combinedTotalPending || stats.totalPending) === 1 ? '' : 's'} need your
                    attention
                  </Text>
                </View>
              </View>
              <ChevronRightIcon color={adminColors.gold} size={20} />
            </TouchableOpacity>
          ) : (
            <View style={styles.allClearBanner}>
              <CheckSmallIcon color="#4ADE80" size={18} />
              <Text style={styles.allClearText}>All caught up — no pending approvals</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>At a glance</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Pending"
            value={stats.combinedTotalPending || stats.totalPending}
            accent={{
              bg: 'rgba(34, 197, 94, 0.12)',
              border: 'rgba(74, 222, 128, 0.28)',
              value: '#86EFAC',
            }}
            onPress={() => openApprovals(defaultApprovalTab)}
          />
          <StatCard
            label="Admin"
            value={(stats.pendingManager || 0) + (stats.withdrawPendingManager || 0)}
            accent={{
              bg: 'rgba(212, 175, 55, 0.1)',
              border: 'rgba(212, 175, 55, 0.28)',
              value: adminColors.goldLight,
            }}
            onPress={() => openApprovals('pending_manager')}
          />
          <StatCard
            label="Super Admin"
            value={(stats.pendingAdmin || 0) + (stats.withdrawPendingAdmin || 0)}
            accent={{
              bg: 'rgba(74, 111, 165, 0.15)',
              border: 'rgba(96, 165, 250, 0.28)',
              value: '#93C5FD',
            }}
            onPress={() => openApprovals('pending_admin')}
          />
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterCardHeader}>
            <TouchableOpacity
              style={styles.filterCardHeaderTap}
              onPress={() => setFiltersExpanded(prev => !prev)}
              activeOpacity={0.85}>
              <View style={styles.filterCardHeaderLeft}>
                <Text style={styles.filterCardTitle}>Deposit filters</Text>
                <Text style={styles.filterCardSub}>
                  {filtersExpanded ? 'Tap to collapse' : 'Tap to expand — status & date range'}
                </Text>
              </View>
              <View style={filtersExpanded ? styles.chevronDown : undefined}>
                <ChevronRightIcon color={adminColors.textMuted} size={16} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={openFilteredList} activeOpacity={0.85} hitSlop={8}>
              <Text style={styles.filterCardLink}>View list</Text>
            </TouchableOpacity>
          </View>

          {filtersExpanded ? (
            <DepositFilterBar
              compact
              statusFilter={statusFilter}
              depositDateRange={depositDateRange}
              onStatusChange={handleQuickStatus}
              onOpenFilters={() => setFilterOpen(true)}
              onClearFilters={resetDepositFilters}
            />
          ) : null}
        </View>

        <DepositFilterDrawer
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          initialStatusFilter={statusFilter}
          initialDateRange={depositDateRange}
          onApply={applyDepositFilters}
          onReset={resetDepositFilters}
        />

        <Text style={styles.sectionTitle}>Quick access</Text>
        <View style={styles.quickLinksCard}>
          <QuickLink
            icon={<DepositsIcon focused size={20} />}
            title="All fund deposits"
            subtitle="Browse the full deposit list"
            count={depositTotal || deposits.length}
            accent={{
              bg: 'rgba(212, 175, 55, 0.12)',
              border: 'rgba(212, 175, 55, 0.25)',
              icon: adminColors.gold,
              badgeBg: 'rgba(212, 175, 55, 0.15)',
            }}
            onPress={() =>
              navigateToAdminScreen(navigation, 'FundDepositList', { initialTab: 'all' })
            }
          />
          <View style={styles.quickLinkDivider} />
          <QuickLink
            icon={<DepositsIcon focused size={20} />}
            title="All fund withdraws"
            subtitle="Browse the full withdraw list"
            count={withdrawTotal || (withdraws && withdraws.length) || 0}
            accent={{
              bg: 'rgba(249, 115, 22, 0.12)',
              border: 'rgba(251, 146, 60, 0.25)',
              icon: '#FB923C',
              badgeBg: 'rgba(249, 115, 22, 0.15)',
            }}
            onPress={() =>
              navigateToAdminScreen(navigation, 'FundWithdrawList', { initialTab: 'all' })
            }
          />
          <View style={styles.quickLinkDivider} />
          <QuickLink
            icon={<ApprovalsIcon focused size={20} />}
            title={`${APPROVAL_STAGE_LABELS.ADMIN} approvals`}
            subtitle={`Requests waiting for ${APPROVAL_STAGE_LABELS.ADMIN.toLowerCase()} review`}
            count={(stats.pendingManager || 0) + (stats.withdrawPendingManager || 0)}
            accent={{
              bg: 'rgba(34, 197, 94, 0.12)',
              border: 'rgba(74, 222, 128, 0.25)',
              icon: '#4ADE80',
              badgeBg: 'rgba(34, 197, 94, 0.15)',
            }}
            onPress={() => openApprovals('pending_manager')}
          />
          <View style={styles.quickLinkDivider} />
          <QuickLink
            icon={<ShieldIcon color="#93C5FD" size={20} />}
            title={`${APPROVAL_STAGE_LABELS.SUPER_ADMIN} approvals`}
            subtitle={`Requests waiting for ${APPROVAL_STAGE_LABELS.SUPER_ADMIN.toLowerCase()} sign-off`}
            count={(stats.pendingAdmin || 0) + (stats.withdrawPendingAdmin || 0)}
            accent={{
              bg: 'rgba(74, 111, 165, 0.15)',
              border: 'rgba(96, 165, 250, 0.25)',
              icon: '#93C5FD',
              badgeBg: 'rgba(74, 111, 165, 0.2)',
            }}
            onPress={() => openApprovals('pending_admin')}
          />
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={styles.activityCard}>
          {recentActivity.length === 0 ? (
            <Text style={styles.emptyActivity}>No recent activity yet.</Text>
          ) : (
            recentActivity.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View style={styles.activityDivider} /> : null}
                <View style={styles.activityRow}>
                  <ActivityIcon status={item.status} />
                  <View style={styles.activityBody}>
                    <Text style={styles.activityName}>{item.userName}</Text>
                    <Text style={styles.activityAction}>{item.action}</Text>
                  </View>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 16,
    marginBottom: 20,
    ...adminShadow,
  },
  heroTop: {
    gap: 12,
    marginBottom: 14,
  },
  heroText: {
    gap: 4,
  },
  greeting: {
    color: adminColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  greetingSub: {
    color: adminColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.cardBgLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateBadgeText: {
    color: adminColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 14,
    gap: 10,
  },
  primaryCtaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaTitle: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryCtaSub: {
    color: adminColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  allClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  allClearText: {
    color: '#86EFAC',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: adminColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    ...adminShadow,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: adminColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterCard: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    marginBottom: 22,
    overflow: 'hidden',
    ...adminShadow,
  },
  filterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  filterCardHeaderTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterCardHeaderLeft: {
    flex: 1,
    gap: 3,
  },
  filterCardTitle: {
    color: adminColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  filterCardSub: {
    color: adminColors.textDim,
    fontSize: 11,
  },
  filterCardLink: {
    color: adminColors.gold,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 4,
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
  },
  quickLinksCard: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    marginBottom: 22,
    overflow: 'hidden',
    ...adminShadow,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  quickLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkBody: {
    flex: 1,
    gap: 3,
  },
  quickLinkTitle: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  quickLinkSub: {
    color: adminColors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  quickLinkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickLinkBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  quickLinkBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickLinkDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 14,
  },
  activityCard: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 4,
    marginBottom: 8,
    ...adminShadow,
  },
  emptyActivity: {
    color: adminColors.textMuted,
    fontSize: 13,
    padding: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  activityDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 12,
  },
  actIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actIconGreen: { backgroundColor: 'rgba(22, 163, 74, 0.25)' },
  actIconRed: { backgroundColor: 'rgba(220, 38, 38, 0.25)' },
  actIconBlue: { backgroundColor: 'rgba(37, 99, 235, 0.25)' },
  activityBody: {
    flex: 1,
  },
  activityName: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activityAction: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  activityTime: {
    color: adminColors.textDim,
    fontSize: 11,
  },
});

export default AdminDashboardScreen;
