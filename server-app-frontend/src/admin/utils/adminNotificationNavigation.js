let pendingDepositId = null;
let navigationHandler = null;

export const setAdminNotificationNavigationHandler = handler => {
  navigationHandler = typeof handler === 'function' ? handler : null;

  if (navigationHandler && pendingDepositId) {
    const depositId = pendingDepositId;
    pendingDepositId = null;
    navigationHandler(depositId);
  }
};

export const handleFundDepositNotification = remoteMessage => {
  const data = remoteMessage?.data || {};
  const type = String(data?.type || '').toLowerCase();

  if (type !== 'fund_deposit_pending') {
    return false;
  }

  const depositId = String(data?.depositId || '').trim();
  if (!depositId) {
    return false;
  }

  if (navigationHandler) {
    navigationHandler(depositId);
  } else {
    pendingDepositId = depositId;
  }

  return true;
};

export const consumePendingDepositNavigation = () => {
  const depositId = pendingDepositId;
  pendingDepositId = null;
  return depositId;
};
