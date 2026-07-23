import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CloseIcon, FilterIcon, CalendarIcon } from './AdminIcons';
import { getWebAdminDateRange } from '../../services/adminApi';
import { adminColors } from '../theme/adminTheme';

export const AUDIT_TYPE_FILTERS = {
  ALL: 'all',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  BUY: 'buy',
  SELL: 'sell',
};

export const AUDIT_TYPE_OPTIONS = [
  { id: AUDIT_TYPE_FILTERS.ALL, label: 'All types', hint: 'Every audit row' },
  { id: AUDIT_TYPE_FILTERS.DEPOSIT, label: 'Deposit', hint: 'Fund deposits' },
  { id: AUDIT_TYPE_FILTERS.WITHDRAW, label: 'Withdraw', hint: 'Fund withdraws' },
  { id: AUDIT_TYPE_FILTERS.BUY, label: 'Buy gold', hint: 'TRADE_BUY orders' },
  { id: AUDIT_TYPE_FILTERS.SELL, label: 'Sell gold', hint: 'TRADE_SELL orders' },
];

const toIsoDate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseIsoDate = value => {
  const parts = String(value || '')
    .split('-')
    .map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const formatDisplayDate = iso => {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DATE_PRESETS = [
  { id: 'default', label: 'Last 3 months', getRange: getWebAdminDateRange },
  {
    id: 'month',
    label: 'This month',
    getRange: () => {
      const now = new Date();
      const startDate = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
      return { startDate, endDate: toIsoDate(now) };
    },
  },
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const today = toIsoDate(new Date());
      return { startDate: today, endDate: today };
    },
  },
  {
    id: 'year',
    label: 'This year',
    getRange: () => {
      const now = new Date();
      return {
        startDate: toIsoDate(new Date(now.getFullYear(), 0, 1)),
        endDate: toIsoDate(now),
      };
    },
  },
];

const DateField = ({ label, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event && event.type === 'dismissed') return;
    if (selected) onChange(toIsoDate(selected));
  };

  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
        <CalendarIcon size={16} />
        <Text style={styles.dateValue}>{formatDisplayDate(value)}</Text>
      </TouchableOpacity>
      {showPicker ? (
        <DateTimePicker
          value={parseIsoDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={onPickerChange}
          maximumDate={new Date()}
          themeVariant="dark"
        />
      ) : null}
    </View>
  );
};

/** Matches audit type chip filters to transactionType strings from the API. */
export const matchesAuditTypeFilter = (transactionType, typeFilter) => {
  if (!typeFilter || typeFilter === AUDIT_TYPE_FILTERS.ALL) return true;
  const t = String(transactionType || '').toUpperCase();
  if (typeFilter === AUDIT_TYPE_FILTERS.DEPOSIT) {
    return t.indexOf('DEPOSIT') >= 0;
  }
  if (typeFilter === AUDIT_TYPE_FILTERS.WITHDRAW) {
    return t.indexOf('WITHDRAW') >= 0 || t.indexOf('WITHDREW') >= 0;
  }
  if (typeFilter === AUDIT_TYPE_FILTERS.BUY) {
    return t.indexOf('BUY') >= 0;
  }
  if (typeFilter === AUDIT_TYPE_FILTERS.SELL) {
    return t.indexOf('SELL') >= 0;
  }
  return true;
};

const AuditFilterDrawer = ({
  visible,
  onClose,
  initialTypeFilter = AUDIT_TYPE_FILTERS.ALL,
  initialDateRange,
  onApply,
  onReset,
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const defaults = getWebAdminDateRange();
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter);
  const [startDate, setStartDate] = useState(
    (initialDateRange && initialDateRange.startDate) || defaults.startDate,
  );
  const [endDate, setEndDate] = useState(
    (initialDateRange && initialDateRange.endDate) || defaults.endDate,
  );
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTypeFilter(initialTypeFilter);
    setStartDate((initialDateRange && initialDateRange.startDate) || defaults.startDate);
    setEndDate((initialDateRange && initialDateRange.endDate) || defaults.endDate);
    setDateError('');
  }, [visible, initialTypeFilter, initialDateRange, defaults.startDate, defaults.endDate]);

  const applyPreset = preset => {
    const range = preset.getRange();
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setDateError('');
  };

  const handleApply = () => {
    if (endDate < startDate) {
      setDateError('End date must be on or after start date');
      return;
    }
    onApply({ typeFilter, startDate, endDate });
    onClose();
  };

  const handleReset = () => {
    const range = getWebAdminDateRange();
    setTypeFilter(AUDIT_TYPE_FILTERS.ALL);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setDateError('');
    if (onReset) {
      onReset();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.drawer,
            {
              height: windowHeight,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
            },
          ]}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <FilterIcon size={18} />
              <Text style={styles.drawerTitle}>Audit filters</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <CloseIcon size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.drawerScrollWrap}>
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              <Text style={styles.sectionTitle}>Type</Text>
              <Text style={styles.sectionHint}>Filter by deposit, withdraw, buy, or sell</Text>
              {AUDIT_TYPE_OPTIONS.map(option => {
                const selected = typeFilter === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => setTypeFilter(option.id)}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                      <Text style={styles.optionHint}>{option.hint}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Date range</Text>
              <Text style={styles.sectionHint}>Pick a range or use a quick preset</Text>

              <View style={styles.presetRow}>
                {DATE_PRESETS.map(preset => (
                  <Pressable
                    key={preset.id}
                    style={styles.presetChip}
                    onPress={() => applyPreset(preset)}>
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.dateRow}>
                <DateField label="Start date" value={startDate} onChange={setStartDate} />
                <DateField label="End date" value={endDate} onChange={setEndDate} />
              </View>

              {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.85}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: { flex: 1 },
  drawer: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: adminColors.backgroundElevated,
    borderLeftWidth: 1,
    borderLeftColor: adminColors.cardBorder,
    paddingHorizontal: 16,
    flexDirection: 'column',
  },
  drawerScrollWrap: { flex: 1, minHeight: 0 },
  drawerScroll: { flex: 1 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexShrink: 0,
  },
  drawerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerTitle: { color: adminColors.textPrimary, fontSize: 18, fontWeight: '800' },
  drawerBody: { paddingBottom: 24 },
  sectionTitle: {
    color: adminColors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitleSpaced: { marginTop: 20 },
  sectionHint: {
    color: adminColors.textDim,
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: adminColors.cardBg,
  },
  optionRowSelected: {
    borderColor: adminColors.cardBorder,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: adminColors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: adminColors.gold },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.gold,
  },
  optionText: { flex: 1 },
  optionLabel: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionLabelSelected: { color: adminColors.goldLight },
  optionHint: { color: adminColors.textMuted, fontSize: 11, lineHeight: 15 },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
  },
  presetChipText: {
    color: adminColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: { gap: 12 },
  dateField: { marginBottom: 4 },
  dateLabel: {
    color: adminColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
  },
  dateValue: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dateError: { color: '#F87171', fontSize: 12, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    alignItems: 'center',
  },
  resetButtonText: {
    color: adminColors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#1a1208',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default AuditFilterDrawer;
