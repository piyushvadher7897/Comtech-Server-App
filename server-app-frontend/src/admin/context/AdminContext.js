import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {
  DEPOSIT_STATUS,
  USER_ROLES,
  STATUS_FILTERS,
  isPendingManagerQueue,
} from '../constants/depositStatus';
import { ADMIN_APP_URL } from '../../global/constant';
import {
  adminLogin,
  adminVerifyOtp,
  adminResendOtp,
  adminForgotPassword,
  adminForgotPasswordVerify,
  fetchDepositsPage,
  fetchDepositStats,
  fetchDepositDetail,
  submitWorkflowAction,
  resolveApprovalRole,
  mapBackendDeposit,
  getWebAdminDateRange,
  DEPOSIT_LIST_PAGE_SIZE,
  submitDepositPending,
  isMissingDepositProfile,
} from '../../services/adminApi';
import {
  ADMIN_SESSION_KEY,
  ADMIN_TOKEN_KEY,
  clearAdminAuthStorage,
  refreshAdminTokenIfNeeded,
  saveAdminToken,
  setAdminTokenRefreshHandlers,
} from '../../services/adminTokenRefresh';

const AdminContext = createContext(null);

const AUTO_REFRESH_MS = 15000;

const sameDateRange = (a, b) =>
  a?.startDate === b?.startDate && a?.endDate === b?.endDate;

const formatApiError = err => {
  if (err.response?.status === 429) {
    return 'Too many requests. Wait a moment, then pull to refresh.';
  }
  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.response?.data?.errors?.error ||
    err.message ||
    'Failed to load deposits'
  );
};

