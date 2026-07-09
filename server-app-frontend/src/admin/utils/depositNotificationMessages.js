export const getDepositNotificationErrorMessage = result => {
  const messages = {
    permission_denied:
      'Allow notifications when your phone asks, or turn them on in Settings, then tap the button again.',
    not_logged_in: 'Please sign in to the Admin side first.',
    no_fcm_token:
      'Push service is not ready. Close the app, reopen it, and try again.',
    api_error:
      result?.message ||
      'Could not register with the admin server. Check your connection and try again.',
    error: result?.message || 'Something went wrong. Please try again.',
  };

  return messages[result?.reason] || result?.message || messages.error;
};

export const DEPOSIT_NOTIFICATION_SUCCESS = {
  title: 'Deposit alerts are on',
  message:
    'You will receive a push notification when a user submits a new fund deposit. Tap the alert to review it.',
};

export const DEPOSIT_NOTIFICATION_PROMPT = {
  title: 'Turn on deposit alerts?',
  message:
    'Stay updated when users submit fund deposits. We will ask for notification permission on the next step.',
  enableText: 'Turn on alerts',
  laterText: 'Not now',
};
