import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Rect,
} from 'react-native-svg';
import { colors } from '../theme/theme';
import { GoldBarsIcon } from './PriceIcons';

const STROKE = colors.gold;
const SW = 1.4;

export const SERVER_ICON_TYPES = {
  'Whitelabel Live': 'whitelabel',
  'ComTech App Live': 'comtech',
  'Admin Backend Live': 'admin',
  'Redis Server Live': 'redis',
  'StoneX Api Live': 'stonex',
};

const ServerRackIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="4" width="14" height="4.5" rx="1" stroke={STROKE} strokeWidth={SW} />
    <Rect x="5" y="9.75" width="14" height="4.5" rx="1" stroke={STROKE} strokeWidth={SW} />
    <Rect x="5" y="15.5" width="14" height="4.5" rx="1" stroke={STROKE} strokeWidth={SW} />
    <Line x1="8" y1="6.25" x2="16" y2="6.25" stroke={STROKE} strokeWidth={0.9} />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={STROKE} strokeWidth={0.9} />
    <Circle cx="16.5" cy="17.75" r="0.8" fill={STROKE} />
  </Svg>
);

const GlobeIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="8" stroke={STROKE} strokeWidth={SW} />
    <Ellipse cx="12" cy="12" rx="3.5" ry="8" stroke={STROKE} strokeWidth={SW} />
    <Line x1="4" y1="12" x2="20" y2="12" stroke={STROKE} strokeWidth={SW} />
    <Line x1="12" y1="4" x2="12" y2="20" stroke={STROKE} strokeWidth={SW} />
    <Path
      d="M6.5 8.5C8 10 10 11 12 11s4-1 5.5-2.5M6.5 15.5C8 14 10 13 12 13s4 1 5.5 2.5"
      stroke={STROKE}
      strokeWidth={0.9}
    />
  </Svg>
);

const AdminShieldIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L5 6.5V12c0 4.2 3 7.4 7 8.5 4-1.1 7-4.3 7-8.5V6.5L12 3z"
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="2.2" stroke={STROKE} strokeWidth={SW} />
    <Path
      d="M8.5 15.2c.9-1.6 2-2.4 3.5-2.4s2.6.8 3.5 2.4"
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinecap="round"
    />
  </Svg>
);

const DatabaseIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" stroke={STROKE} strokeWidth={SW} />
    <Path
      d="M5.5 6.5v4.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V6.5"
      stroke={STROKE}
      strokeWidth={SW}
    />
    <Path
      d="M5.5 11v4.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V11"
      stroke={STROKE}
      strokeWidth={SW}
    />
    <Ellipse cx="12" cy="17.5" rx="6.5" ry="2.5" stroke={STROKE} strokeWidth={SW} />
  </Svg>
);

const StorageIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="8" width="14" height="10" rx="2" stroke={STROKE} strokeWidth={SW} />
    <Path d="M8 8V6.5a4 4 0 018 0V8" stroke={STROKE} strokeWidth={SW} />
    <Line x1="9" y1="13" x2="15" y2="13" stroke={STROKE} strokeWidth={SW} />
    <Circle cx="12" cy="13" r="1" fill={STROKE} />
  </Svg>
);

/** Decorative knot for section header */
export const KnotIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={STROKE} strokeWidth={SW} />
    <Path
      d="M12 3c2 3 2 5 0 7M12 21c-2-3-2-5 0-7M3 12c3 2 5 2 7 0M21 12c-3-2-5-2-7 0"
      stroke={STROKE}
      strokeWidth={SW}
      strokeLinecap="round"
    />
    <Path
      d="M7 7c2 1 3 2 3 5M17 17c-2-1-3-2-3-5M17 7c-1 2-2 3-5 3M7 17c1-2 2-3 5-3"
      stroke={STROKE}
      strokeWidth={0.9}
      strokeLinecap="round"
    />
  </Svg>
);

const ICON_MAP = {
  whitelabel: ServerRackIcon,
  comtech: GlobeIcon,
  admin: AdminShieldIcon,
  redis: DatabaseIcon,
  stonex: GoldBarsIcon,
  storage: StorageIcon,
};

const ServerIcon = ({ type = 'whitelabel', size = 24 }) => {
  const Icon = ICON_MAP[type] ?? ServerRackIcon;
  return <Icon size={size} />;
};

export const ServerIconBox = ({ type, size = 22 }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <ServerIcon type={type} size={size} />
  </View>
);

export const getServerIconType = title =>
  SERVER_ICON_TYPES[title] ?? 'whitelabel';

export default ServerIcon;
