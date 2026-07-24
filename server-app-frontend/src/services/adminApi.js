import api from './apiClient';
import {
  USER_ROLES,
  normStatus,
  formatApprovalActivity,
  statusFilterToWorkflowQuery,
} from '../admin/constants/depositStatus';

const APP_ADMIN_BASE = '/api/appadmin';
export const DEPOSIT_LIST_PAGE_SIZE = 10;

/** Same default date range as web admin Common.jsx (last 3 months from 1st → today) */
export const getWebAdminDateRange = () => {
  const endDate = new Date().toISOString().split('T')[0];
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);
  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
};

export const formatWebAdminDateRangeLabel = ({ startDate, endDate } = getWebAdminDateRange()) => {
  const fmt = iso => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
};

export const isDefaultDepositDateRange = range => {
  const defaults = getWebAdminDateRange();
  return range?.startDate === defaults.startDate && range?.endDate === defaults.endDate;
};

export const mapWorkflowStatus = record => {
  if (!record) return 'pending_manager';
  if (record.workflowStatus) return record.workflowStatus;

  const status = normStatus(record.status);
  const approveStatus = normStatus(record.approveStatus);

  if (status === 'approved' && approveStatus !== 'pending') return 'approved';
  if (status === 'rejected' || approveStatus === 'rejected' || approveStatus === 'reject') {
    return 'rejected';
  }
  if (approveStatus === 'sendback' || status === 'sendback') return 'send_back';
  if (approveStatus === 'pending' && status === 'approved') return 'pending_admin';
  if (approveStatus === 'approve' && status === 'pending') return 'pending_admin';
  if (status === 'pending' && (approveStatus === 'pending' || approveStatus === '')) {
    return 'pending_manager';
  }
  if (status === 'approved') return 'approved';
  return 'pending_manager';
};

const isPopulatedUser = candidate => {
  if (!candidate || typeof candidate !== 'object') return false;
  return Boolean(
    candidate.firstName || candidate.lastName || candidate.email || candidate.name,
  );
};

const resolveDepositUser = (doc, user) => {
  const record = doc?._raw || doc;
  if (isPopulatedUser(user)) return user;
  if (isPopulatedUser(record?.user)) return record.user;
  if (isPopulatedUser(doc?.user)) return doc.user;
  if (isPopulatedUser(record?.userID)) return record.userID;
  return null;
};

