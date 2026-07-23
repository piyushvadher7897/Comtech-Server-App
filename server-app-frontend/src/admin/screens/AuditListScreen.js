import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import AdminHeader from '../components/AdminHeader';
import AdminBottomSheet, { SheetRow, SheetAction } from '../components/AdminBottomSheet';
import AuditFilterDrawer, {
  AUDIT_TYPE_FILTERS,
  AUDIT_TYPE_OPTIONS,
  matchesAuditTypeFilter,
} from '../components/AuditFilterDrawer';
import { ChevronRightIcon, FilterIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminProfile, navigateToAdminScreen } from '../utils/navigation';
import {
  fetchAuditsByUser,
  fetchUsersPage,
  getAuditTypeColor,
  formatMoney,
  formatGold,
  formatListDate,
} from '../../services/adminLookupApi';
import {
  getWebAdminDateRange,
  formatWebAdminDateRangeLabel,
} from '../../services/adminApi';
import { adminColors, adminShadow } from '../theme/adminTheme';

const AuditListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAdmin();
  const paramUserId = route.params && route.params.userId;
  const paramUserName = route.params && route.params.userName;
  const paramEmail = route.params && route.params.email;

  const [pickedUser, setPickedUser] = useState(
    paramUserId
      ? { id: paramUserId, name: paramUserName || 'User', email: paramEmail || '' }
      : null,
  );
  const [pickerOpen, setPickerOpen] = useState(!paramUserId);
  const [userOptions, setUserOptions] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(Boolean(paramUserId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState(AUDIT_TYPE_FILTERS.ALL);
  const [dateRange, setDateRange] = useState(getWebAdminDateRange());

  const dateLabel = useMemo(
    () => formatWebAdminDateRangeLabel(dateRange),
    [dateRange],
  );

  const typeLabel = useMemo(() => {
    const found = AUDIT_TYPE_OPTIONS.find(o => o.id === typeFilter);
    return (found && found.label) || 'All types';
  }, [typeFilter]);

  const filteredDocs = useMemo(
    () => docs.filter(row => matchesAuditTypeFilter(row.transactionType, typeFilter)),
    [docs, typeFilter],
  );

  const loadAudits = useCallback(
    async ({ silent = false } = {}) => {
      if (!pickedUser || !pickedUser.id) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const result = await fetchAuditsByUser(pickedUser.id, {
          page: 1,
          limit: 200,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setDocs(result.docs || []);
      } catch (err) {
        setError(
          (err.response &&
            err.response.data &&
            (err.response.data.error || err.response.data.message)) ||
            err.message ||
            'Failed to load audits',
        );
        setDocs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pickedUser, dateRange.startDate, dateRange.endDate],
  );

  useEffect(() => {
    if (pickedUser && pickedUser.id) {
      loadAudits();
    }
  }, [pickedUser, loadAudits]);

  useEffect(() => {
    if (route.params && route.params.userId) {
      setPickedUser({
        id: route.params.userId,
        name: route.params.userName || 'User',
        email: route.params.email || '',
      });
      setPickerOpen(false);
    }
  }, [route.params && route.params.userId]);

  useEffect(() => {
    if (!pickerOpen) return;
    let active = true;
    (async () => {
      setLoadingUsers(true);
      try {
        const result = await fetchUsersPage({ page: 1, limit: 30 });
        if (active) setUserOptions(result.docs || []);
      } catch {
        if (active) setUserOptions([]);
      } finally {
        if (active) setLoadingUsers(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pickerOpen]);

  const renderItem = ({ item }) => {
    const color = getAuditTypeColor(item.transactionType);
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
        <View style={styles.cardMain}>
          <View style={[styles.typeChip, { backgroundColor: color.bg, borderColor: color.border }]}>
            <Text style={[styles.typeText, { color: color.text }]}>
              {item.transactionType || 'AUDIT'}
            </Text>
          </View>
          <Text style={styles.meta}>{formatListDate(item.date)}</Text>
          <Text style={styles.valueLine}>
            Value AED {formatMoney(item.value)}
            {item.quantityGms ? ` · ${formatGold(item.quantityGms)} g` : ''}
          </Text>
        </View>
        <ChevronRightIcon />
      </TouchableOpacity>
    );
  };

  return (
    <AdminScreenLayout>
      <AdminHeader
        userName={user && user.name}
        title="Audits"
        onBack={() => navigation.goBack()}
        onProfilePress={() => navigateToAdminProfile(navigation)}
      />

      <View style={styles.banner}>
        <Text style={styles.bannerText}>Transaction history for one user</Text>
      </View>

      <TouchableOpacity
        style={styles.userPicker}
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.85}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pickerLabel}>Selected user</Text>
          <Text style={styles.pickerValue}>
            {pickedUser ? pickedUser.name : 'Tap to choose a user'}
          </Text>
          {pickedUser && pickedUser.email ? (
            <Text style={styles.pickerEmail}>{pickedUser.email}</Text>
          ) : null}
        </View>
        <Text style={styles.changeText}>Change</Text>
      </TouchableOpacity>

      <View style={styles.filterBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.filterSummary}>
            {typeLabel} · {dateLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.85}>
          <FilterIcon size={16} />
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.countLine}>
        {!pickedUser
          ? 'Choose a user to load audits'
          : loading
            ? 'Loading…'
            : `${filteredDocs.length} of ${docs.length} audit rows`}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filteredDocs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAudits({ silent: true })}
            tintColor={adminColors.gold}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading
              ? 'Loading audits…'
              : !pickedUser
                ? 'No user selected'
                : error
                  ? 'Could not load audits'
                  : 'No audit rows for this filter'}
          </Text>
        }
      />

      <AuditFilterDrawer
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        initialTypeFilter={typeFilter}
        initialDateRange={dateRange}
        onApply={({ typeFilter: nextType, startDate, endDate }) => {
          setTypeFilter(nextType);
          setDateRange({ startDate, endDate });
        }}
        onReset={() => {
          setTypeFilter(AUDIT_TYPE_FILTERS.ALL);
          setDateRange(getWebAdminDateRange());
        }}
      />

      <AdminBottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose user"
        subtitle="Pick a user to view audits">
        <SheetAction
          label="Open full users list"
          tone="blue"
          onPress={() => {
            setPickerOpen(false);
            navigateToAdminScreen(navigation, 'UserList');
          }}
        />
        {loadingUsers ? (
          <ActivityIndicator color={adminColors.gold} style={{ marginVertical: 20 }} />
        ) : (
          userOptions.map(u => (
            <TouchableOpacity
              key={u.id}
              style={styles.userOption}
              onPress={() => {
                setPickedUser({ id: u.id, name: u.name, email: u.email });
                setPickerOpen(false);
              }}>
              <Text style={styles.userOptionName}>{u.name}</Text>
              <Text style={styles.userOptionEmail}>{u.email}</Text>
            </TouchableOpacity>
          ))
        )}
      </AdminBottomSheet>

      <AdminBottomSheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={(selected && selected.transactionType) || 'Audit'}
        subtitle={pickedUser ? pickedUser.name : ''}>
        {selected ? (
          <>
            <SheetRow label="Type" value={selected.transactionType} />
            <SheetRow label="Date" value={formatListDate(selected.date)} />
            <SheetRow label="Value" value={`AED ${formatMoney(selected.value)}`} highlight />
            <SheetRow label="Gold qty (g)" value={formatGold(selected.quantityGms)} />
            <SheetRow label="Price" value={formatMoney(selected.price, 4)} />
            <SheetRow
              label="Fund after"
              value={
                selected.finalFundBalance != null
                  ? `AED ${formatMoney(selected.finalFundBalance)}`
                  : '—'
              }
            />
            <SheetRow
              label="Gold after (g)"
              value={
                selected.finalGoldBalanceGms != null
                  ? formatGold(selected.finalGoldBalanceGms)
                  : '—'
              }
            />
            <SheetRow
              label="In hand qty"
              value={selected.inHandQty != null ? formatGold(selected.inHandQty) : '—'}
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
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.28)',
  },
  bannerText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  userPicker: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: adminColors.cardBg,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...adminShadow,
  },
  pickerLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickerValue: {
    color: adminColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  pickerEmail: { color: adminColors.textMuted, fontSize: 12, marginTop: 2 },
  changeText: { color: adminColors.gold, fontWeight: '800', fontSize: 13 },
  filterBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterSummary: {
    color: adminColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
  },
  filterBtnText: {
    color: adminColors.gold,
    fontSize: 13,
    fontWeight: '800',
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
  cardMain: { flex: 1, gap: 4 },
  typeChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  typeText: { fontSize: 11, fontWeight: '800' },
  meta: { color: adminColors.textMuted, fontSize: 11 },
  valueLine: { color: adminColors.textPrimary, fontSize: 13, fontWeight: '600' },
  empty: {
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  userOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  userOptionName: { color: adminColors.textPrimary, fontWeight: '700', fontSize: 14 },
  userOptionEmail: { color: adminColors.textMuted, fontSize: 12, marginTop: 2 },
});

export default AuditListScreen;
