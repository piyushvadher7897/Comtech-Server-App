import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminColors, getInitials } from '../theme/adminTheme';
import { BackIcon } from './AdminIcons';

const AdminHeader = ({
  userName,
  title,
  showProfile = true,
  profileActive = false,
  onProfilePress,
  onBack,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();
  const clean = !title;
  const avatar = (
    <View style={[styles.profileAvatar, profileActive && styles.profileAvatarActive]}>
      <Text style={styles.profileAvatarText}>{getInitials(userName)}</Text>
    </View>
  );

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <View style={[styles.header, clean && styles.headerClean, compact && styles.headerCompact]}>
        <View style={[styles.left, clean && styles.leftClean]}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
              <BackIcon size={22} />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../../../asset/images/logo-header-white.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </View>

        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.flexSpacer} />
        )}

        <View style={[styles.right, clean && styles.rightClean]}>
          {showProfile && userName ? (
            onProfilePress && !profileActive ? (
              <TouchableOpacity onPress={onProfilePress} activeOpacity={0.8} hitSlop={8}>
                {avatar}
              </TouchableOpacity>
            ) : (
              avatar
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
    borderBottomWidth: 1,
    borderBottomColor: adminColors.headerBorder,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  headerClean: {
    justifyContent: 'space-between',
  },
  headerCompact: {
    minHeight: 40,
  },
  left: {
    width: 130,
    justifyContent: 'center',
  },
  leftClean: {
    width: undefined,
    flexShrink: 1,
  },
  logo: {
    width: 130,
    height: 38,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: adminColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  flexSpacer: {
    flex: 1,
  },
  right: {
    width: 130,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightClean: {
    width: undefined,
    flexShrink: 0,
  },
  rightSpacer: {
    width: 42,
    height: 42,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: adminColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.45)',
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