export const AdminProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [depositTotal, setDepositTotal] = useState(0);
  const [depositPage, setDepositPage] = useState(1);
  const [hasMoreDeposits, setHasMoreDeposits] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [depositDateRange, setDepositDateRange] = useState(() => getWebAdminDateRange());
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS.ALL);
  const [stats, setStats] = useState({
    pendingManager: 0,
    pendingAdmin: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pendingLogin, setPendingLogin] = useState(null);

  const depositDateRangeRef = useRef(depositDateRange);
  depositDateRangeRef.current = depositDateRange;
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;
  const lastFetchAtRef = useRef(0);
  const fetchInFlightRef = useRef(null);

  const clearPendingLogin = useCallback(() => setPendingLogin(null), []);

  const persistSession = useCallback(async session => {
    setUser(session);
    await AsyncStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    if (session.token) {
      await saveAdminToken(session.token, { resetLoginTimestamp: true });
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const data = await fetchDepositStats();
      setStats({
        pendingManager: data.pendingManager || 0,
        pendingAdmin: data.pendingAdmin || 0,
        totalPending: data.totalPending || 0,
      });
    } catch {
      // keep previous stats
    }
  }, []);

  const refreshDeposits = useCallback(async ({ silent = false, dateRange, statusFilter: nextStatusFilter, force = false } = {}) => {
    const range = dateRange || depositDateRangeRef.current || getWebAdminDateRange();
    const activeStatusFilter =
      nextStatusFilter !== undefined ? nextStatusFilter : statusFilterRef.current;

    if (!force && fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const run = (async () => {
      try {
        const result = await fetchDepositsPage({
          ...range,
          page: 1,
          limit: DEPOSIT_LIST_PAGE_SIZE,
          statusFilter: activeStatusFilter,
        });
        setDeposits(result.docs || []);
        setDepositPage(1);
        setHasMoreDeposits(Boolean(result.hasNextPage));
        setDepositTotal(result.totalDocs ?? (result.docs || []).length);
        const nextRange =
          result.startDate && result.endDate
            ? { startDate: result.startDate, endDate: result.endDate }
            : range;
        if (!sameDateRange(depositDateRangeRef.current, nextRange)) {
          setDepositDateRange(nextRange);
        }
        if (nextStatusFilter !== undefined) {
          setStatusFilter(nextStatusFilter);
        }
        lastFetchAtRef.current = Date.now();
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        fetchInFlightRef.current = null;
      }
    })();

    fetchInFlightRef.current = run;
    return run;
  }, []);

  const loadMoreDeposits = useCallback(async () => {
    if (loadingMore || !hasMoreDeposits) return;
    setLoadingMore(true);
    setError(null);
    const range = depositDateRangeRef.current || getWebAdminDateRange();
    try {
      const nextPage = depositPage + 1;
      const result = await fetchDepositsPage({
        ...range,
        page: nextPage,
        limit: DEPOSIT_LIST_PAGE_SIZE,
        statusFilter: statusFilterRef.current,
      });
      setDeposits(prev => {
        const seen = new Set(prev.map(d => d.id));
        const merged = [...prev];
        (result.docs || []).forEach(doc => {
          if (!seen.has(doc.id)) merged.push(doc);
        });
        return merged;
      });
      setDepositPage(nextPage);
      setHasMoreDeposits(Boolean(result.hasNextPage));
      if (result.totalDocs != null) setDepositTotal(result.totalDocs);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [depositPage, hasMoreDeposits, loadingMore]);

  const applyDepositFilters = useCallback(
    async ({ statusFilter: nextStatusFilter, startDate, endDate }) => {
      const range = { startDate, endDate };
      setStatusFilter(nextStatusFilter ?? STATUS_FILTERS.ALL);
      setDepositDateRange(range);
      await refreshDeposits({ silent: true, dateRange: range, statusFilter: nextStatusFilter, force: true });
    },
    [refreshDeposits],
  );

  const resetDepositFilters = useCallback(async () => {
    const range = getWebAdminDateRange();
    setStatusFilter(STATUS_FILTERS.ALL);
    setDepositDateRange(range);
    await refreshDeposits({ silent: true, dateRange: range, statusFilter: STATUS_FILTERS.ALL, force: true });
  }, [refreshDeposits]);

  const loadAdminData = useCallback(
    async ({ silent = false, force = false } = {}) => {
      const now = Date.now();
      if (!force && now - lastFetchAtRef.current < AUTO_REFRESH_MS) {
        return;
      }
      await Promise.all([refreshDeposits({ silent, force }), refreshStats()]);
    },
    [refreshDeposits, refreshStats],
  );

  const normalizeLoginIdentifier = value => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return trimmed;
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) {
      if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
      return digits.length > 10 ? digits.slice(-10) : digits;
    }
    return trimmed;
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await adminLogin(normalizeLoginIdentifier(email), password);
      if (data.email || data._id || data.id) {
        setPendingLogin({
          _id: data._id || data.id,
          email: data.email || email,
          name: data.name || data.firstName || 'Admin',
        });
        return { success: true, requiresOtp: true };
      }
      return { success: false, message: data.error || data.email || 'Login failed' };
    } catch (err) {
      const isNetwork =
        err.message === 'Network Error' || err.code === 'ECONNABORTED' || !err.response;
      const message = isNetwork
        ? `Cannot reach backend at ${ADMIN_APP_URL}. Make sure npm run local is running.`
        : err.response?.data?.error ||
          err.response?.data?.email ||
          err.response?.data?.password ||
          (err.response?.status === 404
            ? 'No admin account found for that email or mobile number'
            : null) ||
          err.message ||
          'Login failed';
      return { success: false, message };
    }
  };

  const verifyOtp = async otp => {
    if (!pendingLogin?._id) {
      return { success: false, message: 'Login session expired. Please sign in again.' };
    }
    setError(null);
    try {
      const deviceID = await DeviceInfo.getUniqueId();
      const data = await adminVerifyOtp(pendingLogin._id, otp, deviceID);
      if (!data.success || !data.token) {
        return { success: false, message: data.error || 'Invalid OTP' };
      }
      const role = resolveApprovalRole(data.payload || {});
      const roleName = data.payload?.role?.name || '';
      const session = {
        _id: pendingLogin._id,
        email: pendingLogin.email,
        name: data.payload?.name || pendingLogin.name,
        role,
        roleName,
        isSuperAdmin: roleName.toUpperCase() === 'SUPERADMIN',
        token: data.token,
      };
      await persistSession(session);
      setPendingLogin(null);
      await loadAdminData({ force: true });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'OTP verification failed';
      return { success: false, message };
    }
  };

  const resendOtp = async () => {
    if (!pendingLogin?._id) {
      return { success: false, message: 'Login session expired. Please sign in again.' };
    }
    try {
      await adminResendOtp(pendingLogin._id);
      return { success: true, message: 'OTP sent to your email' };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Could not resend OTP. Try again.';
      return { success: false, message };
    }
  };

  const requestForgotPasswordOtp = async email => {
    try {
      const data = await adminForgotPassword(String(email || '').trim().toLowerCase());
      return { success: true, message: data?.message || 'OTP sent to your email' };
    } catch (err) {
      const message =
        err.response?.data?.email ||
        err.response?.data?.error ||
        err.message ||
        'Could not send OTP';
      return { success: false, message };
    }
  };

  const resetForgotPassword = async ({ email, otp, password }) => {
    try {
      const data = await adminForgotPasswordVerify(
        String(email || '').trim().toLowerCase(),
        String(otp || '').trim(),
        String(password || ''),
      );
      return { success: Boolean(data?.success), message: data?.message || 'Password reset successfully' };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Password reset failed';
      return { success: false, message };
    }
  };

  const logout = useCallback(async () => {
    setUser(null);
    setDeposits([]);
    setDepositPage(1);
    setHasMoreDeposits(false);
    setPendingLogin(null);
    await clearAdminAuthStorage();
  }, []);

  useEffect(() => {
    setAdminTokenRefreshHandlers({ onLogout: logout });
  }, [logout]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && user) {
        refreshAdminTokenIfNeeded().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [user]);

  const restoreSession = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      const token = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
      if (!raw || !token) return;

      const refreshResult = await refreshAdminTokenIfNeeded();
      if (refreshResult.expired || !refreshResult.token) {
        await clearAdminAuthStorage();
        return;
      }

      const session = JSON.parse(raw);
      const activeToken = refreshResult.token;
      setUser({ ...session, token: activeToken });
      await loadAdminData({ silent: true, force: true });
    } catch {
      await clearAdminAuthStorage();
    }
  }, [loadAdminData]);

  const getDepositById = useCallback(
    async depositId => {
      const cached = deposits.find(d => d.id === depositId);
      if (cached && !isMissingDepositProfile(cached)) return cached;
      try {
        const detail = await fetchDepositDetail(depositId);
        if (!detail) return cached || null;
        if (cached && isMissingDepositProfile(detail) && !isMissingDepositProfile(cached)) {
          return cached;
        }
        return detail;
      } catch {
        return cached || null;
      }
    },
    [deposits],
  );

  const submitAction = useCallback(
    async (deposit, selectedStatus, remarks, meta = {}) => {
      setError(null);
      const isManagerStage = isPendingManagerQueue(deposit);
      try {
        let record;
        let workflowStatus;

        if (isManagerStage) {
          record = await submitDepositPending(deposit, selectedStatus, remarks, {
            refNo: meta.refNo,
            paymentId: meta.paymentId,
          });
        } else {
          const result = await submitWorkflowAction(deposit, selectedStatus, remarks);
          record = result.record;
          workflowStatus = result.workflowStatus;
        }

        const updated = record?._id || record?.status
          ? mapBackendDeposit(
              workflowStatus ? { ...record, workflowStatus } : record,
              deposit._raw?.user,
            )
          : null;

        if (updated) {
          const amountsLookConverted =
            updated.amountUsd > 0 &&
            updated.amountAed > 0 &&
            updated.amountUsd < updated.amountAed;
          const enriched = {
            ...deposit,
            ...updated,
            userName: isMissingDepositProfile(updated) ? deposit.userName : updated.userName,
            email: updated.email || deposit.email,
            amountAed: amountsLookConverted ? updated.amountAed : deposit.amountAed,
            amountUsd: amountsLookConverted ? updated.amountUsd : deposit.amountUsd,
          };
          setDeposits(prev =>
            prev.map(d => (d.id === deposit.id ? enriched : d)),
          );
          await loadAdminData({ silent: true, force: true });
          return { success: true, data: enriched, stage: isManagerStage ? 'manager' : 'admin' };
        }
        await loadAdminData({ silent: true, force: true });
        return { success: true, data: deposit, stage: isManagerStage ? 'manager' : 'admin' };
      } catch (err) {
        const message = formatApiError(err) || 'Action failed';
        setError(message);
        return { success: false, message };
      }
    },
    [loadAdminData],
  );

  const computedStats = useMemo(() => stats, [stats]);

  const value = useMemo(
    () => ({
      user,
      deposits,
      depositTotal,
      depositPage,
      hasMoreDeposits,
      loadingMore,
      depositDateRange,
      statusFilter,
      stats: computedStats,
      loading,
      refreshing,
      error,
      pendingLogin,
      clearPendingLogin,
      login,
      verifyOtp,
      resendOtp,
      requestForgotPasswordOtp,
      resetForgotPassword,
      logout,
      restoreSession,
      refreshDeposits,
      refreshStats,
      loadMoreDeposits,
      applyDepositFilters,
      resetDepositFilters,
      loadAdminData,
      getDepositById,
      submitAction,
      isManager: user?.role === USER_ROLES.MANAGER,
      isAdmin: user?.role === USER_ROLES.ADMIN,
      isSuperAdmin: user?.isSuperAdmin === true,
    }),
    [
      user,
      deposits,
      depositTotal,
      depositPage,
      hasMoreDeposits,
      loadingMore,
      depositDateRange,
      statusFilter,
      computedStats,
      loading,
      refreshing,
      error,
      pendingLogin,
      clearPendingLogin,
      logout,
      restoreSession,
      refreshDeposits,
      refreshStats,
      loadMoreDeposits,
      applyDepositFilters,
      resetDepositFilters,
      loadAdminData,
      getDepositById,
      submitAction,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
