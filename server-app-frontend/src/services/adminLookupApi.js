import api from './apiClient';
import { getWebAdminDateRange } from './adminApi';

export const LOOKUP_PAGE_SIZE = 15;
const APP_ADMIN_BASE = '/api/appadmin';

const formatName = (firstName, lastName, email) => {
  const full = `${firstName || ''} ${lastName || ''}`.trim();
  return full || email || '—';
};

const formatMobile = (countryCode, mobile) => {
  const code = String(countryCode || '').trim();
  const num = String(mobile || '').trim();
  if (!num) return '—';
  return code ? `${code} ${num}` : num;
};

export const mapBackendUser = doc => {
  const record = doc || {};
  const kyc = record.kyc || {};
  return {
    id: String(record._id || record.id || ''),
    firstName: record.firstName || '',
    lastName: record.lastName || '',
    name: formatName(record.firstName, record.lastName, record.email),
    email: record.email || '',
    mobile: formatMobile(record.countryCode, record.mobile),
    countryCode: record.countryCode || '',
    phone: record.mobile || '',
    status: record.status || '',
    currency: record.currency || 'AED',
    fundTotal: Number(record.fundTotal || 0),
    usdFundTotal: Number(record.usdFundTotal || 0),
    goldTotal: Number(record.goldTotal || 0),
    kycStatus: kyc.status || '',
    kycFullName: kyc.fullName || '',
    createdAt: record.createdAt || record.date,
    _raw: record,
  };
};

export const fetchUsersPage = async (params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || LOOKUP_PAGE_SIZE;
  const q = String(params.q || '').trim();
  const requestParams = { page, limit };
  if (q) requestParams.q = q;

  const { data } = await api.get(`${APP_ADMIN_BASE}/users`, { params: requestParams });
  const docs = (data.docs || data.data || []).map(mapBackendUser);
  return {
    docs,
    totalDocs: data.totalDocs != null ? data.totalDocs : docs.length,
    page,
    limit,
    hasNextPage: Boolean(data.hasNextPage),
  };
};

