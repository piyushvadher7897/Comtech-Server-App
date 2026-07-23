import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useAdmin} from '../context/AdminContext';
import {navigateToAdminScreen} from '../utils/navigation';
import {
  consumePendingDepositNavigation,
  consumePendingWithdrawNavigation,
  setAdminNotificationNavigationHandler,
} from '../utils/adminNotificationNavigation';

const AdminNotificationHandler = () => {
  const navigation = useNavigation();
  const {user} = useAdmin();

  useEffect(() => {
    if (!user) {
      setAdminNotificationNavigationHandler(null);
      return undefined;
    }

    const openFromNotification = payload => {
      if (!payload) return;
      if (typeof payload === 'string') {
        navigateToAdminScreen(navigation, 'DepositDetail', {depositId: payload});
        return;
      }
      if (payload.type === 'withdraw') {
        navigateToAdminScreen(navigation, 'WithdrawDetail', {
          withdrawId: payload.id,
        });
        return;
      }
      navigateToAdminScreen(navigation, 'DepositDetail', {depositId: payload.id});
    };

    setAdminNotificationNavigationHandler(openFromNotification);

    const pendingDepositId = consumePendingDepositNavigation();
    if (pendingDepositId) {
      openFromNotification({type: 'deposit', id: pendingDepositId});
    }
    const pendingWithdrawId = consumePendingWithdrawNavigation();
    if (pendingWithdrawId) {
      openFromNotification({type: 'withdraw', id: pendingWithdrawId});
    }

    return () => {
      setAdminNotificationNavigationHandler(null);
    };
  }, [navigation, user]);

  return null;
};

export default AdminNotificationHandler;
