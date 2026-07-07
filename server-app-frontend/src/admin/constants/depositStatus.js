export const DEPOSIT_STATUS = {
  PENDING_MANAGER: 'pending_manager',
  PENDING_ADMIN: 'pending_admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SEND_BACK: 'send_back',
};

/** User-facing labels: Manager → Admin, Admin → Super Admin */
export const APPROVAL_STAGE_LABELS = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  PENDING_ADMIN: 'Pending Admin',
  PENDING_SUPER_ADMIN: 'Pending Super Admin',
  ADMIN_QUEUE: 'Admin queue',
  SUPER_ADMIN_QUEUE: 'Super Admin queue',
  ADMIN_APPROVAL: 'Admin Approval',
  SUPER_ADMIN_APPROVAL: 'Super Admin Approval',
  APPROVED_BY_ADMIN: 'Approved by Admin',
  APPROVED_BY_SUPER_ADMIN: 'Approved by Super Admin',
  ADMIN_APPROVED_VIA: 'Admin Approved Via',
  SUPER_ADMIN_APPROVED_VIA: 'Super Admin Approved Via',
};

/** Map legacy activity / API strings to new labels for display */
export const formatApprovalActivity = action => {
  const text = String(action ?? '').trim();
  const lower = text.toLowerCase();
  if (lower.includes('approved by manager')) return APPROVAL_STAGE_LABELS.APPROVED_BY_ADMIN;
  if (lower.includes('fund deposited')) return APPROVAL_STAGE_LABELS.APPROVED_BY_SUPER_ADMIN;
  if (lower === 'approved by admin') return APPROVAL_STAGE_LABELS.APPROVED_BY_ADMIN;
  if (lower === 'approved by super admin') return APPROVAL_STAGE_LABELS.APPROVED_BY_SUPER_ADMIN;
  return text;
};

export const STATUS_CONFIG = {
  [DEPOSIT_STATUS.PENDING_MANAGER]: {
    label: APPROVAL_STAGE_LABELS.PENDING_ADMIN,
    bg: 'rgba(234, 88, 12, 0.22)',
    border: 'rgba(251, 146, 60, 0.55)',
    text: '#FB923C',
  },
  [DEPOSIT_STATUS.PENDING_ADMIN]: {
    label: APPROVAL_STAGE_LABELS.PENDING_SUPER_ADMIN,
    bg: 'rgba(37, 99, 235, 0.22)',
    border: 'rgba(96, 165, 250, 0.55)',
    text: '#60A5FA',
  },
  [DEPOSIT_STATUS.APPROVED]: {
    label: 'Approved',
    bg: 'rgba(22, 163, 74, 0.22)',
    border: 'rgba(74, 222, 128, 0.55)',
    text: '#4ADE80',
  },
  [DEPOSIT_STATUS.REJECTED]: {
    label: 'Rejected',
    bg: 'rgba(220, 38, 38, 0.22)',
    border: 'rgba(248, 113, 113, 0.55)',
    text: '#F87171',
  },
  [DEPOSIT_STATUS.SEND_BACK]: {
    label: 'Send Back',
    bg: 'rgba(180, 83, 9, 0.22)',
    border: 'rgba(217, 119, 6, 0.55)',
    text: '#D97706',
  },
};

