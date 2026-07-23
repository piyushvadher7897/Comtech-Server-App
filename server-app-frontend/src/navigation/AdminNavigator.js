import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminProvider, useAdmin } from '../admin/context/AdminContext';
import AdminLoginScreen from '../admin/screens/AdminLoginScreen';
import AdminOtpScreen from '../admin/screens/AdminOtpScreen';
import AdminDashboardScreen from '../admin/screens/AdminDashboardScreen';
import FundDepositListScreen from '../admin/screens/FundDepositListScreen';
import FundWithdrawListScreen from '../admin/screens/FundWithdrawListScreen';
import AdminApprovalsScreen from '../admin/screens/AdminApprovalsScreen';
import AdminProfileScreen from '../admin/screens/AdminProfileScreen';
import DepositDetailScreen from '../admin/screens/DepositDetailScreen';
import WithdrawDetailScreen from '../admin/screens/WithdrawDetailScreen';
import TakeActionScreen from '../admin/screens/TakeActionScreen';
import TakeWithdrawActionScreen from '../admin/screens/TakeWithdrawActionScreen';
import ApprovalSuccessScreen from '../admin/screens/ApprovalSuccessScreen';
import AdminForgotPasswordScreen from '../admin/screens/AdminForgotPasswordScreen';
import AdminForgotOtpScreen from '../admin/screens/AdminForgotOtpScreen';
import AdminResetPasswordScreen from '../admin/screens/AdminResetPasswordScreen';
import AdminTabBar from '../admin/components/AdminTabBar';
import AdminNotificationHandler from '../admin/components/AdminNotificationHandler';
import AdminDepositNotificationListener from '../admin/components/AdminDepositNotificationListener';
import AdminPostLoginNotificationPrompt from '../admin/components/AdminPostLoginNotificationPrompt';
import AdminDepositsScreen from '../admin/screens/AdminDepositsScreen';
import AdminSideDrawer from '../admin/components/AdminSideDrawer';
import { AdminDrawerProvider } from '../admin/context/AdminDrawerContext';
import UserListScreen from '../admin/screens/UserListScreen';
import { BuyGoldListScreen, SellGoldListScreen } from '../admin/screens/TradeListScreen';
import AuditListScreen from '../admin/screens/AuditListScreen';

const AdminStack = createNativeStackNavigator();
const AdminTabs = createBottomTabNavigator();

const AdminTabNavigator = () => (
  <>
    <AdminNotificationHandler />
    <AdminPostLoginNotificationPrompt />
    <AdminTabs.Navigator
      tabBar={props => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <AdminTabs.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <AdminTabs.Screen
        name="AdminDeposits"
        component={AdminDepositsScreen}
        options={{ tabBarLabel: 'Funds' }}
      />
      <AdminTabs.Screen
        name="AdminApprovals"
        component={AdminApprovalsScreen}
        options={{ tabBarLabel: 'Approve' }}
      />
      <AdminTabs.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </AdminTabs.Navigator>
  </>
);

const AdminFlow = () => {
  const { user, pendingLogin, clearPendingLogin, restoreSession } = useAdmin();
  const [authStage, setAuthStage] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (!user) {
    if (pendingLogin) {
      return (
        <AdminOtpScreen
          onBack={() => {
            clearPendingLogin();
            setAuthStage('login');
          }}
        />
      );
    }
    if (authStage === 'forgotEmail') {
      return (
        <AdminForgotPasswordScreen
          onBack={() => setAuthStage('login')}
          onOtpSent={email => {
            setForgotEmail(email);
            setForgotOtp('');
            setAuthStage('forgotOtp');
          }}
        />
      );
    }
    if (authStage === 'forgotOtp') {
      return (
        <AdminForgotOtpScreen
          email={forgotEmail}
          onBack={() => setAuthStage('forgotEmail')}
          onContinue={otp => {
            setForgotOtp(otp);
            setAuthStage('resetPassword');
          }}
        />
      );
    }
    if (authStage === 'resetPassword') {
      return (
        <AdminResetPasswordScreen
          email={forgotEmail}
          otp={forgotOtp}
          onBack={() => setAuthStage('forgotOtp')}
          onSuccess={() => {
            setForgotEmail('');
            setForgotOtp('');
            setAuthStage('login');
          }}
        />
      );
    }
    return <AdminLoginScreen onForgotPassword={() => setAuthStage('forgotEmail')} />;
  }

  return (
    <>
      <AdminDepositNotificationListener />
      <AdminDrawerProvider>
        <AdminSideDrawer />
        <AdminStack.Navigator screenOptions={{ headerShown: false }}>
          <AdminStack.Screen name="AdminTabs" component={AdminTabNavigator} />
          <AdminStack.Screen name="UserList" component={UserListScreen} />
          <AdminStack.Screen name="FundDepositList" component={FundDepositListScreen} />
          <AdminStack.Screen name="FundWithdrawList" component={FundWithdrawListScreen} />
          <AdminStack.Screen name="BuyGoldList" component={BuyGoldListScreen} />
          <AdminStack.Screen name="SellGoldList" component={SellGoldListScreen} />
          <AdminStack.Screen name="AuditList" component={AuditListScreen} />
          <AdminStack.Screen name="DepositDetail" component={DepositDetailScreen} />
          <AdminStack.Screen name="WithdrawDetail" component={WithdrawDetailScreen} />
          <AdminStack.Screen name="TakeAction" component={TakeActionScreen} />
          <AdminStack.Screen name="TakeWithdrawAction" component={TakeWithdrawActionScreen} />
          <AdminStack.Screen
            name="ApprovalSuccess"
            component={ApprovalSuccessScreen}
            options={{ gestureEnabled: false }}
          />
        </AdminStack.Navigator>
      </AdminDrawerProvider>
    </>
  );
};

const AdminNavigator = () => (
  <AdminProvider>
    <AdminFlow />
  </AdminProvider>
);

export default AdminNavigator;
