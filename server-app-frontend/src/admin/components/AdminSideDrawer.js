import React, { useRef, useEffect } from 'react';
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
import { useAdmin } from '../context/AdminContext';
import { useAdminDrawer } from '../context/AdminDrawerContext';
import { adminColors, adminShadow, getInitials } from '../theme/adminTheme';
import {
  DashboardIcon,
  DepositsIcon,
  WithdrawIcon,
  ApprovalsIcon,
  ProfileIcon,
  CloseIcon,
  LogoutIcon,
  ChevronRightIcon,
} from './AdminIcons';
import { navigateToAdminScreen } from '../utils/navigation';

const WINDOW = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(WINDOW.width * 0.82, 320);
const DRAWER_HEIGHT = WINDOW.height;

const MenuRow = ({ icon, title, subtitle, badge, accent, onPress }) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.menuIcon, { backgroundColor: accent.bg, borderColor: accent.border }]}>
      {icon}
    </View>
    <View style={styles.menuBody}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
    </View>
    {badge > 0 ? (
      <View style={[styles.badge, { backgroundColor: accent.badgeBg }]}>
        <Text style={[styles.badgeText, { color: accent.color }]}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    ) : (
      <ChevronRightIcon color={adminColors.textDim} size={16} />
    )}
  </TouchableOpacity>
);

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const AdminSideDrawer = () => {
  const insets = useSafeAreaInsets();
  const { open, closeDrawer, getNavigation } = useAdminDrawer();
  const { user, stats, logout } = useAdmin();
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      requestAnimationFrame(() => {
        if (scrollRef.current && scrollRef.current.scrollTo) {
          scrollRef.current.scrollTo({ y: 0, animated: false });
        }
      });
    } else {
      slideX.setValue(-DRAWER_WIDTH);
      fade.setValue(0);
    }
  }, [open, slideX, fade]);

  const go = action => {
    closeDrawer();
    setTimeout(action, 80);
  };

  const withNav = fn => {
    go(() => {
      const navigation = getNavigation();
      if (!navigation) return;
      fn(navigation);
    });
  };

  const openTab = (screen, params) => {
    withNav(navigation => {
      let nav = navigation;
      while (nav) {
        const names = nav.getState && nav.getState().routeNames;
        if (Array.isArray(names) && names.includes('AdminTabs')) {
          nav.navigate('AdminTabs', { screen, params });
          return;
        }
        if (Array.isArray(names) && names.includes(screen)) {
          nav.navigate(screen, params);
          return;
        }
        nav = nav.getParent && nav.getParent();
      }
      navigation.navigate('AdminTabs', { screen, params });
    });
  };

  const openStack = (screen, params) => {
    withNav(navigation => navigateToAdminScreen(navigation, screen, params));
  };

  const handleLogout = () => {
    go(async () => {
      await logout();
    });
  };

  const depositPending = stats.totalPending || 0;
  const withdrawPending = stats.withdrawTotalPending || 0;
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.backdrop, { opacity: fade }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              height: DRAWER_HEIGHT,
              paddingTop: insets.top + 8,
              paddingBottom: bottomPad,
              transform: [{ translateX: slideX }],
            },
          ]}>
          <View style={styles.drawerHeader}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(user && user.name)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {(user && user.name) || 'Admin'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {(user && user.email) || 'Comtech Admin'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={10}>
              <CloseIcon color={adminColors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.scrollWrap}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              persistentScrollbar={Platform.OS === 'android'}
              bounces
              alwaysBounceVertical
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              overScrollMode="always"
              scrollEventThrottle={16}>
              <SectionLabel>Main</SectionLabel>
              <MenuRow
                icon={<DashboardIcon focused size={18} />}
                title="Home"
                subtitle="Dashboard overview"
                accent={{
                  bg: 'rgba(212, 175, 55, 0.12)',
                  border: 'rgba(212, 175, 55, 0.28)',
                  color: adminColors.gold,
                  badgeBg: 'rgba(212, 175, 55, 0.18)',
                }}
                onPress={() => openTab('AdminDashboard')}
              />
              <MenuRow
                icon={<ProfileIcon focused size={18} />}
                title="Users"
                subtitle="Search name, email, mobile"
                accent={{
                  bg: 'rgba(96, 165, 250, 0.12)',
                  border: 'rgba(96, 165, 250, 0.28)',
                  color: '#93C5FD',
                  badgeBg: 'rgba(96, 165, 250, 0.18)',
                }}
                onPress={() => openStack('UserList')}
              />
              <MenuRow
                icon={<ProfileIcon focused size={18} />}
                title="Profile"
                subtitle="Account & settings"
                accent={{
                  bg: 'rgba(148, 163, 184, 0.12)',
                  border: 'rgba(148, 163, 184, 0.28)',
                  color: '#CBD5E1',
                  badgeBg: 'rgba(148, 163, 184, 0.18)',
                }}
                onPress={() => openTab('AdminProfile')}
              />

              <SectionLabel>Fund Deposit</SectionLabel>
              <MenuRow
                icon={<DepositsIcon focused size={18} />}
                title="All Deposits"
                subtitle="Money in — deposit history"
                accent={{
                  bg: 'rgba(52, 211, 153, 0.12)',
                  border: 'rgba(52, 211, 153, 0.3)',
                  color: '#34D399',
                  badgeBg: 'rgba(52, 211, 153, 0.18)',
                }}
                onPress={() => openStack('FundDepositList', { initialTab: 'all' })}
              />
              <MenuRow
                icon={<ApprovalsIcon focused size={18} />}
                title="Approve Deposits"
                subtitle="Pending deposit approvals"
                badge={depositPending}
                accent={{
                  bg: 'rgba(52, 211, 153, 0.12)',
                  border: 'rgba(52, 211, 153, 0.3)',
                  color: '#34D399',
                  badgeBg: 'rgba(52, 211, 153, 0.18)',
                }}
                onPress={() =>
                  openTab('AdminApprovals', { kind: 'deposit', initialTab: 'pending_manager' })
                }
              />

              <SectionLabel>Fund Withdraw</SectionLabel>
              <MenuRow
                icon={<WithdrawIcon focused size={18} />}
                title="All Withdraws"
                subtitle="Money out — withdraw history"
                accent={{
                  bg: 'rgba(251, 146, 60, 0.12)',
                  border: 'rgba(251, 146, 60, 0.3)',
                  color: '#FB923C',
                  badgeBg: 'rgba(251, 146, 60, 0.18)',
                }}
                onPress={() => openStack('FundWithdrawList', { initialTab: 'all' })}
              />
              <MenuRow
                icon={<ApprovalsIcon focused size={18} />}
                title="Approve Withdraws"
                subtitle="Pending withdraw approvals"
                badge={withdrawPending}
                accent={{
                  bg: 'rgba(251, 146, 60, 0.12)',
                  border: 'rgba(251, 146, 60, 0.3)',
                  color: '#FB923C',
                  badgeBg: 'rgba(251, 146, 60, 0.18)',
                }}
                onPress={() =>
                  openTab('AdminApprovals', { kind: 'withdraw', initialTab: 'pending_manager' })
                }
              />

              <SectionLabel>Gold trading</SectionLabel>
              <MenuRow
                icon={<DepositsIcon focused size={18} />}
                title="Buy / Sell Gold"
                subtitle="Toggle buy & sell orders"
                accent={{
                  bg: 'rgba(212, 175, 55, 0.12)',
                  border: 'rgba(212, 175, 55, 0.3)',
                  color: '#E8C96A',
                  badgeBg: 'rgba(212, 175, 55, 0.18)',
                }}
                onPress={() => openStack('BuyGoldList', { kind: 'buy' })}
              />

              <SectionLabel>Reports</SectionLabel>
              <MenuRow
                icon={<ApprovalsIcon focused size={18} />}
                title="Audits"
                subtitle="User transaction history"
                accent={{
                  bg: 'rgba(148, 163, 184, 0.12)',
                  border: 'rgba(148, 163, 184, 0.28)',
                  color: '#CBD5E1',
                  badgeBg: 'rgba(148, 163, 184, 0.18)',
                }}
                onPress={() => openStack('AuditList')}
              />

              <TouchableOpacity
                style={styles.logoutBtnInScroll}
                onPress={handleLogout}
                activeOpacity={0.85}>
                <LogoutIcon color="#F87171" size={18} />
                <Text style={styles.logoutText}>Sign out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: adminColors.backgroundElevated,
    borderRightWidth: 1,
    borderRightColor: 'rgba(212, 175, 55, 0.28)',
    flexDirection: 'column',
    ...adminShadow,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  userRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1a1208',
    fontWeight: '800',
    fontSize: 15,
  },
  userInfo: { flex: 1 },
  userName: {
    color: adminColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: adminColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollWrap: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionLabel: {
    color: adminColors.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuTitle: {
    color: adminColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  menuSub: {
    color: adminColors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  logoutBtnInScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AdminSideDrawer;
