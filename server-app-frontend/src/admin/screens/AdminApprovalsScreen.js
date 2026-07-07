import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import DepositStatusBadge from '../components/DepositStatusBadge';
import { ChevronRightIcon, SearchIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminScreen, navigateToAdminProfile } from '../utils/navigation';
import { fetchApprovalQueue, getDisplayReferenceNumber } from '../../services/adminApi';
import { ADMIN_APP_URL } from '../../global/constant';
import { adminColors, adminShadow } from '../theme/adminTheme';
import AdminSegmentedTabs from '../components/AdminSegmentedTabs';
import { getAdminTabBarPadding } from '../components/AdminTabBar';
import { APPROVAL_STAGE_LABELS } from '../constants/depositStatus';

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

const TABS = {
  MANAGER: 'pending_manager',
  ADMIN: 'pending_admin',
};

const AdminApprovalsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isManager, isSuperAdmin, isAdmin, user, stats, refreshStats } = useAdmin();

  const resolveDefaultTab = () => {
    if (stats.pendingManager > 0 && stats.pendingAdmin === 0) return TABS.MANAGER;
    if (stats.pendingAdmin > 0 && stats.pendingManager === 0) return TABS.ADMIN;
    if (isManager && !isSuperAdmin && !isAdmin) return TABS.MANAGER;
    return stats.pendingManager >= stats.pendingAdmin ? TABS.MANAGER : TABS.ADMIN;
  };

  const defaultTab = resolveDefaultTab();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || defaultTab);
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = useCallback(nextTab => {
    setActiveTab(prev => (prev === nextTab ? prev : nextTab));
  }, []);

  const approvalTabs = useMemo(
    () => [
      {
        id: TABS.MANAGER,
        label: APPROVAL_STAGE_LABELS.ADMIN,
        variant: 'manager',
        count: stats.pendingManager,
      },
      {
        id: TABS.ADMIN,
        label: APPROVAL_STAGE_LABELS.SUPER_ADMIN,
        variant: 'admin',
        count: stats.pendingAdmin,
      },
    ],
    [stats.pendingAdmin, stats.pendingManager],
  );

  const loadQueue = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError('');
    try {
      const workflow = isManager && !isSuperAdmin && !isAdmin ? TABS.MANAGER : activeTab;
      const result = await fetchApprovalQueue(workflow);
      setQueue(result.docs || []);
    } catch (err) {
      setError(err.message || 'Failed to load approval queue');
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, isAdmin, isManager, isSuperAdmin]);

  useEffect(() => {
    loadQueue(true);
  }, [loadQueue]);

  useEffect(() => {
    if (!route.params?.initialTab) return;
    setActiveTab(route.params.initialTab);
    navigation.setParams({ initialTab: undefined });
  }, [navigation, route.params?.initialTab]);

  useFocusEffect(
    useCallback(() => {
      refreshStats();
      loadQueue(true);
    }, [refreshStats, loadQueue]),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter(
      d =>
        d.userName.toLowerCase().includes(q) ||
        d.referenceNumber.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)),
    );
  }, [queue, search]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigateToAdminScreen(navigation, 'TakeAction', {
          depositId: item.id,
          deposit: item,
          queueType: activeTab,
        })
      }
      activeOpacity={0.85}>
      <View style={styles.cardMain}>
        <View style={styles.cardTop}>
          <Text style={styles.name}>{item.userName}</Text>
          <Text style={styles.amount}>
            AED {Number(item.amountAed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <Text style={styles.ref}>
          {getDisplayReferenceNumber(item)} · {formatDate(item.createdAt)}
        </Text>
        <DepositStatusBadge status={item.status} compact />
        <Text style={styles.tapHint}>Tap to approve →</Text>
      </View>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={user?.name}
        compact
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      {(isSuperAdmin || isAdmin) && (
        <View style={styles.tabWrap}>
          <AdminSegmentedTabs
            tabs={approvalTabs}
            activeId={activeTab}
            onChange={handleTabChange}
          />
        </View>
      )}

      <View style={styles.searchWrap}>
        <SearchIcon />
        <TextInput
          style={styles.search}
          placeholder="Search by name, email or ref no"
          placeholderTextColor={adminColors.textDim}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.countLine}>
        {filtered.length} pending ·{' '}
        {activeTab === TABS.ADMIN
          ? APPROVAL_STAGE_LABELS.SUPER_ADMIN_QUEUE
          : APPROVAL_STAGE_LABELS.ADMIN_QUEUE}
      </Text>

      {(isSuperAdmin || isAdmin) &&
      stats.pendingManager > 0 &&
      activeTab === TABS.ADMIN &&
      filtered.length === 0 ? (
        <TouchableOpacity
          style={styles.switchTabHint}
          onPress={() => handleTabChange(TABS.MANAGER)}>
          <Text style={styles.switchTabHintText}>
            {stats.pendingManager} awaiting {APPROVAL_STAGE_LABELS.ADMIN.toLowerCase()} approval — tap to open{' '}
            {APPROVAL_STAGE_LABELS.ADMIN_APPROVAL}
          </Text>
        </TouchableOpacity>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadQueue(true)}
            tintColor={adminColors.gold}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: getAdminTabBarPadding(insets) }]}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>
              {refreshing
                ? 'Loading...'
                : error
                  ? 'Could not load approvals'
                  : 'No pending approvals in this queue.'}
            </Text>
            {!refreshing && !error ? (
              <Text style={styles.emptyHint}>
                Try the other tab ({APPROVAL_STAGE_LABELS.ADMIN} / {APPROVAL_STAGE_LABELS.SUPER_ADMIN}{' '}
                Approval), or check web admin for pending deposits.
              </Text>
            ) : null}
            {error ? (
              <Text style={styles.emptyHint}>
                {error}{'\n'}API: {ADMIN_APP_URL}
              </Text>
            ) : null}
          </View>
        }
      />
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  tabWrap: { marginHorizontal: 16, marginBottom: 12, marginTop: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: adminColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingHorizontal: 14,
    gap: 10,
  },
  search: { flex: 1, color: adminColors.textPrimary, paddingVertical: 13, fontSize: 14 },
  countLine: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  switchTabHint: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },
  switchTabHintText: {
    color: '#FB923C',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tapHint: {
    color: adminColors.gold,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  errorText: { color: '#F87171', marginHorizontal: 16, marginBottom: 8, fontSize: 13 },
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
  cardMain: { flex: 1, gap: 8 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: { color: adminColors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  ref: { color: adminColors.textMuted, fontSize: 11 },
  amount: { color: adminColors.amountGreen, fontSize: 15, fontWeight: '800' },
  empty: { color: adminColors.textMuted, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  emptyWrap: { marginTop: 32, paddingHorizontal: 20, gap: 10 },
  emptyHint: {
    color: adminColors.textDim,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default AdminApprovalsScreen;
