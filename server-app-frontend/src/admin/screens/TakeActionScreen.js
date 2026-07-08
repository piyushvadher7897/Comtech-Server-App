import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminScreenLayout, AdminInput } from '../components/AdminInput';
import GoldButton from '../components/GoldButton';
import { BackIcon } from '../components/AdminIcons';
import { useAdmin } from '../context/AdminContext';
import {
  canUserActOnDeposit,
  isPendingAdminQueue,
  isPendingManagerQueue,
  APPROVAL_STAGE_LABELS,
} from '../constants/depositStatus';
import { adminColors, adminShadow, getInitials } from '../theme/adminTheme';
import { isEmptyDepositReference, getDisplayPaymentId, getDisplayReferenceNumber, getEditableReferenceNumber, isMissingDepositProfile } from '../../services/adminApi';

const MANAGER_OPTIONS = [
  { id: 'Approved', label: 'Approve', hint: `${APPROVAL_STAGE_LABELS.ADMIN} approval for this deposit` },
  { id: 'Rejected', label: 'Reject', hint: 'Reject this deposit request' },
];

const ADMIN_OPTIONS = [
  { id: 'Approved', label: 'Approve', hint: `${APPROVAL_STAGE_LABELS.SUPER_ADMIN} approval — fund will be deposited` },
  { id: 'SendBack', label: 'Send Back', hint: 'Send back for more information' },
];

const resolveStage = (deposit, queueType) => {
  if (queueType === 'pending_manager') return 'manager';
  if (queueType === 'pending_admin') return 'admin';
  if (isPendingManagerQueue(deposit)) return 'manager';
  if (isPendingAdminQueue(deposit)) return 'admin';
  return null;
};

const TakeActionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { deposits, isManager, isAdmin, isSuperAdmin, getDepositById, submitAction } = useAdmin();
  const depositId = route.params?.depositId;
  const queueType = route.params?.queueType;
  const paramDeposit = route.params?.deposit;
  const cached = paramDeposit || deposits.find(d => d.id === depositId);
  const [deposit, setDeposit] = React.useState(cached || null);
  const [loading, setLoading] = React.useState(!cached);
  const stage = deposit ? resolveStage(deposit, queueType) : null;
  const isManagerStage = stage === 'manager';
  const isAdminStage = stage === 'admin';
  const actionOptions = isManagerStage ? MANAGER_OPTIONS : ADMIN_OPTIONS;
  const [selected, setSelected] = useState(actionOptions[0]?.id || 'Approved');
  const [remarks, setRemarks] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const maxRemarks = 250;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const canAct =
    deposit && canUserActOnDeposit(deposit, { isManager, isAdmin, isSuperAdmin });

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (cached && !isMissingDepositProfile(cached)) {
        setDeposit(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      const detail = await getDepositById(depositId);
      if (active) {
        setDeposit(detail || cached || null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cached, depositId, getDepositById]);

  React.useEffect(() => {
    if (deposit) {
      const opts = resolveStage(deposit, queueType) === 'manager' ? MANAGER_OPTIONS : ADMIN_OPTIONS;
      setSelected(opts[0].id);
      setReferenceNumber(getEditableReferenceNumber(deposit));
      setFieldErrors({});
    }
  }, [deposit?.id, deposit?.dbStatus, deposit?.approveStatus, queueType]);

  const validateManagerFields = () => {
    const nextErrors = {};
    if (isEmptyDepositReference(referenceNumber)) {
      nextErrors.referenceNumber = 'Please enter the reference number';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  if (loading) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator color={adminColors.gold} size="large" />
          <Text style={styles.loadingText}>Loading deposit...</Text>
        </View>
      </AdminScreenLayout>
    );
  }

  if (!deposit) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <Text style={styles.missing}>Deposit not found.</Text>
          <Text style={styles.missingHint}>
            Check that the backend is running and you are logged in.
          </Text>
        </View>
      </AdminScreenLayout>
    );
  }

  if (!isManagerStage && !isAdminStage) {
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <Text style={styles.missing}>This deposit is not awaiting approval.</Text>
          <Text style={styles.missingHint}>
            Status: {deposit.dbStatus || '—'} · Approve: {deposit.approveStatus || '—'}
          </Text>
        </View>
      </AdminScreenLayout>
    );
  }

  if (!canAct) {
    const roleHint = isManagerStage
      ? `Only an ${APPROVAL_STAGE_LABELS.ADMIN} can approve at this stage.`
      : `Only a ${APPROVAL_STAGE_LABELS.SUPER_ADMIN} can give final approval at this stage.`;
    return (
      <AdminScreenLayout>
        <View style={styles.center}>
          <Text style={styles.missing}>You cannot act on this deposit.</Text>
          <Text style={styles.missingHint}>{roleHint}</Text>
        </View>
      </AdminScreenLayout>
    );
  }

  const handleSubmit = async () => {
    setSubmitError('');
    if (isManagerStage && !validateManagerFields()) {
      return;
    }
    setSubmitting(true);
    const result = await submitAction(
      deposit,
      selected,
      remarks,
      isManagerStage
        ? { refNo: referenceNumber.trim() }
        : undefined,
    );
    setSubmitting(false);
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'AdminTabs',
          state: {
            index: 0,
            routes: [{ name: 'AdminDashboard' }],
          },
        },
        {
          name: 'ApprovalSuccess',
          params: {
            depositId: deposit.id,
            deposit: result.data || deposit,
            action: selected,
            stage: result.stage,
          },
        },
      ],
    });
  };

  return (
    <AdminScreenLayout>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Action</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(deposit.userName)}</Text>
            </View>
            <View style={styles.summaryBody}>
              <Text style={styles.name}>{deposit.userName}</Text>
              {deposit.email ? <Text style={styles.email}>{deposit.email}</Text> : null}
              <Text style={styles.amount}>
                AED {Number(deposit.amountAed).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={styles.readOnlyBlock}>
            <Text style={styles.readOnlyLabel}>Payment ID</Text>
            <Text style={styles.readOnlyValue}>{getDisplayPaymentId(deposit) || '—'}</Text>
          </View>

          {isManagerStage ? (
            <>
              <AdminInput
                label="Reference Number *"
                value={referenceNumber}
                onChangeText={value => {
                  setReferenceNumber(value);
                  if (fieldErrors.referenceNumber) {
                    setFieldErrors(prev => ({ ...prev, referenceNumber: undefined }));
                  }
                }}
                placeholder="Enter reference number"
                autoCapitalize="characters"
              />
              {fieldErrors.referenceNumber ? (
                <Text style={styles.fieldError}>{fieldErrors.referenceNumber}</Text>
              ) : null}
            </>
          ) : (
            <View style={styles.readOnlyBlock}>
              <Text style={styles.readOnlyLabel}>Reference Number</Text>
              <Text style={styles.readOnlyValue}>
                {getDisplayReferenceNumber(deposit)}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Select Action</Text>
          {actionOptions.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, selected === opt.id && styles.optionSelected]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.85}>
              <View style={[styles.radio, selected === opt.id && styles.radioOn]}>
                {selected === opt.id ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                {opt.hint ? <Text style={styles.optionHint}>{opt.hint}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Remarks (Optional)</Text>
          <TextInput
            style={styles.remarks}
            value={remarks}
            onChangeText={t => setRemarks(t.slice(0, maxRemarks))}
            placeholder="Enter remarks here..."
            placeholderTextColor={adminColors.textDim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {remarks.length}/{maxRemarks}
          </Text>
          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <GoldButton title="SUBMIT" onPress={handleSubmit} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </AdminScreenLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: adminColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: { paddingHorizontal: 16 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 16,
    marginBottom: 22,
    ...adminShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1a1208', fontSize: 16, fontWeight: '800' },
  summaryBody: { flex: 1 },
  name: { color: adminColors.textPrimary, fontSize: 17, fontWeight: '700' },
  email: { color: adminColors.textMuted, fontSize: 12, marginTop: 2 },
  ref: { color: adminColors.textMuted, fontSize: 12, marginTop: 2 },
  readOnlyBlock: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    padding: 14,
    marginBottom: 18,
  },
  readOnlyLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyLabelSpaced: { marginTop: 12 },
  readOnlyValue: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  fieldError: {
    color: '#F87171',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 12,
  },
  amount: { color: adminColors.amountGreen, fontSize: 18, fontWeight: '800', marginTop: 6 },
  sectionTitle: {
    color: adminColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.cardBgLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  optionSelected: {
    borderColor: adminColors.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: adminColors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: { borderColor: adminColors.gold },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.gold,
  },
  optionText: { flex: 1 },
  optionLabel: { color: adminColors.textPrimary, fontSize: 15, fontWeight: '700' },
  optionHint: { color: adminColors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  remarks: {
    backgroundColor: adminColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    color: adminColors.textPrimary,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
  },
  charCount: {
    color: adminColors.textDim,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 8,
  },
  submitError: { color: '#F87171', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: adminColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missing: { color: adminColors.textPrimary, fontSize: 16, textAlign: 'center', fontWeight: '600' },
  missingHint: {
    color: adminColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  loadingText: { color: adminColors.textMuted, fontSize: 14, marginTop: 12 },
});

export default TakeActionScreen;
