import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { CheckCircleIcon, Sparkles } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import { resetToAdminDashboard } from '../utils/navigation';
import { getDisplayPaymentId, getDisplayReferenceNumber } from '../../services/adminApi';
import { adminColors } from '../theme/adminTheme';
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

const ApprovalSuccessScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { deposits, loadAdminData } = useAdmin();
  const { depositId, action, stage } = route.params || {};
  const deposit = deposits.find(d => d.id === depositId);

  const goToDashboard = useCallback(async () => {
    await loadAdminData({ silent: true, force: true });
    resetToAdminDashboard(navigation);
  }, [loadAdminData, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goToDashboard();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [goToDashboard]),
  );

  const getContent = () => {
    if (action === 'Approved' && stage === 'manager') {
      return {
        title: 'Approved!',
        message: `The deposit request has been approved and sent for ${APPROVAL_STAGE_LABELS.SUPER_ADMIN_APPROVAL}.`,
        nextStage: APPROVAL_STAGE_LABELS.SUPER_ADMIN_APPROVAL,
        statusLabel: null,
        timeLabel: 'Approved At',
      };
    }
    if (action === 'Approved') {
      return {
        title: 'Deposit Completed!',
        message:
          'The deposit has been approved and the fund is deposited successfully.',
        nextStage: null,
        statusLabel: APPROVAL_STAGE_LABELS.APPROVED_BY_SUPER_ADMIN,
        timeLabel: 'Approved At',
      };
    }
    if (action === 'Rejected') {
      return {
        title: 'Rejected',
        message: 'The deposit request has been rejected.',
        nextStage: null,
        statusLabel: 'Rejected',
        timeLabel: 'Rejected At',
      };
    }
    if (action === 'SendBack') {
      return {
        title: 'Sent Back',
        message: 'The deposit request has been sent back for more information.',
        nextStage: null,
        statusLabel: 'Send Back',
        timeLabel: 'Sent Back At',
      };
    }
    return {
      title: 'Action Submitted',
      message: 'Your action has been recorded successfully.',
      nextStage: null,
      statusLabel: null,
      timeLabel: 'Timestamp',
    };
  };

  const content = getContent();
  const lastActivity = deposit?.activity?.[deposit.activity.length - 1];

  return (
    <AdminScreenLayout>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Sparkles />
          <CheckCircleIcon />
        </View>

        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.message}>{content.message}</Text>

        {deposit ? (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment ID</Text>
              <Text style={styles.detailValue}>{getDisplayPaymentId(deposit)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference Number</Text>
              <Text style={styles.detailValue}>{getDisplayReferenceNumber(deposit)}</Text>
            </View>
            {content.nextStage ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Stage</Text>
                <Text style={[styles.detailValue, styles.detailGreen]}>
                  {content.nextStage}
                </Text>
              </View>
            ) : null}
            {content.statusLabel ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, styles.detailGreen]}>
                  {content.statusLabel}
                </Text>
              </View>
            ) : null}
            {lastActivity ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{content.timeLabel}</Text>
                <Text style={styles.detailValue}>{formatDate(lastActivity.at)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <GoldButton
          title="GO TO DASHBOARD"
          onPress={goToDashboard}
          style={styles.btn}
        />
        <GoldButton
          title="VIEW DETAILS"
          variant="outline"
          onPress={() =>
            navigation.navigate('DepositDetail', { depositId: deposit?.id })
          }
          style={styles.btnOutline}
        />
      </ScrollView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 100,
  },
  title: {
    color: adminColors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: adminColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  details: {
    width: '100%',
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 18,
    marginBottom: 28,
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  detailGreen: {
    color: adminColors.amountGreen,
  },
  btn: {
    width: '100%',
    marginBottom: 12,
  },
  btnOutline: {
    width: '100%',
  },
});

export default ApprovalSuccessScreen;
