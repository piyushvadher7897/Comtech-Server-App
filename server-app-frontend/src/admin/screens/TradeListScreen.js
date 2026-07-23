import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import AdminBottomSheet, { SheetRow } from '../components/AdminBottomSheet';
import AdminSegmentedTabs from '../components/AdminSegmentedTabs';
import DepositFilterDrawer from '../components/DepositFilterDrawer';
import { SearchIcon, ChevronRightIcon, FilterIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminProfile } from '../utils/navigation';
import {
  fetchBuyGoldPage,
  fetchSellGoldPage,
  formatMoney,
  formatGold,
  formatListDate,
  LOOKUP_PAGE_SIZE,
} from '../../services/adminLookupApi';
import {
  getWebAdminDateRange,
  formatWebAdminDateRangeLabel,
} from '../../services/adminApi';
import { STATUS_FILTERS } from '../constants/depositStatus';
import { adminColors, adminShadow } from '../theme/adminTheme';

const KIND_TABS = [
  { id: 'buy', label: 'Buy Gold', variant: 'gold' },
  { id: 'sell', label: 'Sell Gold', variant: 'admin' },
];

const TradeListScreen = ({ navigation, route, kind: kindProp }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAdmin();
  const initialKind =
    (route.params && route.params.kind) || kindProp || 'buy';
  const initialQ = (route.params && route.params.q) || '';

  const [kind, setKind] = useState(initialKind === 'sell' ? 'sell' : 'buy');
  const [search, setSearch] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [docs, setDocs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState(getWebAdminDateRange());
  const searchTimer = useRef(null);
  const endMomentum = useRef(true);

  const isBuy = kind === 'buy';
  const fetchPage = isBuy ? fetchBuyGoldPage : fetchSellGoldPage;
  const title = 'Buy / Sell';
  const accent = isBuy
    ? { bg: 'rgba(212, 175, 55, 0.12)', border: 'rgba(212, 175, 55, 0.28)', text: '#E8C96A' }
    : { bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.28)', text: '#C4B5FD' };

  useEffect(() => {
    const next =
      (route.params && route.params.kind) || kindProp || null;
    if (next === 'buy' || next === 'sell') {
      setKind(next);
    }
  }, [route.params && route.params.kind, kindProp]);

  const dateLabel = useMemo(
    () => formatWebAdminDateRangeLabel(dateRange),
    [dateRange],
  );

  const loadPage = useCallback(
    async ({ page: nextPage = 1, q = query, append = false, silent = false } = {}) => {
      if (append) setLoadingMore(true);
      else if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const result = await fetchPage({
          page: nextPage,
          limit: LOOKUP_PAGE_SIZE,
          q,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setDocs(prev => (append ? [...prev, ...(result.docs || [])] : result.docs || []));
        setPage(nextPage);
        setTotal(result.totalDocs || 0);
        setHasMore(Boolean(result.hasNextPage));
      } catch (err) {
        setError(
          (err.response &&
            err.response.data &&
            (err.response.data.error || err.response.data.message)) ||
            err.message ||
            `Failed to load ${isBuy ? 'buy' : 'sell'} orders`,
        );
        if (!append) setDocs([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchPage, query, dateRange, isBuy],
  );

  useEffect(() => {
    setSelected(null);
    loadPage({ page: 1, q: query });
  }, [kind, query, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setQuery(search.trim()), 450);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const onKindChange = next => {
    if (next === kind) return;
    setKind(next);
    setDocs([]);
    setPage(1);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
      <View style={styles.cardMain}>
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={[styles.amount, { color: accent.text }]}>
            {formatGold(item.goldGm)} g
          </Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {item.email || '—'} · AED {formatMoney(item.amount)}
        </Text>
        <Text style={styles.meta}>{formatListDate(item.createdAt)}</Text>
        <View style={[styles.statusChip, { backgroundColor: accent.bg, borderColor: accent.border }]}>
          <Text style={[styles.statusText, { color: accent.text }]}>{item.status || '—'}</Text>
        </View>
      </View>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={user && user.name}
        title={title}
        onBack={() => navigation.goBack()}
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      <View style={styles.tabsWrap}>
        <AdminSegmentedTabs tabs={KIND_TABS} activeId={kind} onChange={onKindChange} />
      </View>

      <View style={[styles.banner, { backgroundColor: accent.bg, borderColor: accent.border }]}>
        <Text style={[styles.bannerText, { color: accent.text }]}>
          {isBuy ? 'Gold buy orders' : 'Gold sell orders'} · search by user email / name
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchIcon />
          <TextInput
            style={styles.search}
            placeholder="Search user email / name"
            placeholderTextColor={adminColors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.85}>
          <FilterIcon size={18} />
        </TouchableOpacity>
      </View>

      <Text style={styles.countLine}>
        {loading ? 'Loading…' : `Showing ${docs.length} of ${total} · ${dateLabel}`}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={docs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPage({ page: 1, q: query, silent: true })}
            tintColor={adminColors.gold}
          />
        }
        onEndReached={() => {
          if (endMomentum.current || !hasMore || loading || loadingMore) return;
          loadPage({ page: page + 1, q: query, append: true });
        }}
        onEndReachedThreshold={0.35}
        onMomentumScrollBegin={() => {
          endMomentum.current = false;
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading…' : error ? 'Could not load list' : 'No records found'}
          </Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={adminColors.gold} style={{ marginVertical: 16 }} />
          ) : null
        }
      />

      <DepositFilterDrawer
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        showStatusFilter={false}
        title="Date filter"
        initialStatusFilter={STATUS_FILTERS.ALL}
        initialDateRange={dateRange}
        onApply={({ startDate, endDate }) => {
          setDateRange({ startDate, endDate });
        }}
        onReset={() => setDateRange(getWebAdminDateRange())}
      />

      <AdminBottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? selected.userName : title}
        subtitle={selected ? selected.email : ''}>
        {selected ? (
          <>
            <SheetRow label="Type" value={isBuy ? 'Buy Gold' : 'Sell Gold'} />
            <SheetRow label="Gold (g)" value={formatGold(selected.goldGm)} highlight />
            <SheetRow label="Amount" value={`AED ${formatMoney(selected.amount)}`} highlight />
            <SheetRow label="Rate" value={formatMoney(selected.rate, 4)} />
            <SheetRow label="Status" value={selected.status} />
            <SheetRow label="Order ID" value={selected.orderID} />
            <SheetRow label="Payment via" value={selected.paymentVia} />
            <SheetRow label="Description" value={selected.description} />
            <SheetRow label="Created" value={formatListDate(selected.createdAt)} />
          </>
        ) : null}
      </AdminBottomSheet>
    </AdminScreenLayout>
  );
};

export const BuyGoldListScreen = props => <TradeListScreen {...props} kind="buy" />;
export const SellGoldListScreen = props => <TradeListScreen {...props} kind="sell" />;

const styles = StyleSheet.create({
  tabsWrap: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
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
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLine: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  error: { color: '#F87171', marginHorizontal: 16, marginBottom: 8, fontSize: 13 },
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
    gap: 8,
    marginBottom: 4,
  },
  name: { color: adminColors.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 },
  amount: { fontSize: 14, fontWeight: '800' },
  meta: { color: adminColors.textMuted, fontSize: 11, marginBottom: 2 },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: {
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});

export default BuyGoldListScreen;