export const USER_ROLES = {
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const LIST_TABS = {
  ALL: 'all',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

/** Status filter options — matches web Status / Approve Status columns */
export const STATUS_FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVE: 'approve',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SEND_BACK: 'send_back',
};

export const STATUS_FILTER_OPTIONS = [
  { id: STATUS_FILTERS.ALL, label: 'All statuses', hint: 'Show every record in date range' },
  { id: STATUS_FILTERS.PENDING, label: 'Pending', hint: 'Status or approve status is pending' },
  { id: STATUS_FILTERS.APPROVE, label: 'Approve', hint: 'Awaiting Super Admin approval (approve status)' },
  { id: STATUS_FILTERS.APPROVED, label: 'Approved', hint: 'Fully approved deposits' },
  { id: STATUS_FILTERS.REJECTED, label: 'Rejected', hint: 'Rejected deposits' },
  { id: STATUS_FILTERS.SEND_BACK, label: 'Send Back', hint: 'Sent back for correction' },
];

/** Normalize DB values — web may save Approved/approve/pending mixed */
export const normStatus = value => String(value ?? '').trim().toLowerCase();

/** Matches web fundepositupdate view: admin final approval step */
export const isAdminFinalStage = deposit =>
  normStatus(deposit?.approveStatus) === 'pending' &&
  normStatus(deposit?.dbStatus) === 'approved';

export const isDepositActionDisabled = deposit => {
  if (!deposit) return true;
  const ws = deposit.status;
  if (ws === DEPOSIT_STATUS.APPROVED || ws === DEPOSIT_STATUS.REJECTED) return true;
  const dbStatus = normStatus(deposit.dbStatus);
  const approveStatus = normStatus(deposit.approveStatus);
  return (
    (dbStatus === 'approved' && approveStatus !== 'pending' && approveStatus !== 'approve') ||
    dbStatus === 'rejected' ||
    approveStatus === 'rejected' ||
    approveStatus === 'reject'
  );
};

/** Whether the logged-in role can act on this deposit (admin / super admin). */
export const canUserActOnDeposit = (deposit, { isManager, isAdmin, isSuperAdmin }) => {
  if (isDepositActionDisabled(deposit)) return false;
  const inManager = isPendingManagerQueue(deposit);
  const inAdmin = isPendingAdminQueue(deposit);
  // Admin & super admin see both approval tabs — can act on both queues (same as web admin)
  if (isSuperAdmin || isAdmin) {
    return inManager || inAdmin;
  }
  if (isManager) return inManager;
  return inManager || inAdmin;
};

export const isPendingManagerQueue = deposit => {
  if (!deposit || isDepositActionDisabled(deposit)) return false;
  if (isAdminFinalStage(deposit)) return false;

  const dbStatus = normStatus(deposit.dbStatus);
  const approveStatus = normStatus(deposit.approveStatus);

  if (approveStatus === 'approve' && dbStatus === 'pending') return false;

  if (deposit.status === DEPOSIT_STATUS.SEND_BACK) return true;

  return (
    dbStatus === 'pending' ||
    dbStatus === 'sendback' ||
    approveStatus === 'sendback' ||
    approveStatus === 'pending' ||
    approveStatus === ''
  );
};

export const isPendingAdminQueue = deposit => {
  if (!deposit || isDepositActionDisabled(deposit)) return false;

  const dbStatus = normStatus(deposit.dbStatus);
  const approveStatus = normStatus(deposit.approveStatus);

  return (
    isAdminFinalStage(deposit) ||
    (approveStatus === 'approve' && dbStatus === 'pending')
  );
};

/** Filter list by tab — "all" matches web admin full list */
export const matchesListTab = (deposit, tab) => {
  if (tab === LIST_TABS.ALL) return true;
  if (tab === LIST_TABS.MANAGER) return isPendingManagerQueue(deposit);
  if (tab === LIST_TABS.ADMIN) return isPendingAdminQueue(deposit);
  return true;
};

/** Filter by Status / Approve Status — same labels as web admin table */
export const matchesStatusFilter = (deposit, filter) => {
  if (!filter || filter === STATUS_FILTERS.ALL) return true;

  const dbStatus = normStatus(deposit?.dbStatus);
  const approveStatus = normStatus(deposit?.approveStatus);

  switch (filter) {
    case STATUS_FILTERS.PENDING:
      return dbStatus === 'pending' || approveStatus === 'pending';
    case STATUS_FILTERS.APPROVE:
      return approveStatus === 'approve';
    case STATUS_FILTERS.APPROVED:
      return dbStatus === 'approved' || approveStatus === 'approved';
    case STATUS_FILTERS.REJECTED:
      return (
        dbStatus === 'rejected' ||
        approveStatus === 'rejected' ||
        approveStatus === 'reject'
      );
    case STATUS_FILTERS.SEND_BACK:
      return dbStatus === 'sendback' || approveStatus === 'sendback';
    default:
      return true;
  }
};

export const getStatusFilterLabel = filterId => {
  const option = STATUS_FILTER_OPTIONS.find(o => o.id === filterId);
  return option?.label || 'All statuses';
};

/** Web table columns: Status + Approve Status */
export const getWebStatusLine = deposit => {
  const status = deposit?.dbStatus || '—';
  const approveStatus = deposit?.approveStatus || '—';
  return `Status: ${status} · Approve: ${approveStatus}`;
};
