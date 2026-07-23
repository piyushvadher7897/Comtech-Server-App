import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from './AdminIcons';
import { adminColors, adminShadow } from '../theme/adminTheme';

const SHEET_MAX = Math.min(Dimensions.get('window').height * 0.78, 640);

const AdminBottomSheet = ({ visible, onClose, title, subtitle, children }) => {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SHEET_MAX)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideY.setValue(SHEET_MAX);
      fade.setValue(0);
    }
  }, [visible, slideY, fade]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fade }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: SHEET_MAX,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideY }],
            },
          ]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {title || 'Details'}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <CloseIcon color={adminColors.textMuted} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const SheetRow = ({ label, value, highlight }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value || '—'}</Text>
  </View>
);

export const SheetAction = ({ label, onPress, tone = 'gold' }) => {
  const isOrange = tone === 'orange';
  const isGreen = tone === 'green';
  const isPurple = tone === 'purple';
  const isBlue = tone === 'blue';
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        isOrange && styles.actionOrange,
        isGreen && styles.actionGreen,
        isPurple && styles.actionPurple,
        isBlue && styles.actionBlue,
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text
        style={[
          styles.actionText,
          isOrange && styles.actionTextOrange,
          isGreen && styles.actionTextGreen,
          isPurple && styles.actionTextPurple,
          isBlue && styles.actionTextBlue,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: adminColors.backgroundElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    ...adminShadow,
    ...Platform.select({
      ios: { shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 18 },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  headerText: { flex: 1 },
  title: {
    color: adminColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: adminColors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: { marginBottom: 12 },
  rowLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  rowValue: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValueHighlight: {
    color: adminColors.amountGreen,
    fontWeight: '800',
  },
  actionBtn: {
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  actionOrange: {
    backgroundColor: 'rgba(251, 146, 60, 0.14)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },
  actionGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  actionPurple: {
    backgroundColor: 'rgba(167, 139, 250, 0.14)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  actionBlue: {
    backgroundColor: 'rgba(96, 165, 250, 0.14)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  actionText: {
    color: adminColors.goldLight,
    fontSize: 14,
    fontWeight: '800',
  },
  actionTextOrange: { color: '#FB923C' },
  actionTextGreen: { color: '#34D399' },
  actionTextPurple: { color: '#C4B5FD' },
  actionTextBlue: { color: '#93C5FD' },
});

export default AdminBottomSheet;
