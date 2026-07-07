import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FilterIcon } from './AdminIcons';
import { STATUS_FILTER_OPTIONS, STATUS_FILTERS } from '../constants/depositStatus';
import { formatWebAdminDateRangeLabel, isDefaultDepositDateRange } from '../../services/adminApi';
import { adminColors } from '../theme/adminTheme';

const QUICK_STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter(
  option =>
    option.id === STATUS_FILTERS.ALL ||
    option.id === STATUS_FILTERS.PENDING ||
    option.id === STATUS_FILTERS.APPROVE ||
    option.id === STATUS_FILTERS.APPROVED ||
    option.id === STATUS_FILTERS.REJECTED,
);

const DepositFilterBar = ({
  statusFilter,
  depositDateRange,
  onStatusChange,
  onOpenFilters,
  onClearFilters,
  disabled = false,
  compact = false,
}) => {
  const dateLabel = depositDateRange
    ? formatWebAdminDateRangeLabel(depositDateRange)
    : formatWebAdminDateRangeLabel();
  const hasStatusFilter = statusFilter !== STATUS_FILTERS.ALL;
  const hasDateFilter = depositDateRange && !isDefaultDepositDateRange(depositDateRange);
  const hasActiveFilters = hasStatusFilter || hasDateFilter;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.topRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          nestedScrollEnabled>
          {QUICK_STATUS_OPTIONS.map(option => {
            const selected = statusFilter === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => !disabled && onStatusChange?.(option.id)}
                disabled={disabled}
                activeOpacity={0.85}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={onOpenFilters}
          disabled={disabled}
          activeOpacity={0.85}>
          <FilterIcon color={hasActiveFilters ? '#1a1208' : adminColors.gold} size={16} />
        </TouchableOpacity>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.datePill, hasDateFilter && styles.datePillActive]}>
          <Text style={[styles.datePillText, hasDateFilter && styles.datePillTextActive]}>
            {dateLabel}
          </Text>
        </View>
        {hasActiveFilters ? (
          <TouchableOpacity onPress={onClearFilters} disabled={disabled} hitSlop={8}>
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hintText}>Swipe chips to filter</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  wrapCompact: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
  },
  chipSelected: {
    backgroundColor: adminColors.gold,
    borderColor: adminColors.gold,
  },
  chipText: {
    color: adminColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#1a1208',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    backgroundColor: adminColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: adminColors.gold,
    borderColor: adminColors.gold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  datePill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    backgroundColor: adminColors.cardBgLight,
  },
  datePillActive: {
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  datePillText: {
    color: adminColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  datePillTextActive: {
    color: adminColors.goldLight,
  },
  clearText: {
    color: adminColors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  hintText: {
    color: adminColors.textDim,
    fontSize: 11,
  },
});

export default DepositFilterBar;