const formatDepositUserName = (userRecord, doc, record) => {
  const existing = doc?.userName || record?.userName;
  if (existing && existing !== '—') return existing;
  if (!userRecord) return '—';
  return (
    `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() ||
    userRecord.name ||
    userRecord.email ||
    '—'
  );
};

/** Web admin: DB amount is AED; USD = amount / buyConversion (usdAmount from list aggregate). */
const resolveDepositAmounts = (doc, record) => {
  const currency = String(record?.currency || doc?.currency || 'AED').toUpperCase();
  const aedAmount = Number(record?.amount ?? doc?.amountAed ?? record?.amountAed ?? 0);
  const storedUsd =
    record?.usdAmount != null && record.usdAmount !== ''
      ? Number(record.usdAmount)
      : null;
  const mappedUsd =
    doc?.amountUsd != null && doc.amountUsd !== '' ? Number(doc.amountUsd) : null;
  const mappedAed =
    doc?.amountAed != null && doc.amountAed !== '' ? Number(doc.amountAed) : null;

  if (currency === 'USD') {
    const usd = storedUsd ?? mappedUsd ?? aedAmount;
    return {
      amountAed: mappedAed ?? aedAmount,
      amountUsd: usd,
    };
  }

  const amountAed = mappedAed ?? aedAmount;
  const amountUsd = storedUsd ?? mappedUsd ?? 0;
  return { amountAed, amountUsd };
};

export const isMissingDepositProfile = deposit =>
  !deposit?.userName || deposit.userName === '—';

/** Treat ~, blank, and whitespace as missing (user app placeholder values). */
export const isEmptyDepositText = value => {
  const trimmed = String(value ?? '').trim();
  return !trimmed || trimmed === '~';
};

const resolveDirectCommentsFromRecord = record => {
  if (!record) return '';
  const direct = String(record.comments ?? '').trim();
  return isEmptyDepositText(direct) ? '' : direct;
};

const resolveLatestActivityRemarksFromRecord = record => {
  if (!record) return '';
  const activities = record.activity || [];
  for (let i = activities.length - 1; i >= 0; i -= 1) {
    const remark = String(activities[i]?.remarks ?? '').trim();
    if (!isEmptyDepositText(remark)) return remark;
  }
  return '';
};

const resolveDepositCommentsFromRecord = record => {
  const direct = resolveDirectCommentsFromRecord(record);
  if (direct) return direct;
  return resolveLatestActivityRemarksFromRecord(record);
};

/** Short preview for list cards — long text becomes "vvvv...". */
export const truncateDepositListText = (text, maxLength = 50) => {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
};

const resolveDepositDescriptionFromRecord = record => {
  const description = String(record?.description ?? '').trim();
  return isEmptyDepositText(description) ? '' : description;
};

/** Latest admin remark — same field on web (`comments`) and mobile (`remarks`). */
export const getDepositRemarks = deposit => {
  if (!deposit) return '';
  const raw = deposit._raw || deposit;
  const comments = resolveDepositCommentsFromRecord(deposit) || resolveDepositCommentsFromRecord(raw);
  if (comments) return comments;
  const lastRemarks = String(deposit.lastRemarks ?? '').trim();
  if (!isEmptyDepositText(lastRemarks)) return lastRemarks;
  const description =
    resolveDepositDescriptionFromRecord(deposit) || resolveDepositDescriptionFromRecord(raw);
  return description;
};

/** List card lines — Comments, Remarks, Description (truncated when long). */
export const getDepositListNotes = deposit => {
  if (!deposit) return [];
  const raw = deposit._raw || deposit;
  const notes = [];

  const commentText =
    resolveDirectCommentsFromRecord(deposit) || resolveDirectCommentsFromRecord(raw);
  const remarkText =
    resolveLatestActivityRemarksFromRecord(deposit) ||
    resolveLatestActivityRemarksFromRecord(raw);
  const descriptionText =
    resolveDepositDescriptionFromRecord(deposit) || resolveDepositDescriptionFromRecord(raw);

  if (commentText) {
    notes.push({ label: 'Comments', text: truncateDepositListText(commentText) });
  }
  if (remarkText && remarkText !== commentText) {
    notes.push({ label: 'Remarks', text: truncateDepositListText(remarkText) });
  }
  if (
    descriptionText &&
    descriptionText !== commentText &&
    descriptionText !== remarkText
  ) {
    notes.push({ label: 'Description', text: truncateDepositListText(descriptionText) });
  }
  return notes;
};

export const mapBackendDeposit = (doc, user) => {
  const record = doc?._raw || doc;
  const u = resolveDepositUser(doc, user);
  const dbStatus = doc?.dbStatus || record.status || '';
  const approveStatus = doc?.approveStatus ?? record.approveStatus ?? 'pending';
  const workflowStatus = mapWorkflowStatus({ ...record, status: dbStatus, approveStatus });
  const activity = record.activity || [];

  const resolveActorName = actor => {
    if (!actor) return '';
    if (typeof actor === 'string') return actor;
    if (typeof actor === 'object') {
      return (
        actor.name ||
        `${actor.firstName || ''} ${actor.lastName || ''}`.trim() ||
        actor.email ||
        String(actor._id || actor.id || '')
      );
    }
    return '';
  };

  const resolveAdminApproval = source => {
    if (source?.adminApproval) return source.adminApproval;
    if (source?.managerApprovedBy) {
      return {
        by: source.managerApprovedBy,
        at: source.managerApprovedAt,
        via: source.managerApprovedVia,
      };
    }
    if (source?.adminApprovedBy && !source?.superAdminApprovedBy) {
      return {
        by: source.adminApprovedBy,
        at: source.adminApprovedAt,
        via: source.adminApprovedVia,
      };
    }
    if (source?.adminApprovedBy && source?.superAdminApprovedBy) {
      return {
        by: source.adminApprovedBy,
        at: source.adminApprovedAt,
        via: source.adminApprovedVia,
      };
    }
    return null;
  };

  const resolveSuperAdminApproval = source => {
    if (source?.superAdminApproval) return source.superAdminApproval;
    if (source?.superAdminApprovedBy) {
      return {
        by: source.superAdminApprovedBy,
        at: source.superAdminApprovedAt,
        via: source.superAdminApprovedVia,
      };
    }
    if (source?.managerApprovedBy && source?.adminApprovedBy) {
      return {
        by: source.adminApprovedBy,
        at: source.adminApprovedAt,
        via: source.adminApprovedVia,
      };
    }
    if (
      String(source?.status || '').toLowerCase() === 'approved' &&
      source?.adminApprovedBy &&
      !source?.managerApprovedBy
    ) {
      return {
        by: source.adminApprovedBy || source.approveBy,
        at: source.adminApprovedAt,
        via: source.adminApprovedVia,
      };
    }
    return null;
  };

  const adminApproval = resolveAdminApproval(doc?.adminApproval ? doc : record);
  const superAdminApproval = resolveSuperAdminApproval(doc?.superAdminApproval ? doc : record);
  const { amountAed, amountUsd } = resolveDepositAmounts(doc, record);

  const managerActivity = activity.find(a => {
    const action = String(a?.action || '').toLowerCase();
    return action.includes('manager') || action.includes('approved by admin');
  });
  const adminActivity = activity.find(a => {
    const action = String(a?.action || '').toLowerCase();
    return (
      action.includes('super admin') ||
      action.includes('fund deposited') ||
      (action.includes('admin') && !action.includes('approved by admin'))
    );
  });

  const adminApprovedByName =
    resolveActorName(adminApproval?.by) ||
    resolveActorName(managerActivity?.byName || managerActivity?.by) ||
    '';

  const superAdminApprovedByName =
    resolveActorName(superAdminApproval?.by) ||
    resolveActorName(adminActivity?.byName || adminActivity?.by) ||
    '';

  const formatApprovalChannel = channel => {
    if (!channel) return '';
    const normalized = String(channel).toLowerCase();
    if (normalized === 'app') return 'App';
    if (normalized === 'web') return 'Web';
    return channel;
  };

  return {
    id: String(record._id || record.id),
    userName: formatDepositUserName(u, doc, record),
    email: u?.email || doc?.email || record.email || '',
    referenceNumber: record.refNo ?? '',
    createdAt: record.createdAt || record.date,
    amountAed,
    amountUsd,
    currency: record.currency || 'AED',
    paymentMethod: record.paymentVia || record.paymentMethod || '',
    paymentId: String(record._id || record.id || ''),
    transactionNo: record.trNo || record.transactionNo || '',
    description: resolveDepositDescriptionFromRecord(record),
    comments: resolveDepositCommentsFromRecord(record),
    status: workflowStatus,
    dbStatus,
    approveStatus,
    adminApprovedByName,
    superAdminApprovedByName,
    managerApprovedByName: adminApprovedByName,
    adminApprovedVia: adminApproval?.via || null,
    superAdminApprovedVia: superAdminApproval?.via || null,
    adminApprovedViaLabel: formatApprovalChannel(adminApproval?.via),
    superAdminApprovedViaLabel: formatApprovalChannel(superAdminApproval?.via),
    managerApprovedViaLabel: formatApprovalChannel(adminApproval?.via),
    userID: record.userID,
    activity: activity.map(a => ({
      action: formatApprovalActivity(a.action),
      at: a.at,
      by: a.byName || a.by || 'Admin',
      remarks: a.remarks,
    })),
    lastRemarks: resolveDepositCommentsFromRecord(record),
    _raw: record,
  };
};

const sortDepositsLikeWeb = docs =>
  [...docs].sort((a, b) => {
    const priority = value => {
      const v = normStatus(value);
      if (v === 'pending') return 0;
      if (v === 'approve') return 1;
      if (v === 'approved') return 2;
      if (v === 'sendback') return 3;
      if (v === 'rejected' || v === 'reject') return 4;
      return 5;
    };
    const byApprove = priority(a.approveStatus) - priority(b.approveStatus);
    if (byApprove !== 0) return byApprove;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

export const buildApprovePayload = (deposit, selectedStatus, comments) => {
  const raw = deposit._raw || {};
  const base = {
    ...raw,
    _id: deposit.id,
    userID: deposit.userID || raw.userID,
    amount: raw.amount ?? deposit.amountAed,
    currency: deposit.currency || raw.currency,
    comments: comments || '',
    refNo: raw.refNo || deposit.referenceNumber,
    paymentVia: raw.paymentVia || deposit.paymentMethod,
  };

  if (selectedStatus === 'SendBack') {
    return { ...base, approveStatus: 'SendBack', status: 'SendBack', comments };
  }

  return {
    ...base,
    approveStatus: selectedStatus,
    status: selectedStatus,
    comments,
  };
};

/** Manager step — same as web POST /api/funddepositupdate/pending */
export const buildManagerActionPayload = (deposit, selectedStatus, comments) => {
  const raw = deposit._raw || {};
  const base = {
    ...raw,
    _id: deposit.id,
    userID: deposit.userID || raw.userID,
    amount: raw.amount ?? deposit.amountAed,
    currency: deposit.currency || raw.currency,
    comments: comments || '',
    refNo: raw.refNo || deposit.referenceNumber,
    paymentVia: raw.paymentVia || deposit.paymentMethod,
  };

  if (selectedStatus === 'SendBack') {
    return { ...base, approveStatus: 'SendBack', status: 'SendBack', comments };
  }
  if (selectedStatus === 'Rejected') {
    return { ...base, approveStatus: 'Rejected', status: 'Rejected', comments };
  }
  return { ...base, status: 'Approved', approveStatus: 'pending', comments };
};

export const resolveApprovalRole = payload => {
  const roleName = (payload?.role?.name || payload?.name || '').toLowerCase();
  if (roleName.includes('superadmin') || roleName.includes('superuser') || roleName.includes('super admin')) {
    return USER_ROLES.ADMIN;
  }
  if (roleName.includes('manager')) return USER_ROLES.MANAGER;
  if (roleName.includes('admin')) return USER_ROLES.ADMIN;
  const perms = payload?.permission || [];
  const hasAdminPerm = perms.some(
    p => (p.name || '').toLowerCase().includes('deposit') && p.isEdit,
  );
  return hasAdminPerm ? USER_ROLES.ADMIN : USER_ROLES.MANAGER;
};

const isSuperAdminRoleName = roleName => {
  const upper = String(roleName || '').trim().toUpperCase();
  return upper === 'SUPERADMIN' || upper === 'SUPERUSER' || upper.includes('SUPER ADMIN');
};

export { isSuperAdminRoleName };

export const adminLogin = async (email, password) => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/login`, { email, password });
  return data;
};

