export const getDepositNotificationErrorMessage = result => {
  const messages = {
    permission_denied:
      'Allow notifications when your phone asks, or turn them on in Settings, then try again.',
    not_logged_in: 'Please sign in to Admin first.',
    no_fcm_token:
      'Push service is not ready. Close the app, reopen it, and try again.',
    api_error:
      result?.message ||
      'Could not register alerts with the server. Check your connection and try again.',
    error: result?.message || 'Something went wrong. Please try again.',
  };

  return messages[result?.reason] || result?.message || messages.error;
};

export const DEPOSIT_NOTIFICATION_SUCCESS = {
  title: 'Alerts are on',
  message:
    "You'll get a push when a user submits a new fund deposit or withdraw. Tap the alert to review and approve it.",
};

export const DEPOSIT_NOTIFICATION_OFF = {
  title: 'Alerts are off',
  messageSuffix: 'You can turn them on anytime from Home or Profile.',
};

export const DEPOSIT_NOTIFICATION_PROMPT = {
  title: 'Turn on approval alerts?',
  message:
    "Get notified for new fund deposits and withdraws so you can review them quickly. We'll ask for notification permission next.",
  enableText: 'Turn on alerts',
  laterText: 'Not now',
};
