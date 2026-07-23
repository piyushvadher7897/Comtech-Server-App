/** Workflow keys match deposit app tabs; DB statuses differ for withdraw. */
export const WITHDRAW_STATUS = {
  PENDING_MANAGER: 'pending_manager',
  PENDING_ADMIN: 'pending_admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SEND_BACK: 'send_back',
};

export {
  APPROVAL_STAGE_LABELS,
  USER_ROLES,
  LIST_TABS,
  STATUS_FILTERS,
  STATUS_FILTER_OPTIONS,
  STATUS_CONFIG,
  formatApprovalActivity,
  getStatusFilterLabel,
  statusFilterToWorkflowQuery,
} from './depositStatus';

import {
  APPROVAL_STAGE_LABELS,
  LIST_TABS,
  STATUS_CONFIG,
  STATUS_FILTERS,
  normStatus,
} from './depositStatus';

export { normStatus };

export const isWithdrawActionDisabled = withdraw => {
  if (!withdraw) return true;
  const ws = withdraw.status;
  if (ws === WITHDRAW_STATUS.APPROVED || ws === WITHDRAW_STATUS.REJECTED) return true;
  const dbStatus = normStatus(withdraw.dbStatus);
  const approveStatus = normStatus(withdraw.approveStatus);
  return (
    (dbStatus === 'withdraw sent' &&
      (approveStatus === 'approve' ||
        approveStatus === 'approved' ||
        approveStatus === 'withdraw sent')) ||
    dbStatus === 'withdraw cancel' ||
    approveStatus === 'reject' ||
    approveStatus === 'rejected'
  );
};

export const isPendingManagerQueue = withdraw => {
  if (!withdraw || isWithdrawActionDisabled(withdraw)) return false;
  if (withdraw.status === WITHDRAW_STATUS.SEND_BACK) return true;
  const dbStatus = normStatus(withdraw.dbStatus);
  return dbStatus === 'withdraw initiated' || withdraw.status === WITHDRAW_STATUS.PENDING_MANAGER;
};

export const isPendingAdminQueue = withdraw => {
  if (!withdraw || isWithdrawActionDisabled(withdraw)) return false;
  const dbStatus = normStatus(withdraw.dbStatus);
  const approveStatus = normStatus(withdraw.approveStatus);
  return (
    withdraw.status === WITHDRAW_STATUS.PENDING_ADMIN ||
    (dbStatus === 'withdraw sent' && (approveStatus === 'pending' || approveStatus === ''))
  );
};

export const canUserActOnWithdraw = (withdraw, { isManager, isAdmin, isSuperAdmin }) => {
  if (isWithdrawActionDisabled(withdraw)) return false;
  const inManager = isPendingManagerQueue(withdraw);
  const inAdmin = isPendingAdminQueue(withdraw);
  if (isSuperAdmin || isAdmin) {
    return inManager || inAdmin;
  }
  if (isManager) return inManager;
  return inManager || inAdmin;
};

export const matchesListTab = (withdraw, tab) => {
  if (tab === LIST_TABS.ALL) return true;
  if (tab === LIST_TABS.MANAGER) return isPendingManagerQueue(withdraw);
  if (tab === LIST_TABS.ADMIN) return isPendingAdminQueue(withdraw);
  return true;
};

export const isFullyApprovedWithdraw = withdraw => {
  if (!withdraw) return false;
  if (withdraw.status === WITHDRAW_STATUS.APPROVED) return true;
  const dbStatus = normStatus(withdraw.dbStatus);
  const approveStatus = normStatus(withdraw.approveStatus);
  return (
    dbStatus === 'withdraw sent' &&
    (approveStatus === 'approve' ||
      approveStatus === 'approved' ||
      approveStatus === 'withdraw sent')
  );
};

export const matchesStatusFilter = (withdraw, filter) => {
  if (!filter || filter === STATUS_FILTERS.ALL) return true;

  const dbStatus = normStatus(withdraw && withdraw.dbStatus);
  const approveStatus = normStatus(withdraw && withdraw.approveStatus);

  switch (filter) {
    case STATUS_FILTERS.PENDING:
      return isPendingManagerQueue(withdraw) || dbStatus === 'withdraw initiated';
    case STATUS_FILTERS.APPROVE:
      return isPendingAdminQueue(withdraw);
    case STATUS_FILTERS.APPROVED:
      return isFullyApprovedWithdraw(withdraw);
    case STATUS_FILTERS.REJECTED:
      return (
        withdraw.status === WITHDRAW_STATUS.REJECTED ||
        dbStatus === 'withdraw cancel' ||
        approveStatus === 'rejected' ||
        approveStatus === 'reject'
      );
    case STATUS_FILTERS.SEND_BACK:
      return withdraw.status === WITHDRAW_STATUS.SEND_BACK;
    default:
      return true;
  }
};

export const getWithdrawStatusSummary = withdraw => {
  if (!withdraw) return '—';

  if (isFullyApprovedWithdraw(withdraw) || withdraw.status === WITHDRAW_STATUS.APPROVED) {
    return `${APPROVAL_STAGE_LABELS.APPROVED_BY_SUPER_ADMIN} — withdraw completed`;
  }

  const dbStatus = normStatus(withdraw.dbStatus);
  const approveStatus = normStatus(withdraw.approveStatus);

  if (
    withdraw.status === WITHDRAW_STATUS.REJECTED ||
    dbStatus === 'withdraw cancel' ||
    approveStatus === 'rejected' ||
    approveStatus === 'reject'
  ) {
    return 'Rejected / Cancelled';
  }

  if (withdraw.status === WITHDRAW_STATUS.SEND_BACK) {
    return 'Sent back — needs correction';
  }

  if (isPendingAdminQueue(withdraw)) {
    return `${APPROVAL_STAGE_LABELS.APPROVED_BY_ADMIN} — awaiting ${APPROVAL_STAGE_LABELS.SUPER_ADMIN} approval`;
  }

  if (isPendingManagerQueue(withdraw)) {
    return `Awaiting ${APPROVAL_STAGE_LABELS.ADMIN} approval`;
  }

  const config = STATUS_CONFIG[withdraw.status];
  return (config && config.label) || 'In review';
};