export const adminVerifyOtp = async (_id, otp, deviceID) => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/verify-otp`, {
    _id,
    otp,
    deviceID,
  });
  return data;
};

export const adminResendOtp = async _id => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/resend-otp`, { _id });
  return data;
};

export const adminForgotPassword = async email => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/forgot-password`, { email });
  return data;
};

export const adminForgotPasswordVerify = async (email, otp, password) => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/forgot-password-verify`, {
    email,
    otp,
    password,
  });
  return data;
};

export const adminGetMe = async () => {
  const { data } = await api.get(`${APP_ADMIN_BASE}/auth/me`);
  return data;
};

export const adminRefreshToken = async deviceID => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/auth/refresh-token`, { deviceID });
  return data;
};

export const fetchDepositsPage = async (params = {}) => {
  const dateRange = getWebAdminDateRange();
  const { statusFilter, workflowStatus: workflowFromParams, ...rest } = params;
  const workflowStatus =
    workflowFromParams || statusFilterToWorkflowQuery(statusFilter);
  const baseParams = { ...dateRange, ...rest };
  const limit = Number(baseParams.limit) || DEPOSIT_LIST_PAGE_SIZE;
  const page = Number(baseParams.page) || 1;

  const requestParams = { ...baseParams, page, limit };
  if (workflowStatus) {
    requestParams.workflowStatus = workflowStatus;
  }

  const { data } = await api.get(`${APP_ADMIN_BASE}/funddeposit`, {
    params: requestParams,
  });
  const docs = (data.docs || data.data || []).map(d => mapBackendDeposit(d, d.user));

  return {
    docs: sortDepositsLikeWeb(docs),
    totalDocs: data.totalDocs ?? docs.length,
    page,
    limit,
    hasNextPage: Boolean(data.hasNextPage),
    startDate: baseParams.startDate,
    endDate: baseParams.endDate,
  };
};

/** First page only — use loadMoreDeposits in context for additional pages */
export const fetchDeposits = async (params = {}) =>
  fetchDepositsPage({ ...params, page: 1, limit: DEPOSIT_LIST_PAGE_SIZE });

/** Approval queue — all pending items (no date filter) */
export const fetchApprovalQueue = async (workflowStatus, params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const { data } = await api.get(`${APP_ADMIN_BASE}/funddeposit`, {
    params: { workflowStatus, page, limit },
  });
  const docs = (data.docs || data.data || []).map(d => mapBackendDeposit(d, d.user));
  return {
    docs: sortDepositsLikeWeb(docs),
    totalDocs: data.totalDocs ?? docs.length,
    hasNextPage: Boolean(data.hasNextPage),
  };
};

export const fetchDepositStats = async () => {
  const { data } = await api.get(`${APP_ADMIN_BASE}/funddeposit/stats`);
  return data;
};

export const fetchDepositDetail = async id => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/funddeposit/view`, { id });
  const payload = data.data || data;
  const user = payload?.userID || payload?._raw?.user || payload?.user;
  return mapBackendDeposit(payload, user);
};

