let pendingDepositId = null;
let navigationHandler = null;

export const setAdminNotificationNavigationHandler = handler => {
  navigationHandler = typeof handler === 'function' ? handler : null;

  if (navigationHandler && pendingDepositId) {
    const depositId = pendingDepositId;
    pendingDepositId = null;
    navigationHandler({ type: 'deposit', id: depositId });
  }
  if (navigationHandler && pendingWithdrawId) {
    const withdrawId = pendingWithdrawId;
    pendingWithdrawId = null;
    navigationHandler({ type: 'withdraw', id: withdrawId });
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
    navigationHandler({ type: 'deposit', id: depositId });
  } else {
    pendingDepositId = depositId;
  }

  return true;
};

let pendingWithdrawId = null;

export const handleFundWithdrawNotification = remoteMessage => {
  const data = remoteMessage?.data || {};
  const type = String(data?.type || '').toLowerCase();

  if (type !== 'fund_withdraw_pending') {
    return false;
  }

  const withdrawId = String(data?.withdrawId || data?.depositId || '').trim();
  if (!withdrawId) {
    return false;
  }

  if (navigationHandler) {
    navigationHandler({ type: 'withdraw', id: withdrawId });
  } else {
    pendingWithdrawId = withdrawId;
  }

  return true;
};

export const consumePendingDepositNavigation = () => {
  const depositId = pendingDepositId;
  pendingDepositId = null;
  return depositId;
};

export const consumePendingWithdrawNavigation = () => {
  const withdrawId = pendingWithdrawId;
  pendingWithdrawId = null;
  return withdrawId;
};
