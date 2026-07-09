import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import GoldButton from './GoldButton';
import {BellIcon, CheckSmallIcon} from './AdminIcons';
import {adminColors, adminShadow} from '../theme/adminTheme';
import {syncAdminFcmToken, isAdminNotificationsEnabled} from '../../services/adminFirebaseMessaging';
import {
  DEPOSIT_NOTIFICATION_SUCCESS,
  getDepositNotificationErrorMessage,
} from '../utils/depositNotificationMessages';

const DepositNotificationCard = ({variant = 'full', onStatusChange}) => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const isCompact = variant === 'compact';

  const refreshStatus = useCallback(async () => {
    const isEnabled = await isAdminNotificationsEnabled();
    setEnabled(isEnabled);
    onStatusChange?.(isEnabled);
    return isEnabled;
  }, [onStatusChange]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const enableNotifications = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const result = await syncAdminFcmToken();
      if (result.success) {
        setEnabled(true);
        onStatusChange?.(true);
        setSuccessMsg(DEPOSIT_NOTIFICATION_SUCCESS.message);
        return result;
      }

      setErrorMsg(getDepositNotificationErrorMessage(result));
      return result;
    } finally {
      setLoading(false);
    }
  };

  if (isCompact && enabled) {
    return null;
  }

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, isCompact && styles.iconWrapCompact]}>
          <BellIcon color={adminColors.gold} size={isCompact ? 18 : 20} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            Deposit alerts
          </Text>
          {!isCompact ? (
            <Text style={styles.subtitle}>
              Get notified when a user submits a fund deposit request.
            </Text>
          ) : (
            <Text style={styles.subtitleCompact}>
              You will miss new deposit requests until alerts are on.
            </Text>
          )}
        </View>
        {enabled ? (
          <View style={styles.statusBadge}>
            <CheckSmallIcon color="#4ADE80" size={12} />
            <Text style={styles.statusOn}>On</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.statusBadgeOff]}>
            <Text style={styles.statusOff}>Off</Text>
          </View>
        )}
      </View>

      <GoldButton
        title={
          loading
            ? 'TURNING ON...'
            : enabled
              ? 'REFRESH ALERTS'
              : 'TURN ON DEPOSIT ALERTS'
        }
        onPress={enableNotifications}
        loading={loading}
        disabled={loading}
        style={isCompact ? styles.btnCompact : styles.btn}
      />

      {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 16,
    marginBottom: 20,
    ...adminShadow,
  },
  cardCompact: {
    marginBottom: 16,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: adminColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  titleCompact: {
    fontSize: 15,
  },
  subtitle: {
    color: adminColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  subtitleCompact: {
    color: adminColors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeOff: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  statusOn: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
  },
  statusOff: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  btn: {
    width: '100%',
  },
  btnCompact: {
    width: '100%',
  },
  success: {
    color: '#4ADE80',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 19,
  },
  error: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 19,
  },
});

export default DepositNotificationCard;