/** Map Take Action UI labels to workflow API actions (same logic as fundDepositWorkflowService) */
export const mapUiActionToWorkflow = selectedStatus => {
  if (selectedStatus === 'Approved') return 'approve';
  if (selectedStatus === 'Rejected') return 'reject';
  if (selectedStatus === 'SendBack') return 'send_back';
  return 'approve';
};

/**
 * Unified workflow action — mirrors web admin process via
 * POST /api/appadmin/funddeposit/action (same rules as fundDepositWorkflowService).
 */
export const submitWorkflowAction = async (deposit, selectedStatus, remarks) => {
  const id = deposit && (deposit.id || (deposit._raw && (deposit._raw._id || deposit._raw.id)));
  const { data } = await api.post(`${APP_ADMIN_BASE}/funddeposit/action`, {
    _id: id,
    action: mapUiActionToWorkflow(selectedStatus),
    remarks: remarks || '',
  });
  const record = (data && data.data) || data;
  return {
    record,
    workflowStatus: data && data.workflowStatus,
  };
};

/** Legacy web admin: POST /api/funddepositupdate/approve */
export const submitDepositApprove = async (deposit, selectedStatus, comments) => {
  const payload = buildApprovePayload(deposit, selectedStatus, comments);
  const { data } = await api.post(`${APP_ADMIN_BASE}/funddeposit/approve`, payload);
  return data?.data || data;
};

