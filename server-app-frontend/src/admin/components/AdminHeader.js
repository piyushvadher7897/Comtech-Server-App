import React, { useCallback } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { adminColors, getInitials } from '../theme/adminTheme';
import { BackIcon, MenuIcon } from './AdminIcons';
import { useAdminDrawer, useRegisterAdminNavigation } from '../context/AdminDrawerContext';
import { useAdmin } from '../context/AdminContext';
import { navigateToAdminProfile } from '../utils/navigation';

/**
 * Shared admin navigation header.
 *
 * Modes:
 * - Brand (no title): menu + centered Comtech logo + profile
 * - Page title: menu (+ optional back) + centered title + profile
 */
const AdminHeader = ({
  userName,
  title,
  showProfile = true,
  showMenu = true,
  showLogo,
  profileActive = false,
  onProfilePress,
  onBack,
  onMenuPress,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  useRegisterAdminNavigation(navigation);
  const { openDrawer } = useAdminDrawer();
  const { user } = useAdmin();

  const resolvedName = userName || (user && user.name) || '';
  const hasTitle = Boolean(title);
  // Centered logo on brand/home headers (e.g. Dashboard)
  const shouldShowLogo = showLogo != null ? showLogo : !hasTitle;
  const handleMenu = onMenuPress || openDrawer;

  const handleProfile = useCallback(() => {
    if (onProfilePress) {
      onProfilePress();
      return;
    }
    navigateToAdminProfile(navigation);
  }, [navigation, onProfilePress]);

  const avatar = (
    <View style={[styles.profileAvatar, profileActive && styles.profileAvatarActive]}>
      <Text style={styles.profileAvatarText}>{getInitials(resolvedName)}</Text>
    </View>
  );

  return (
    <View style={[styles.bar, { paddingTop: insets.top + (compact ? 6 : 10) }]}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        {/* Centered brand logo or page title */}
        <View style={styles.centerOverlay} pointerEvents="none">
          {hasTitle ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : shouldShowLogo ? (
            <Image
              source={require('../../../asset/images/logo-header-white.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Comtech Gold"
            />
          ) : null}
        </View>

        <View style={[styles.side, styles.sideLeft]}>
          <View style={styles.leftCluster}>
            {showMenu ? (
              <TouchableOpacity
                onPress={handleMenu}
                style={styles.menuBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Open menu">
                <MenuIcon size={20} />
              </TouchableOpacity>
            ) : null}

            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Go back">
                <BackIcon size={22} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={[styles.side, styles.sideRight]}>
          {showProfile && resolvedName ? (
            profileActive ? (
              avatar
            ) : (
              <TouchableOpacity
                onPress={handleProfile}
                activeOpacity={0.8}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Open profile">
                {avatar}
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.rightSpacer} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: adminColors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.headerBorder,
    paddingHorizontal: 14,
    paddingBottom: 10,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    position: 'relative',
  },
  headerCompact: {
    minHeight: 40,
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 56,
  },
  title: {
    color: adminColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  side: {
    minHeight: 40,
    justifyContent: 'center',
    zIndex: 1,
  },
  sideLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  sideRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  logo: {
    width: 118,
    height: 34,
  },
  backBtn: {
    width: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSpacer: {
    width: 38,
    height: 38,
  },
  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 201, 106, 0.55)',
  },
  profileAvatarActive: {
    borderWidth: 2.5,
    borderColor: adminColors.goldLight,
    shadowColor: adminColors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatarText: {
    color: '#1a1208',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default AdminHeader;
