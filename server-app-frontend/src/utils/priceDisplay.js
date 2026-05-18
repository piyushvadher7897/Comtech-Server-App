/** UI-only helpers — does not change API/socket logic */

import moment from 'moment';

/** Prefer server timestamp; fall back to when this update was received */
export const pickPriceUpdatedAt = (data, receivedAt = new Date()) => {
  const candidates = [
    data?.updatedAt,
    data?.timestamp,
    data?.date,
    data?.lastUpdated,
    data?.priceDate,
    data?.modifiedAt,
  ];
  for (const value of candidates) {
    if (!value) continue;
    const parsed = moment(value);
    if (parsed.isValid()) return parsed.toDate();
  }
  return receivedAt instanceof Date ? receivedAt : new Date(receivedAt);
};

export const formatPriceUpdatedLabel = date =>
  date ? `Updated ${moment(date).format('DD MMM YYYY, hh:mm A')}` : '';

export const isValidDisplayPrice = value => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

const resolvePrice = (current, lastValid) => {
  if (isValidDisplayPrice(current)) return Number(current);
  if (isValidDisplayPrice(lastValid)) return Number(lastValid);
  return null;
};

export const getDisplayPrice = (
  value,
  { loading = false, refreshing = false, lastValid = null } = {},
) => {
  if (isValidDisplayPrice(value)) {
    return {
      text: Number(value).toFixed(4),
      variant: refreshing ? 'stale' : 'ready',
    };
  }

  if (isValidDisplayPrice(lastValid)) {
    return {
      text: Number(lastValid).toFixed(4),
      variant: refreshing ? 'stale' : 'stale',
    };
  }

  if (loading || refreshing) {
    return { text: '···', variant: 'loading' };
  }

  return { text: '—', variant: 'unavailable' };
};

export const getDisplayDifference = (stoneX, dgjg, options = {}) => {
  const { loading = false, refreshing = false, lastStoneX = null, lastDgjg = null } =
    options;

  const sx = resolvePrice(stoneX, lastStoneX);
  const dg = resolvePrice(dgjg, lastDgjg);

  if (sx != null && dg != null) {
    return {
      text: (dg - sx).toFixed(4),
      variant: refreshing ? 'stale' : 'ready',
    };
  }

  if ((loading || refreshing) && (sx == null || dg == null)) {
    return { text: '···', variant: 'loading' };
  }

  return { text: '—', variant: 'unavailable' };
};

const parseShownPrice = text => {
  if (!text || text === '—' || text === '···') return null;
  const num = Number(text);
  return Number.isFinite(num) && num > 0 ? num : null;
};

/** Prefer numbers already shown on price cards so difference always matches UI */
export const getShownDifferenceText = ({
  stoneXDisplayText,
  dgjgDisplayText,
  stoneX,
  dgjg,
  lastStoneX,
  lastDgjg,
  fallback = '—',
}) => {
  const sx =
    parseShownPrice(stoneXDisplayText) ?? resolvePrice(stoneX, lastStoneX);
  const dg = parseShownPrice(dgjgDisplayText) ?? resolvePrice(dgjg, lastDgjg);

  if (sx != null && dg != null) {
    return (dg - sx).toFixed(4);
  }

  return fallback;
};