/** Legacy manager step: POST /api/funddepositupdate/pending */
export const submitDepositPending = async (
  deposit,
  selectedStatus,
  comments,
  { refNo, paymentId } = {},
) => {
  const payload = buildManagerActionPayload(deposit, selectedStatus, comments);
  if (refNo != null) payload.refNo = refNo;
  if (paymentId != null) payload.paymentID = paymentId;
  const { data } = await api.post(`${APP_ADMIN_BASE}/funddeposit/pending`, payload);
  return data?.data || data;
};

/** Treat ~, blank, and whitespace as missing (user app placeholder values). */
export const isEmptyDepositReference = value => {
  const trimmed = String(value ?? '').trim();
  return !trimmed || trimmed === '~';
};

/** Web admin shows document _id as Payment ID. */
export const getDisplayPaymentId = deposit =>
  String(deposit?.id || deposit?._raw?._id || deposit?._raw?.id || '');

/** Reference number for display — refNo only, same as web admin table. */
export const getDisplayReferenceNumber = deposit => {
  const ref = deposit?._raw?.refNo ?? deposit?.referenceNumber ?? '';
  if (isEmptyDepositReference(ref)) return '—';
  return String(ref).trim();
};

export const getEditableReferenceNumber = deposit => {
  const ref = deposit?._raw?.refNo ?? deposit?.referenceNumber ?? '';
  return isEmptyDepositReference(ref) ? '' : String(ref).trim();
};

