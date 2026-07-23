import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import DepositStatusBadge from '../components/DepositStatusBadge';
import DepositFilterDrawer from '../components/DepositFilterDrawer';
import DepositFilterBar from '../components/DepositFilterBar';
import { ChevronRightIcon, SearchIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import {
  formatWebAdminDateRangeLabel,
  fetchWithdrawApprovalQueue,
  getWithdrawListNotes,
  getDisplayReferenceNumber,
  isDefaultDepositDateRange,
} from '../../services/adminApi';
import {
  LIST_TABS,
  STATUS_FILTERS,
  APPROVAL_STAGE_LABELS,
  matchesListTab,
  matchesStatusFilter,
  getStatusFilterLabel,
  getWithdrawStatusSummary,
  canUserActOnWithdraw,
} from '../constants/withdrawStatus';
import { navigateToAdminScreen, navigateToAdminProfile } from '../utils/navigation';
import { adminColors, adminShadow } from '../theme/adminTheme';
import AdminSegmentedTabs from '../components/AdminSegmentedTabs';
import { getAdminTabBarPadding } from '../components/AdminTabBar';

const formatDate = iso => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatAmount = amount =>
  `AED ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const TABS = [
  { id: LIST_TABS.ALL, label: 'All' },
  { id: LIST_TABS.MANAGER, label: 'Admin' },
  { id: LIST_TABS.ADMIN, label: 'Super Admin' },
];

const FundWithdrawListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    withdraws,
    withdrawTotal,
    withdrawDateRange,
    withdrawStatusFilter,
    user,
    isManager,
    isAdmin,
    isSuperAdmin,
    loadWithdrawData,
    applyWithdrawFilters,
    resetWithdrawFilters,
    loadMoreWithdraws,
    hasMoreWithdraws,
    loadingMoreWithdraws,
    refreshingWithdraws,
    withdrawError,
    loadingWithdraws,
  } = useAdmin();
  const embedded = route.params?.embedded;
  const initialTab = route.params?.initialTab || LIST_TABS.ALL;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState(route.params?.q || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [queueWithdraws, setQueueWithdraws] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const handleTabChange = useCallback(nextTab => {
    setActiveTab(prev => (prev === nextTab ? prev : nextTab));
  }, []);

  const onQueueTab = activeTab === LIST_TABS.MANAGER || activeTab === LIST_TABS.ADMIN;

  const loadQueue = useCallback(async () => {
    if (!onQueueTab) return;
    setQueueLoading(true);
    try {
      const workflow =
        activeTab === LIST_TABS.MANAGER ? 'pending_manager' : 'pending_admin';
      const result = await fetchWithdrawApprovalQueue(workflow);
      setQueueWithdraws(result.docs || []);
    } catch {
      setQueueWithdraws([]);
    } finally {
      setQueueLoading(false);
    }
  }, [activeTab, onQueueTab]);

  useEffect(() => {
    if (onQueueTab) {
      loadQueue();
    }
  }, [onQueueTab, loadQueue]);

  useFocusEffect(
    useCallback(() => {
      loadWithdrawData({ silent: true });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const dateRangeLabel = withdrawDateRange
    ? formatWebAdminDateRangeLabel(withdrawDateRange)
    : formatWebAdminDateRangeLabel();

  const totalCount = onQueueTab ? queueWithdraws.length : withdrawTotal || withdraws.length;
  const loadedCount = onQueueTab ? queueWithdraws.length : withdraws.length;
  const hasActiveFilters =
    withdrawStatusFilter !== STATUS_FILTERS.ALL ||
    (withdrawDateRange && !isDefaultDepositDateRange(withdrawDateRange));

  const endReachedDuringMomentum = useRef(true);

  const handleEndReached = useCallback(() => {
    if (onQueueTab || !hasMoreWithdraws || loadingWithdraws || refreshingWithdraws || loadingMoreWithdraws) {
      return;
    }
    if (endReachedDuringMomentum.current) return;
    loadMoreWithdraws();
  }, [
    onQueueTab,
    hasMoreWithdraws,
    loadingWithdraws,
    refreshingWithdraws,
    loadingMoreWithdraws,
    loadMoreWithdraws,
  ]);

  const handleQuickStatus = useCallback(
    async nextStatus => {
      const range = withdrawDateRange || { startDate: '', endDate: '' };
      await applyWithdrawFilters({
        statusFilter: nextStatus,
        startDate: range.startDate,
        endDate: range.endDate,
      });
    },
    [applyWithdrawFilters, withdrawDateRange],
  );

  const sourceWithdraws = onQueueTab ? queueWithdraws : withdraws;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sourceWithdraws.filter(d => {
      if (!onQueueTab) {
        if (!matchesListTab(d, activeTab)) return false;
        if (!matchesStatusFilter(d, withdrawStatusFilter)) return false;
      }
      if (!q) return true;
      return (
        (d.userName || '').toLowerCase().includes(q) ||
        (d.referenceNumber || '').toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q)) ||
        String(d.comments || '').toLowerCase().includes(q) ||
        String(d.description || '').toLowerCase().includes(q) ||
        String(d.dbStatus || '').toLowerCase().includes(q)
      );
    });
  }, [sourceWithdraws, activeTab, onQueueTab, withdrawStatusFilter, search]);

  const renderItem = useCallback(
    ({ item }) => {
      const canAct =
        onQueueTab && canUserActOnWithdraw(item, { isManager, isAdmin, isSuperAdmin });
      const queueType =
        activeTab === LIST_TABS.MANAGER ? 'pending_manager' : 'pending_admin';
      const notes = getWithdrawListNotes(item);

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            canAct
              ? navigateToAdminScreen(navigation, 'TakeWithdrawAction', {
                  withdrawId: item.id,
                  withdraw: item,
                  queueType,
                })
              : navigateToAdminScreen(navigation, 'WithdrawDetail', {
                  withdrawId: item.id,
                })
          }
          activeOpacity={0.85}>
          <View style={styles.cardMain}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{item.userName}</Text>
              <Text style={styles.amount}>{formatAmount(item.amountAed)}</Text>
            </View>
            <Text style={styles.ref}>
              {getDisplayReferenceNumber(item)} · {formatDate(item.createdAt)}
            </Text>
            <Text style={styles.statusSummary}>{getWithdrawStatusSummary(item)}</Text>
            {notes.map(note => (
              <Text
                key={note.label}
                style={styles.listNote}
                numberOfLines={1}
                ellipsizeMode="tail">
                {note.label}: {note.text}
              </Text>
            ))}
            <View style={styles.cardBottom}>
              <DepositStatusBadge status={item.status} compact />
            </View>
          </View>
          <ChevronRightIcon />
        </TouchableOpacity>
      );
    },
    [activeTab, isAdmin, isManager, isSuperAdmin, navigation, onQueueTab],
  );

  const emptyMessage = withdrawError
    ? withdrawError
    : loadingWithdraws || queueLoading
      ? 'Loading withdraws...'
      : activeTab === LIST_TABS.ALL
        ? 'No fund withdraws found.'
        : 'No withdraws in this queue. Try the All tab.';

  return (
    <AdminScreenLayout>
      <View style={styles.topSection}>
        {embedded ? (
          <AdminHeader
            userName={user?.name}
            title="Fund Withdraws"
            compact
            onProfilePress={() => navigateToAdminProfile(navigation)}
          />
        ) : (
          <AdminHeader
            userName={user?.name}
            title="Fund Withdraws"
            onBack={() => navigation.goBack()}
            onProfilePress={() => navigateToAdminProfile(navigation)}
          />
        )}

        <View style={styles.typeBanner}>
          <Text style={styles.typeBannerText}>Money out · Withdraw requests only</Text>
        </View>

        <View style={styles.tabWrap}>
          <AdminSegmentedTabs
            tabs={TABS.map(tab => ({
              id: tab.id,
              label: tab.label,
              variant:
                tab.id === LIST_TABS.ADMIN
                  ? 'admin'
                  : tab.id === LIST_TABS.MANAGER
                    ? 'manager'
                    : 'neutral',
            }))}
            activeId={activeTab}
            onChange={handleTabChange}
          />
        </View>

        <Text style={styles.countLine}>
          {onQueueTab
            ? `${filtered.length} pending · ${
                activeTab === LIST_TABS.ADMIN
                  ? APPROVAL_STAGE_LABELS.SUPER_ADMIN_QUEUE
                  : APPROVAL_STAGE_LABELS.ADMIN_QUEUE
              }`
            : search.trim() || hasActiveFilters
              ? `Showing ${filtered.length} · loaded ${loadedCount} of ${totalCount}`
              : `Showing ${Math.min(filtered.length, loadedCount)} of ${totalCount} · ${dateRangeLabel}`}
          {!onQueueTab && hasActiveFilters
            ? ` · ${getStatusFilterLabel(withdrawStatusFilter)}`
            : ''}
        </Text>

        {!onQueueTab ? (
          <DepositFilterBar
            statusFilter={withdrawStatusFilter}
            depositDateRange={withdrawDateRange}
            onStatusChange={handleQuickStatus}
            onOpenFilters={() => setFilterOpen(true)}
            onClearFilters={resetWithdrawFilters}
          />
        ) : null}

        <View style={styles.toolbarRow}>
          <View style={styles.searchWrap}>
            <SearchIcon />
            <TextInput
              style={styles.search}
              placeholder="Search name, email, ref, remarks ..."
              placeholderTextColor={adminColors.textDim}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {withdrawError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{withdrawError}</Text>
            <TouchableOpacity onPress={() => loadWithdrawData({ force: true })}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <DepositFilterDrawer
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialStatusFilter={withdrawStatusFilter}
        initialDateRange={withdrawDateRange}
        onApply={applyWithdrawFilters}
        onReset={resetWithdrawFilters}
      />

      <FlatList
        style={styles.listFlex}
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        onMomentumScrollBegin={() => {
          endReachedDuringMomentum.current = false;
        }}
        onScrollBeginDrag={() => {
          endReachedDuringMomentum.current = false;
        }}
        refreshControl={
          <RefreshControl
            refreshing={onQueueTab ? queueLoading : refreshingWithdraws}
            onRefresh={() => {
              if (onQueueTab) {
                loadQueue();
              } else {
                loadWithdrawData({ silent: true, force: true });
              }
            }}
            tintColor={adminColors.gold}
          />
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: embedded ? getAdminTabBarPadding(insets) : insets.bottom + 16 },
        ]}
        ListEmptyComponent={
          <Text style={[styles.empty, withdrawError && styles.emptyError]}>{emptyMessage}</Text>
        }
        ListFooterComponent={
          !onQueueTab && loadingMoreWithdraws ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={adminColors.gold} size="small" />
            </View>
          ) : !onQueueTab && loadedCount > 0 && !hasMoreWithdraws ? (
            <Text style={styles.allLoadedText}>All {totalCount} records loaded</Text>
          ) : null
        }
      />
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  topSection: { flexShrink: 0 },
  typeBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.28)',
  },
  typeBannerText: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  listFlex: { flex: 1 },
  tabWrap: { marginHorizontal: 16, marginBottom: 8, marginTop: 12 },
  countLine: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  search: {
    flex: 1,
    color: adminColors.textPrimary,
    paddingVertical: 13,
    fontSize: 14,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  errorText: { color: '#F87171', fontSize: 13, lineHeight: 18 },
  retryText: {
    color: adminColors.gold,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  list: { paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 14,
    marginBottom: 10,
    gap: 8,
    ...adminShadow,
  },
  cardMain: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  name: {
    color: adminColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  amount: {
    color: adminColors.amountGreen,
    fontSize: 15,
    fontWeight: '800',
  },
  ref: { color: adminColors.textMuted, fontSize: 11, marginBottom: 4 },
  statusSummary: {
    color: adminColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    fontWeight: '600',
  },
  listNote: {
    color: adminColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
    flexShrink: 1,
  },
  cardBottom: { flexDirection: 'row' },
  empty: {
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  emptyError: { color: '#F87171' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  allLoadedText: {
    color: adminColors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default FundWithdrawListScreen;
