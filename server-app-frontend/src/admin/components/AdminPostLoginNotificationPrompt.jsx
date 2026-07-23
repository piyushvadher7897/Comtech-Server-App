import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {useAdmin} from '../context/AdminContext';
import {
  DEPOSIT_NOTIFICATION_SUCCESS,
  DEPOSIT_NOTIFICATION_OFF,
  getDepositNotificationErrorMessage,
} from '../utils/depositNotificationMessages';

/**
 * Shows a one-time alert after OTP login about approval notification status.
 */
const AdminPostLoginNotificationPrompt = () => {
  const {postLoginNotificationResult, clearPostLoginNotificationResult} = useAdmin();

  useEffect(() => {
    if (!postLoginNotificationResult) {
      return;
    }

    const result = postLoginNotificationResult;
    clearPostLoginNotificationResult();

    if (result.success) {
      Alert.alert(
        DEPOSIT_NOTIFICATION_SUCCESS.title,
        DEPOSIT_NOTIFICATION_SUCCESS.message,
        [{text: 'Got it'}],
      );
      return;
    }

    Alert.alert(
      DEPOSIT_NOTIFICATION_OFF.title,
      `${getDepositNotificationErrorMessage(result)}\n\n${DEPOSIT_NOTIFICATION_OFF.messageSuffix}`,
      [{text: 'OK'}],
    );
  }, [
    postLoginNotificationResult,
    clearPostLoginNotificationResult,
  ]);

  return null;
};

export default AdminPostLoginNotificationPrompt;
