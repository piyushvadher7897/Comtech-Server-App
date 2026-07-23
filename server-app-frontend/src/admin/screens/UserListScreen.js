import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import AdminBottomSheet, { SheetRow, SheetAction } from '../components/AdminBottomSheet';
import { SearchIcon, ChevronRightIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminProfile, navigateToAdminScreen } from '../utils/navigation';
import {
  fetchUsersPage,
  fetchUserDetail,
  formatMoney,
  formatGold,
  formatListDate,
  LOOKUP_PAGE_SIZE,
} from '../../services/adminLookupApi';
import { adminColors, adminShadow, getInitials } from '../theme/adminTheme';

const UserListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAdmin();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const searchTimer = useRef(null);
  const endMomentum = useRef(true);

  const loadPage = useCallback(async ({ page: nextPage = 1, q = query, append = false, silent = false } = {}) => {
    if (append) setLoadingMore(true);
    else if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await fetchUsersPage({ page: nextPage, limit: LOOKUP_PAGE_SIZE, q });
      setDocs(prev => (append ? [...prev, ...(result.docs || [])] : result.docs || []));
      setPage(nextPage);
      setTotal(result.totalDocs || 0);
      setHasMore(Boolean(result.hasNextPage));
    } catch (err) {
      setError(
        (err.response && err.response.data && (err.response.data.error || err.response.data.message)) ||
          err.message ||
          'Failed to load users',
      );
      if (!append) setDocs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    loadPage({ page: 1, q: query });
  }, [query]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQuery(search.trim());
    }, 450);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const openUser = async item => {
    setSelected(item);
    setDetail(null);
    setDetailLoading(true);
    try {
      const full = await fetchUserDetail(item.id);
      setDetail(full);
    } catch {
      setDetail(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeSheet = () => {
    setSelected(null);
    setDetail(null);
  };

  const sheetUser = detail || selected;

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openUser(item)} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {item.email || '—'}
        </Text>
        <Text style={styles.mobile} numberOfLines={1}>
          {item.mobile}
        </Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.chipFund]}>
            <Text style={styles.chipFundText}>AED {formatMoney(item.fundTotal)}</Text>
          </View>
          <View style={[styles.chip, styles.chipGold]}>
            <Text style={styles.chipGoldText}>{formatGold(item.goldTotal)} g</Text>
          </View>
        </View>
      </View>
      <ChevronRightIcon />
    </TouchableOpacity>
  );

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={user && user.name}
        title="Users"
        onBack={() => navigation.goBack()}
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      <View style={styles.banner}>
        <Text style={styles.bannerText}>Search by name, email or mobile</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchIcon />
        <TextInput
          style={styles.search}
          placeholder="Name / email / mobile"
          placeholderTextColor={adminColors.textDim}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text style={styles.countLine}>
        {loading ? 'Loading…' : `Showing ${docs.length} of ${total} users`}
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
            {loading ? 'Loading users…' : error ? 'Could not load users' : 'No users found'}
          </Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={adminColors.gold} style={{ marginVertical: 16 }} />
          ) : null
        }
      />

      <AdminBottomSheet
        visible={Boolean(selected)}
        onClose={closeSheet}
        title={(sheetUser && sheetUser.name) || 'User'}
        subtitle={(sheetUser && sheetUser.email) || ''}>
        {detailLoading ? (
          <ActivityIndicator color={adminColors.gold} style={{ marginVertical: 24 }} />
        ) : sheetUser ? (
          <>
            <SheetRow label="Name" value={sheetUser.name} />
            <SheetRow label="Email" value={sheetUser.email} />
            <SheetRow label="Mobile" value={sheetUser.mobile} />
            <SheetRow label="Status" value={sheetUser.status} />
            <SheetRow label="Currency" value={sheetUser.currency} />
            <SheetRow
              label="Fund balance (AED)"
              value={`AED ${formatMoney(sheetUser.fundTotal)}`}
              highlight
            />
            <SheetRow
              label="Gold balance"
              value={`${formatGold(sheetUser.goldTotal)} g`}
              highlight
            />
            <SheetRow label="KYC" value={sheetUser.kycStatus || '—'} />
            <SheetRow label="Joined" value={formatListDate(sheetUser.createdAt)} />
            {detail ? (
              <>
                <SheetRow label="Deposits" value={String(detail.depositCount || 0)} />
                <SheetRow label="Withdraws" value={String(detail.withdrawCount || 0)} />
                <SheetRow label="Buy gold" value={String(detail.buyCount || 0)} />
                <SheetRow label="Sell gold" value={String(detail.sellCount || 0)} />
              </>
            ) : null}

            <SheetAction
              label="View fund deposits"
              tone="green"
              onPress={() => {
                closeSheet();
                navigateToAdminScreen(navigation, 'FundDepositList', {
                  initialTab: 'all',
                  q: sheetUser.email,
                });
              }}
            />
            <SheetAction
              label="View fund withdraws"
              tone="orange"
              onPress={() => {
                closeSheet();
                navigateToAdminScreen(navigation, 'FundWithdrawList', {
                  initialTab: 'all',
                  q: sheetUser.email,
                });
              }}
            />
            <SheetAction
              label="View audits"
              tone="blue"
              onPress={() => {
                closeSheet();
                navigateToAdminScreen(navigation, 'AuditList', {
                  userId: sheetUser.id,
                  userName: sheetUser.name,
                  email: sheetUser.email,
                });
              }}
            />
            <SheetAction
              label="View buy / sell"
              tone="purple"
              onPress={() => {
                closeSheet();
                navigateToAdminScreen(navigation, 'BuyGoldList', {
                  q: sheetUser.email,
                  kind: 'buy',
                });
              }}
            />
          </>
        ) : null}
      </AdminBottomSheet>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.28)',
  },
  bannerText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
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
  search: {
    flex: 1,
    color: adminColors.textPrimary,
    paddingVertical: 13,
    fontSize: 14,
  },
  countLine: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  error: {
    color: '#F87171',
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
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
    gap: 12,
    ...adminShadow,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#93C5FD', fontWeight: '800', fontSize: 14 },
  cardBody: { flex: 1 },
  name: { color: adminColors.textPrimary, fontSize: 16, fontWeight: '700' },
  email: { color: adminColors.textMuted, fontSize: 12, marginTop: 2 },
  mobile: { color: adminColors.textSecondary, fontSize: 12, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipFund: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  chipGold: { backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  chipFundText: { color: '#34D399', fontSize: 11, fontWeight: '700' },
  chipGoldText: { color: adminColors.goldLight, fontSize: 11, fontWeight: '700' },
  empty: {
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});

export default UserListScreen;
