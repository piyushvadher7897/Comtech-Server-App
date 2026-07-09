import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {useAdmin} from '../context/AdminContext';
import {
  DEPOSIT_NOTIFICATION_SUCCESS,
  getDepositNotificationErrorMessage,
} from '../utils/depositNotificationMessages';

/**
 * Shows a one-time alert after OTP login about deposit notification status.
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
      'Deposit alerts are off',
      `${getDepositNotificationErrorMessage(result)}\n\nYou can turn them on anytime from Home or Profile.`,
      [{text: 'OK'}],
    );
  }, [
    postLoginNotificationResult,
    clearPostLoginNotificationResult,
  ]);

  return null;
};

export default AdminPostLoginNotificationPrompt;
