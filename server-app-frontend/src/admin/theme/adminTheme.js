export const adminColors = {
  background: '#13110F',
  backgroundElevated: '#1A1714',
  headerBg: '#0A0908',
  headerBorder: 'rgba(212, 175, 55, 0.25)',
  cardBg: '#1F1C18',
  cardBgLight: '#28241F',
  cardBorder: 'rgba(212, 175, 55, 0.3)',
  gold: '#D4AF37',
  goldLight: '#E8C96A',
  goldMuted: '#B89B45',
  textPrimary: '#F5F0E8',
  textSecondary: '#D8D0C4',
  textMuted: '#A39E94',
  textDim: '#706B62',
  amountGreen: '#34D399',
  pendingGreen: '#22C55E',
  pendingGreenBg: 'rgba(34, 197, 94, 0.14)',
  pendingGreenBorder: 'rgba(74, 222, 128, 0.3)',
  errorText: '#FCA5A5',
  errorBg: 'rgba(127, 29, 29, 0.35)',
  tabTrack: '#1A1714',
  tabIndicator: '#D4AF37',
  adminAccent: '#4A6FA5',
  managerAccent: '#D4AF37',
};

export const adminShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
  elevation: 6,
};

export const getInitials = name => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