// --- Fund Withdraw (mirrors deposit appadmin APIs) ---

export const WITHDRAW_LIST_PAGE_SIZE = 10;

export const mapWithdrawWorkflowStatus = record => {
  if (!record) return 'pending_manager';
  if (record.workflowStatus) return record.workflowStatus;

  const status = normStatus(record.status);
  const approveStatus = normStatus(record.approveStatus);

  if (status === 'withdraw cancel' || approveStatus === 'reject' || approveStatus === 'rejected') {
    return 'rejected';
  }
  if (approveStatus === 'sendback') return 'send_back';
  if (
    status === 'withdraw sent' &&
    (approveStatus === 'approve' ||
      approveStatus === 'approved' ||
      approveStatus === 'withdraw sent')
  ) {
    return 'approved';
  }
  if (status === 'withdraw sent' && (approveStatus === 'pending' || approveStatus === '')) {
    return 'pending_admin';
  }
  if (status === 'withdraw initiated') return 'pending_manager';
  return 'pending_manager';
};

export const mapBackendWithdraw = (doc, user) => {
  const record = doc?._raw || doc;
  const u = resolveDepositUser(doc, user);
  const dbStatus = doc?.dbStatus || record.status || '';
  const approveStatus = doc?.approveStatus ?? record.approveStatus ?? 'pending';
  const workflowStatus = mapWithdrawWorkflowStatus({
    ...record,
    status: dbStatus,
    approveStatus,
  });
  const { amountAed, amountUsd } = resolveDepositAmounts(doc, record);

  return {
    id: String(record._id || record.id),
    userName: formatDepositUserName(u, doc, record),
    email: u?.email || doc?.email || record.email || '',
    referenceNumber: record.refNo ?? '',
    createdAt: record.createdAt || record.date,
    amountAed,
    amountUsd,
    currency: record.currency || 'AED',
    paymentMethod: record.paymentVia || record.paymentMethod || '',
    paymentId: String(record._id || record.id || ''),
    description: resolveDepositDescriptionFromRecord(record),
    comments: record.remark || record.comments || '',
    status: workflowStatus,
    dbStatus,
    approveStatus,
    userID: record.userID,
    bankId: record.bankId || null,
    bank: record.bank || doc?.bank || null,
    lastRemarks: record.remark || record.comments || '',
    _raw: record,
  };
};

