import React, {useEffect, useRef} from 'react';
import {AlertMessage} from '../../utils/AlertMessage';
import {setupAdminNotificationHandlers} from '../../services/adminFirebaseMessaging';

/**
 * Admin Side — shows alert + navigates when fund deposit push arrives.
 * Mounted only after admin is logged in.
 */
const AdminDepositNotificationListener = () => {
  const lastMessageIdRef = useRef(null);

  useEffect(() => {
    const cleanup = setupAdminNotificationHandlers(remoteMessage => {
      if (remoteMessage.messageId === lastMessageIdRef.current) {
        return;
      }
      lastMessageIdRef.current = remoteMessage.messageId;

      const notify = remoteMessage.notification;
      if (!notify?.title) {
        return;
      }

      AlertMessage({
        title: notify.title,
        message: notify.body,
        okText: 'View',
        cancelText: 'Dismiss',
        okButton: () => {},
      });
    }, lastMessageIdRef);

    return cleanup;
  }, []);

  return null;
};

export default AdminDepositNotificationListener;