export const fetchUserDetail = async id => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/users/view`, { id });
  const payload = data.data || data;
  const mapped = mapBackendUser(payload);
  const fundDeposits = payload.funddeposit || payload.fundDeposit || [];
  const fundWithdraws = payload.fundwithdraw || payload.fundWithdraw || [];
  const buyGold = payload.buygold || payload.buyGold || [];
  const sellGold = payload.sellgold || payload.sellGold || [];
  return {
    ...mapped,
    banks: payload.userbanks || payload.userBanks || [],
    kyc: payload.kyc || null,
    depositCount: Array.isArray(fundDeposits) ? fundDeposits.length : 0,
    withdrawCount: Array.isArray(fundWithdraws) ? fundWithdraws.length : 0,
    buyCount: Array.isArray(buyGold) ? buyGold.length : 0,
    sellCount: Array.isArray(sellGold) ? sellGold.length : 0,
    fundDeposits,
    fundWithdraws,
    buyGold,
    sellGold,
    _raw: payload,
  };
};

const mapTradeRow = (doc, kind) => {
  const record = doc || {};
  const user = record.user || {};
  return {
    id: String(record._id || record.id || ''),
    kind,
    userName: formatName(user.firstName, user.lastName, user.email),
    email: user.email || '',
    goldGm: Number(record.goldGm || 0),
    amount: Number(record.amount || record.aedAmount || 0),
    rate: Number(record.rate || record.aedRate || 0),
    currency: record.currency || 'AED',
    status: record.status || '',
    orderID: record.orderID || '',
    paymentVia: record.paymentVia || '',
    description: record.description || '',
    createdAt: record.createdAt || record.date,
    userID: record.userID || (user && user._id) || null,
    _raw: record,
  };
};

export const fetchBuyGoldPage = async (params = {}) => {
  const dateRange = getWebAdminDateRange();
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || LOOKUP_PAGE_SIZE;
  const q = String(params.q || '').trim();
  const requestParams = {
    page,
    limit,
    startDate: params.startDate || dateRange.startDate,
    endDate: params.endDate || dateRange.endDate,
  };
  if (q) requestParams.q = q;

  const { data } = await api.get(`${APP_ADMIN_BASE}/buygold`, { params: requestParams });
  const docs = (data.docs || data.data || []).map(d => mapTradeRow(d, 'buy'));
  return {
    docs,
    totalDocs: data.totalDocs != null ? data.totalDocs : docs.length,
    page,
    limit,
    hasNextPage: Boolean(data.hasNextPage),
  };
};

export const fetchSellGoldPage = async (params = {}) => {
  const dateRange = getWebAdminDateRange();
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || LOOKUP_PAGE_SIZE;
  const q = String(params.q || '').trim();
  const requestParams = {
    page,
    limit,
    startDate: params.startDate || dateRange.startDate,
    endDate: params.endDate || dateRange.endDate,
  };
  if (q) requestParams.q = q;

  const { data } = await api.get(`${APP_ADMIN_BASE}/sellgold`, { params: requestParams });
  const docs = (data.docs || data.data || []).map(d => mapTradeRow(d, 'sell'));
  return {
    docs,
    totalDocs: data.totalDocs != null ? data.totalDocs : docs.length,
    page,
    limit,
    hasNextPage: Boolean(data.hasNextPage),
  };
};

export const mapAuditRow = doc => {
  const record = doc || {};
  return {
    id: String(
      record._id || record.id || `${record.date}-${record.transactionType}-${record.value}`,
    ),
    transactionType: record.transactionType || '',
    date: record.date || record.createdAt,
    time: record.time || '',
    price: Number(record.price || 0),
    quantityGms: Number(record.quantityGms || 0),
    value: Number(record.value || 0),
    currency: record.currency || 'AED',
    inHandQty: record.inHandQty != null ? Number(record.inHandQty) : null,
    average: record.average != null ? Number(record.average) : null,
    currentFundBalance: record.currentFundBalance != null ? Number(record.currentFundBalance) : null,
    finalFundBalance: record.finalFundBalance != null ? Number(record.finalFundBalance) : null,
    currentGoldBalanceGms:
      record.currentGoldBalanceGms != null ? Number(record.currentGoldBalanceGms) : null,
    finalGoldBalanceGms:
      record.finalGoldBalanceGms != null ? Number(record.finalGoldBalanceGms) : null,
    _raw: record,
  };
};

export const fetchAuditsByUser = async (userId, params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const requestParams = { page, limit };
  if (params.startDate) requestParams.startDate = params.startDate;
  if (params.endDate) requestParams.endDate = params.endDate;

  const { data } = await api.get(`${APP_ADMIN_BASE}/audits/user/${userId}`, {
    params: requestParams,
  });
  const payload = data && data.data != null ? data.data : data;
  const list = Array.isArray(payload)
    ? payload
    : (payload && (payload.docs || payload.report || payload.result)) || [];
  const docs = (list || []).map(mapAuditRow);
  return {
    docs,
    totalDocs:
      (payload && payload.totalDocs != null && payload.totalDocs) ||
      (data && data.totalDocs != null && data.totalDocs) ||
      docs.length,
    page,
    hasNextPage: Boolean(payload && payload.hasNextPage),
  };
};

export const fetchAuditsPortfolio = async (userId, params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const { data } = await api.get(`${APP_ADMIN_BASE}/audits/portfolio`, {
    params: { userId, page, limit },
  });
  const payload = data && data.data != null ? data.data : data;
  const list = Array.isArray(payload)
    ? payload
    : (payload && (payload.docs || payload.report || payload.result)) || [];
  const docs = (list || []).map(mapAuditRow);
  return {
    docs,
    totalDocs:
      (payload && payload.totalDocs != null && payload.totalDocs) ||
      (data && data.totalDocs != null && data.totalDocs) ||
      docs.length,
    page,
    hasNextPage: Boolean(payload && payload.hasNextPage),
  };
};

export const getAuditTypeColor = type => {
  const t = String(type || '').toUpperCase();
  if (t.includes('DEPOSIT') || t.includes('FUND_DEPOSIT')) {
    return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399', border: 'rgba(52, 211, 153, 0.35)' };
  }
  if (t.includes('WITHDRAW') || t.includes('WITHDREW')) {
    return { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.35)' };
  }
  if (t.includes('BUY') || t.includes('TRADE_BUY')) {
    return { bg: 'rgba(212, 175, 55, 0.15)', text: '#E8C96A', border: 'rgba(212, 175, 55, 0.35)' };
  }
  if (t.includes('SELL') || t.includes('TRADE_SELL')) {
    return { bg: 'rgba(167, 139, 250, 0.15)', text: '#C4B5FD', border: 'rgba(167, 139, 250, 0.35)' };
  }
  return { bg: 'rgba(148, 163, 184, 0.15)', text: '#CBD5E1', border: 'rgba(148, 163, 184, 0.35)' };
};

export const formatMoney = (amount, digits = 2) =>
  Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatGold = amount =>
  Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

export const formatListDate = iso => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
