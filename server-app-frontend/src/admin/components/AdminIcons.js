import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from '../../theme/theme';
import { adminColors } from '../theme/adminTheme';

const tabColor = focused => (focused ? adminColors.gold : adminColors.textMuted);
const iconColor = focused => (focused ? colors.gold : colors.textMuted);

export const DashboardIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5H5.5A1.5 1.5 0 014 19v-8.5z"
      stroke={tabColor(focused)}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 20.5V14a2.5 2.5 0 015 0v6.5"
      stroke={tabColor(focused)}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const DepositsIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="13" rx="2" stroke={tabColor(focused)} strokeWidth={1.8} />
    <Path
      d="M3 10h18M8 6V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5V6"
      stroke={tabColor(focused)}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="14.5" r="2" stroke={tabColor(focused)} strokeWidth={1.6} />
  </Svg>
);

export const ApprovalsIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="3" width="16" height="18" rx="2" stroke={tabColor(focused)} strokeWidth={1.8} />
    <Path
      d="M8 8h8M8 12h8M8 16h5"
      stroke={tabColor(focused)}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Circle cx="17" cy="17" r="4" fill={focused ? adminColors.gold : adminColors.cardBg} stroke={tabColor(focused)} strokeWidth={1.4} />
    <Path
      d="M15.5 17l1 1 2-2"
      stroke={focused ? '#1a1208' : tabColor(focused)}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ProfileIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={tabColor(focused)} strokeWidth={1.8} />
    <Path
      d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
      stroke={tabColor(focused)}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const ServerIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="4" width="20" height="6" rx="2" stroke={iconColor(focused)} strokeWidth={1.8} />
    <Rect x="2" y="14" width="20" height="6" rx="2" stroke={iconColor(focused)} strokeWidth={1.8} />
    <Circle cx="6" cy="7" r="1" fill={iconColor(focused)} />
    <Circle cx="6" cy="17" r="1" fill={iconColor(focused)} />
    <Line x1="10" y1="7" x2="18" y2="7" stroke={iconColor(focused)} strokeWidth={1.4} strokeLinecap="round" />
    <Line x1="10" y1="17" x2="18" y2="17" stroke={iconColor(focused)} strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

export const AdminSideIcon = ({ focused, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={iconColor(focused)} strokeWidth={1.8} />
    <Circle cx="12" cy="9" r="2.5" stroke={iconColor(focused)} strokeWidth={1.6} />
    <Path
      d="M7.5 17c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
      stroke={iconColor(focused)}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <Path
      d="M17 8h2M18 7v2"
      stroke={iconColor(focused)}
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  </Svg>
);

export const BackIcon = ({ color = adminColors.gold, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronRightIcon = ({ color = adminColors.textMuted, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 6l6 6-6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SearchIcon = ({ color = adminColors.textDim, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.8} />
    <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const FilterIcon = ({ color = adminColors.gold, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 6h16M7 12h10M10 18h4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const CloseIcon = ({ color = adminColors.textMuted, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 7l10 10M17 7L7 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const CalendarIcon = ({ color = adminColors.gold, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M3 9h18M8 3v4M16 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const MenuIcon = ({ color = adminColors.textPrimary, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const BellIcon = ({ color = adminColors.textPrimary, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3a5 5 0 00-5 5v3.5L5 14.5h14l-2-3V8a5 5 0 00-5-5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M10 18a2 2 0 004 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const MailIcon = ({ color = adminColors.gold, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={1.6} />
    <Path d="M3 7l9 6 9-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LockIcon = ({ color = adminColors.gold, size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={1.6} />
    <Path
      d="M8 11V8a4 4 0 118 0v3"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </Svg>
);

export const EyeIcon = ({ color = adminColors.textMuted, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const EyeOffIcon = ({ color = adminColors.textMuted, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3l18 18M10.6 10.6A2.5 2.5 0 0012 15a2.5 2.5 0 002.4-4.4M6.7 6.7C4.6 8.1 3 10 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.8-1.1M17.3 17.3C19.4 15.9 21 14 22 12s-3.5-7-10-7c-1.1 0-2.1.2-3 .5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShieldIcon = ({ color = adminColors.gold, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ClockIcon = ({ color = '#86EFAC', size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 7v5l3 2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckSmallIcon = ({ color = '#4ADE80', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 12l4 4 8-9"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CrossSmallIcon = ({ color = '#F87171', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 7l10 10M17 7L7 17"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

export const PendingClockIcon = ({ color = '#60A5FA', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 7v5l2.5 1.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckboxCheckIcon = ({ color = '#1a1208', size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12l5 5L19 7"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckCircleIcon = ({ size = 88 }) => (
  <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
    <Circle cx="44" cy="44" r="40" fill="rgba(22, 163, 74, 0.15)" />
    <Circle cx="44" cy="44" r="36" stroke="#22C55E" strokeWidth={3} />
    <Path
      d="M28 45l12 12 20-24"
      stroke="#4ADE80"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Sparkles = () => (
  <Svg width={140} height={50} viewBox="0 0 140 50" style={{ position: 'absolute' }}>
    <Circle cx="18" cy="12" r="2.5" fill="#E8C96A" opacity={0.85} />
    <Circle cx="122" cy="10" r="2" fill="#D4AF37" opacity={0.9} />
    <Circle cx="105" cy="32" r="1.8" fill="#F0D78C" opacity={0.75} />
    <Circle cx="38" cy="34" r="1.5" fill="#E8C96A" opacity={0.65} />
    <Path d="M70 6l1.2 3.5 3.5 1.2-3.5 1.2-1.2 3.5-1.2-3.5-3.5-1.2 3.5-1.2z" fill="#D4AF37" opacity={0.9} />
    <Path d="M90 38l0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8z" fill="#E8C96A" opacity={0.7} />
  </Svg>
);
