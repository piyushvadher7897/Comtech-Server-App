import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useAdmin} from '../context/AdminContext';
import {navigateToAdminScreen} from '../utils/navigation';
import {
  consumePendingDepositNavigation,
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

    const openDeposit = depositId => {
      if (!depositId) return;
      navigateToAdminScreen(navigation, 'DepositDetail', {depositId});
    };

    setAdminNotificationNavigationHandler(openDeposit);

    const pendingDepositId = consumePendingDepositNavigation();
    if (pendingDepositId) {
      openDeposit(pendingDepositId);
    }

    return () => {
      setAdminNotificationNavigationHandler(null);
    };
  }, [navigation, user]);

  return null;
};

export default AdminNotificationHandler;