const sortWithdrawsLikeWeb = docs =>
  [...docs].sort((a, b) => {
    const priority = value => {
      const v = normStatus(value);
      if (v === 'pending' || v === 'withdraw initiated') return 0;
      if (v === 'approve') return 1;
      if (v === 'withdraw sent' || v === 'approved') return 2;
      if (v === 'sendback') return 3;
      if (v === 'rejected' || v === 'reject' || v === 'withdraw cancel') return 4;
      return 5;
    };
    const byApprove = priority(a.approveStatus) - priority(b.approveStatus);
    if (byApprove !== 0) return byApprove;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

export const fetchWithdrawsPage = async (params = {}) => {
  const dateRange = getWebAdminDateRange();
  const { statusFilter, workflowStatus: workflowFromParams, ...rest } = params;
  const workflowStatus = workflowFromParams || statusFilterToWorkflowQuery(statusFilter);
  const baseParams = { ...dateRange, ...rest };
  const limit = Number(baseParams.limit) || WITHDRAW_LIST_PAGE_SIZE;
  const page = Number(baseParams.page) || 1;

  const requestParams = { ...baseParams, page, limit };
  if (workflowStatus) {
    requestParams.workflowStatus = workflowStatus;
  }

  const { data } = await api.get(`${APP_ADMIN_BASE}/fundwithdraw`, {
    params: requestParams,
  });
  const docs = (data.docs || data.data || []).map(d => mapBackendWithdraw(d, d.user));

  return {
    docs: sortWithdrawsLikeWeb(docs),
    totalDocs: data.totalDocs ?? docs.length,
    page,
    limit,
    hasNextPage: Boolean(data.hasNextPage),
    startDate: baseParams.startDate,
    endDate: baseParams.endDate,
  };
};

export const fetchWithdraws = async (params = {}) =>
  fetchWithdrawsPage({ ...params, page: 1, limit: WITHDRAW_LIST_PAGE_SIZE });

export const fetchWithdrawApprovalQueue = async (workflowStatus, params = {}) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const { data } = await api.get(`${APP_ADMIN_BASE}/fundwithdraw`, {
    params: { workflowStatus, page, limit },
  });
  const docs = (data.docs || data.data || []).map(d => mapBackendWithdraw(d, d.user));
  return {
    docs: sortWithdrawsLikeWeb(docs),
    totalDocs: data.totalDocs ?? docs.length,
    hasNextPage: Boolean(data.hasNextPage),
  };
};

export const fetchWithdrawStats = async () => {
  const { data } = await api.get(`${APP_ADMIN_BASE}/fundwithdraw/stats`);
  return data;
};

export const fetchWithdrawDetail = async id => {
  const { data } = await api.post(`${APP_ADMIN_BASE}/fundwithdraw/view`, { id });
  const payload = data.data || data;
  const user = payload?.userID || payload?._raw?.user || payload?.user;
  return mapBackendWithdraw(payload, user);
};

export const submitWithdrawWorkflowAction = async (withdraw, selectedStatus, remarks, meta = {}) => {
  const id =
    withdraw && (withdraw.id || (withdraw._raw && (withdraw._raw._id || withdraw._raw.id)));
  const { data } = await api.post(`${APP_ADMIN_BASE}/fundwithdraw/action`, {
    _id: id,
    action: mapUiActionToWorkflow(selectedStatus),
    remarks: remarks || '',
    refNo: meta.refNo,
    paymentVia: meta.paymentVia,
  });
  const record = (data && data.data) || data;
  return {
    record,
    workflowStatus: data && data.workflowStatus,
  };
};

export const buildWithdrawManagerPayload = (withdraw, selectedStatus, comments) => {
  const raw = withdraw._raw || {};
  const base = {
    ...raw,
    _id: withdraw.id,
    userID: withdraw.userID || raw.userID,
    amount: raw.amount ?? withdraw.amountAed,
    currency: withdraw.currency || raw.currency,
    comments: comments || '',
    remark: comments || '',
    refNo: raw.refNo || withdraw.referenceNumber,
    paymentVia: raw.paymentVia || withdraw.paymentMethod,
    user: raw.user,
  };

  if (selectedStatus === 'Rejected' || selectedStatus === 'Withdraw Cancel') {
    return { ...base, status: 'Withdraw Cancel', approveStatus: 'reject', remark: comments };
  }
  return { ...base, status: 'Withdraw Sent', approveStatus: 'pending', comments };
};

export const submitWithdrawPending = async (withdraw, selectedStatus, comments, meta = {}) => {
  const payload = buildWithdrawManagerPayload(withdraw, selectedStatus, comments);
  if (meta.refNo != null) payload.refNo = meta.refNo;
  if (meta.paymentVia != null) payload.paymentVia = meta.paymentVia;
  const { data } = await api.post(`${APP_ADMIN_BASE}/fundwithdraw/pending`, payload);
  return data?.data || data;
};

export const getWithdrawListNotes = withdraw => {
  if (!withdraw) return [];
  const notes = [];
  const remark = String(withdraw.comments || withdraw.lastRemarks || '').trim();
  const description = String(withdraw.description || '').trim();
  if (remark && !isEmptyDepositText(remark)) {
    notes.push({ label: 'Remarks', text: truncateDepositListText(remark) });
  }
  if (
    description &&
    !isEmptyDepositText(description) &&
    description !== remark
  ) {
    notes.push({ label: 'Description', text: truncateDepositListText(description) });
  }
  return notes;
};

export const isMissingWithdrawProfile = withdraw =>
  !withdraw?.userName || withdraw.userName === '—';
