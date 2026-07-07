import api from './apiClient';
import { USER_ROLES, normStatus, formatApprovalActivity } from '../admin/constants/depositStatus';

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

export const mapBackendDeposit = (doc, user) => {
  const record = doc?._raw || doc;
  const u = user || record.user || record.userID;
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
    userName: u
      ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '—'
      : record.userName || '—',
    email: u?.email || record.email || '',
    referenceNumber: record.refNo ?? '',
    createdAt: record.createdAt || record.date,
    amountAed: Number(record.amount || record.amountAed || 0),
    amountUsd: Number(record.usdAmount || record.amountUsd || record.amount || 0),
    currency: record.currency || 'AED',
    paymentMethod: record.paymentVia || record.paymentMethod || '',
    paymentId: String(record._id || record.id || ''),
    transactionNo: record.trNo || record.transactionNo || '',
    description: record.description || '',
    comments: record.comments || '',
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
    lastRemarks: record.comments || '',
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
  if (roleName.includes('superadmin')) return USER_ROLES.ADMIN;
  if (roleName.includes('manager')) return USER_ROLES.MANAGER;
  if (roleName.includes('admin')) return USER_ROLES.ADMIN;
  const perms = payload?.permission || [];
  const hasAdminPerm = perms.some(
    p => (p.name || '').toLowerCase().includes('deposit') && p.isEdit,
  );
  return hasAdminPerm ? USER_ROLES.ADMIN : USER_ROLES.MANAGER;
};

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
  const baseParams = { ...dateRange, ...params };
  const limit = Number(baseParams.limit) || DEPOSIT_LIST_PAGE_SIZE;
  const page = Number(baseParams.page) || 1;

  const { data } = await api.get(`${APP_ADMIN_BASE}/funddeposit`, {
    params: { ...baseParams, page, limit },
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
  return mapBackendDeposit(data.data || data, data.data?.userID);
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
  const { data } = await api.post(`${APP_ADMIN_BASE}/funddeposit/action`, {
    _id: deposit.id,
    action: mapUiActionToWorkflow(selectedStatus),
    remarks: remarks || '',
  });
  const record = data?.data || data;
  return {
    record,
    workflowStatus: data?.workflowStatus,
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
