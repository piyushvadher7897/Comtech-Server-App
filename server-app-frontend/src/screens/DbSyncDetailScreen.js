import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SERVER_APP_URL, SERVER_APP_HEADERS } from '../global/constant';
import { colors, cardShadow } from '../theme/theme';

const fmtTime = ts => {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); } catch { return '—'; }
};
const fmtHour = ts => {
  if (!ts) return '—';
  if (typeof ts === 'string' && (ts.includes('AM') || ts.includes('PM'))) return ts;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return String(ts);
  }
};
const fmtDate = ts => {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return '—'; }
};

const StatCard = ({ label, value, valueColor }) => (
  <View style={st.statCard}>
    <Text style={[st.statValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
      {value ?? '—'}
    </Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
);

const SectionTitle = ({ children }) => (
  <Text style={st.sectionTitle}>{children}</Text>
);

const Divider = () => <View style={st.divider} />;

const InfoRow = ({ label, value, valueColor }) => (
  <View style={st.infoRow}>
    <Text style={st.infoLabel}>{label}</Text>
    <Text
      style={[st.infoValue, valueColor ? { color: valueColor } : null]}
      numberOfLines={2}
      selectable
    >
      {value ?? '—'}
    </Text>
  </View>
);

const DbSyncDetailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [syncData, setSyncData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [viewAllModal, setViewAllModal] = useState(null); // 'logs' | 'errors' | 'history' | null
  const [selectedErrorLog, setSelectedErrorLog] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fetchIntervalRef = useRef(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${SERVER_APP_URL}/api/sync/status`, {
        headers: { ...SERVER_APP_HEADERS, 'User-Agent': 'ServerApp/1.0' },
      });
      const json = await res.json();
      if (json && json.success && json.data) {
        setSyncData(json.data);
        setFetchError(null);
        setLastFetched(new Date());
      } else {
        setFetchError((json && json.error) || 'Failed to fetch sync status');
      }
    } catch (e) {
      console.log('DbSyncDetailScreen fetch error:', e && e.message);
      setFetchError(e && e.message ? e.message : 'Network request failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchIntervalRef.current = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(fetchIntervalRef.current);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };



  const rawStatus = syncData && syncData.status ? String(syncData.status).toLowerCase() : 'unknown';
  const isConnected = Boolean(syncData && syncData.targetConnected);
  const isEnabled = syncData ? Boolean(syncData.enabled) : true;

  // 1. Green: Online and connected
  const isOnline = isConnected && rawStatus === 'online';

  // 2. Orange: Sync paused, sync disabled, or warning
  const isPaused = rawStatus === 'paused' || (!isEnabled && isConnected);
  const isDisabled = rawStatus === 'disabled' || (!isEnabled && !isConnected && !syncData?.error);
  const isWarning = rawStatus === 'warning' || isPaused || isDisabled;

  // 3. Red: Target DB defect / connection failed / disconnected
  const isError = !isConnected || rawStatus === 'error' || rawStatus === 'offline';

  let statusColor = '#10B981'; // Green
  let statusBadgeText = 'LIVE';
  let statusLabel = 'Continuous Live Sync Active';
  let statusSubtitle = 'All database writes are continuously replicated to the cloud database in real time.';

  if (isError) {
    statusColor = '#EF4444'; // Red Alert
    statusBadgeText = 'OFFLINE';
    statusLabel = 'Critical Alert — Target Database Disconnected';
    statusSubtitle =
      (syncData && syncData.error) ||
      (syncData && syncData.lastError && syncData.lastError.message) ||
      'The target cloud database is unreachable or the connection was interrupted. Writes may not be replicated.';
  } else if (isPaused || isDisabled) {
    statusColor = '#F59E0B'; // Orange
    statusBadgeText = isPaused ? 'PAUSED' : 'OFF';
    statusLabel = isPaused ? 'Sync Paused — Replication On Hold' : 'Sync Inactive — Mirroring Off';
    statusSubtitle = 'Live database sync is paused or turned off in configuration. Local DB is operating normally.';
  } else if (rawStatus === 'warning') {
    statusColor = '#F59E0B'; // Orange
    statusBadgeText = 'WARNING';
    statusLabel = 'Warning — Recent Sync Retrying';
    statusSubtitle =
      (syncData && syncData.lastError && syncData.lastError.message) ||
      'Target DB connected, but a recent write encountered an issue and is retrying.';
  }

  const totalOps = (syncData && syncData.totalSyncedCount) || 0;
  const syncMode = (syncData && syncData.mode ? String(syncData.mode) : 'REALTIME').toUpperCase();

  // Parse recent logs and 24h history
  const recentLogs = Array.isArray(syncData && syncData.recentLogs) ? syncData.recentLogs : [];
  const rawHistory = Array.isArray(syncData && syncData.history24h) ? syncData.history24h : [];

  // Adapt 24-hour history to the phone's local hourly time slots (IST / device timezone)
  const history24h = React.useMemo(() => {
    if (!rawHistory.length) return [];
    const now = new Date();
    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0, 0);

    return rawHistory.map((item, idx) => {
      const localSlot = new Date(currentHour.getTime() - idx * 60 * 60 * 1000);
      const localLabel = localSlot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return {
        ...item,
        time: localLabel,
        localTime: localLabel,
        timestamp: localSlot.toISOString(),
      };
    });
  }, [rawHistory]);

  // Separate successful/general replication sync logs so error logs are kept dedicated below
  const recentSyncLogs = React.useMemo(() => {
    return recentLogs.filter(
      (l) => l.status !== 'error' && !l.error && l.status !== 'failed'
    );
  }, [recentLogs]);

  // Extract all sync error logs across recentLogs, recentErrors, and lastError
  const errorLogs = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    recentLogs.forEach((l, idx) => {
      const isErr = l.status === 'error' || Boolean(l.error) || l.status === 'failed';
      if (isErr) {
        const key = String(l.id || `${l.timestamp}_${l.collection}_${idx}`);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: key,
            timestamp: l.timestamp,
            time: l.time || fmtTime(l.timestamp),
            collection: l.collection || 'unknown',
            operation: l.operation || 'Write',
            status: 'error',
            message: l.message || `Failed to sync (${l.collection || 'unknown'} collection)`,
            error: l.error || l.message || 'Sync error',
            documentId: l.documentId || null,
          });
        }
      }
    });

    if (Array.isArray(syncData?.recentErrors)) {
      syncData.recentErrors.forEach((err, idx) => {
        const key = String(err.id || `${err.timestamp}_${err.collection}_${idx}`);
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: key,
            timestamp: err.timestamp,
            time: err.time || fmtTime(err.timestamp),
            collection: err.collection || 'unknown',
            operation: err.operation || 'Sync',
            status: 'error',
            message: err.message || 'Sync error',
            error: err.error || err.message || 'Sync error',
            documentId: err.documentId || null,
          });
        }
      });
    }

    if (syncData?.lastError && syncData.lastError.message) {
      const le = syncData.lastError;
      const key = `lastError_${le.timestamp || ''}_${le.collection || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: key,
          timestamp: le.timestamp || new Date().toISOString(),
          time: fmtTime(le.timestamp),
          collection: le.collection || 'database',
          operation: le.operation || 'Replication',
          status: 'error',
          message: le.message || 'Sync write failure',
          error: le.error || le.message || 'Sync write failure',
          documentId: le.documentId || null,
        });
      }
    }

    if (syncData?.error && typeof syncData.error === 'string') {
      const key = `syncData_error_${syncData.error}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: key,
          timestamp: new Date().toISOString(),
          time: fmtTime(new Date()),
          collection: 'connection',
          operation: 'Connect',
          status: 'error',
          message: 'Target database connection error',
          error: syncData.error,
          documentId: null,
        });
      }
    }

    if (fetchError) {
      const key = `fetch_error_${fetchError}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: key,
          timestamp: new Date().toISOString(),
          time: fmtTime(new Date()),
          collection: 'network',
          operation: 'Fetch',
          status: 'error',
          message: 'Unable to reach sync service',
          error: String(fetchError),
          documentId: null,
        });
      }
    }

    return list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [recentLogs, syncData, fetchError]);

  const displayedLogs = recentSyncLogs.slice(0, 8);
  const displayedErrors = errorLogs.slice(0, 8);
  const displayedHistory = history24h.slice(0, 8);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Screen Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={st.backArrow}>{"back"}</Text>
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>Database Sync</Text>
          <Text style={st.headerSub}>Live Replication Monitor</Text>
        </View>
        <View style={st.headerRight}>
          <Animated.View style={[st.liveDot, { opacity: pulseAnim, backgroundColor: statusColor }]} />
          <Text style={[st.liveLabel, { color: statusColor }]}>{statusBadgeText}</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={st.loader}>
          <ActivityIndicator color={colors.goldLight} size="large" />
          <Text style={st.loaderText}>Loading sync metrics…</Text>
        </View>
      ) : (
        <ScrollView
          style={st.scroll}
          contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.goldLight}
              colors={[colors.goldLight]}
            />
          }
        >
          {/* Status Banner */}
          <View style={[st.statusBanner, { borderColor: statusColor }]}>
            <View style={[st.statusDot, { backgroundColor: statusColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[st.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
              <Text style={st.statusSub}>{statusSubtitle}</Text>
            </View>
          </View>

          {/* Quick Metrics Grid */}
          <View style={st.statsGrid}>
            <StatCard label="Total Synced" value={totalOps.toLocaleString()} valueColor={colors.goldLight} />
            <StatCard label="Sync Mode" value={syncMode} valueColor="#38BDF8" />
          </View>

          {/* SECTION 1: Recent Sync Logs */}
          <View style={st.cardContainer}>
            <View style={st.cardHeaderRow}>
              <View style={st.cardHeaderLeft}>
                <View style={st.iconBox}>
                  <Text style={st.iconText}>📄</Text>
                </View>
                <Text style={st.cardHeaderTitle}>Recent Sync Logs</Text>
              </View>
              {recentSyncLogs.length > 8 && (
                <TouchableOpacity
                  style={st.viewAllBtn}
                  onPress={() => setViewAllModal('logs')}
                  activeOpacity={0.7}
                >
                  <Text style={st.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={st.cardContentBody}>
              {displayedLogs.length > 0 ? (
                displayedLogs.map((log, idx) => (
                  <View
                    key={log.id || `log_${idx}`}
                    style={[st.logRow, idx > 0 && st.rowBorderTop]}
                  >
                    {/* Status Dot */}
                    <View style={[st.logDot, st.dotSuccess]} />

                    {/* Timestamp */}
                    <Text style={st.logTime}>{log.timestamp ? fmtTime(log.timestamp) : (log.time || '—')}</Text>

                    {/* Message */}
                    <Text
                      style={st.logMessage}
                      numberOfLines={2}
                    >
                      {log.message || `Write synced successfully (${log.collection || 'db'} collection)`}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={st.emptyBox}>
                  <Text style={st.emptyText}>Waiting for sync activity logs...</Text>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 2: Sync Error Logs (Similar card directly below Recent Sync Logs) */}
          <View style={[st.cardContainer, { marginTop: 16 }, errorLogs.length > 0 && st.cardContainerError]}>
            <View style={st.cardHeaderRow}>
              <View style={st.cardHeaderLeft}>
                <View style={[st.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.18)' }]}>
                  <Text style={st.iconText}>⚠️</Text>
                </View>
                <Text style={st.cardHeaderTitle}>
                  Sync Error Logs {errorLogs.length > 0 ? <Text style={st.errorCountText}>({errorLogs.length})</Text> : null}
                </Text>
              </View>
              {errorLogs.length > 8 && (
                <TouchableOpacity
                  style={st.viewAllBtn}
                  onPress={() => setViewAllModal('errors')}
                  activeOpacity={0.7}
                >
                  <Text style={st.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={st.cardContentBody}>
              {displayedErrors.length > 0 ? (
                displayedErrors.map((err, idx) => (
                  <TouchableOpacity
                    key={err.id || `err_row_${idx}`}
                    style={[st.logRow, idx > 0 && st.rowBorderTop, st.logRowError]}
                    onPress={() => setSelectedErrorLog(err)}
                    activeOpacity={0.7}
                  >
                    {/* Status Dot */}
                    <View style={[st.logDot, st.dotError]} />

                    {/* Timestamp */}
                    <Text style={[st.logTime, { color: '#FCA5A5' }]}>
                      {err.timestamp ? fmtTime(err.timestamp) : (err.time || '—')}
                    </Text>

                    {/* Message */}
                    <Text
                      style={[st.logMessage, st.logMessageError]}
                      numberOfLines={2}
                    >
                      {err.message || `Failed to sync (${err.collection || 'db'} collection)`}
                      {err.error && err.error !== err.message ? ` • ${err.error}` : ''}
                    </Text>

                    {/* Badge */}
                    <View style={st.errorDetailBadge}>
                      <Text style={st.errorDetailBadgeText}>Details →</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={st.emptyBox}>
                  <Text style={[st.emptyText, { color: '#10B981' }]}>
                    ✓ No sync errors recorded. All replication operations healthy.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 2: Sync History (Last 24 Hours) (Screenshot 1 Right Card) */}
          <View style={[st.cardContainer, { marginTop: 16 }]}>
            <View style={st.cardHeaderRow}>
              <View style={st.cardHeaderLeft}>
                <View style={st.iconBox}>
                  <Text style={st.iconText}>⏱️</Text>
                </View>
                <Text style={st.cardHeaderTitle}>Sync History <Text style={st.cardHeaderSubtitle}>(Last 24 Hours)</Text></Text>
              </View>
              {history24h.length > 8 && (
                <TouchableOpacity
                  style={st.viewAllBtn}
                  onPress={() => setViewAllModal('history')}
                  activeOpacity={0.7}
                >
                  <Text style={st.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={st.cardContentBody}>
              {/* Table Header */}
              <View style={st.tableHeaderRow}>
                <Text style={[st.tableHeaderCol, { flex: 1.1 }]}>Time</Text>
                <Text style={[st.tableHeaderCol, { flex: 1.3, textAlign: 'center' }]}>Status</Text>
                <Text style={[st.tableHeaderCol, { flex: 1.1, textAlign: 'right' }]}>Records</Text>
                <Text style={[st.tableHeaderCol, { flex: 1.0, textAlign: 'right' }]}>Duration</Text>
              </View>

              {/* Table Rows */}
              {displayedHistory.length > 0 ? (
                displayedHistory.map((item, idx) => {
                  const isSuccess = item.isSuccess !== false && !String(item.status).toLowerCase().includes('error');
                  return (
                    <View key={item.id || `hist_${idx}`} style={[st.tableRow, idx > 0 && st.rowBorderTop]}>
                      <Text style={[st.tableCellTime, { flex: 1.1 }]}>{fmtHour(item.time || item.timestamp)}</Text>
                      
                      <View style={{ flex: 1.3, alignItems: 'center' }}>
                        <View style={[st.statusPill, isSuccess ? st.statusPillSuccess : st.statusPillError]}>
                          <Text style={[st.statusPillText, isSuccess ? st.pillTextSuccess : st.pillTextError]}>
                            {item.status || (isSuccess ? 'Success' : 'Error')}
                          </Text>
                        </View>
                      </View>

                      <Text style={[st.tableCellRecords, { flex: 1.1, textAlign: 'right' }]}>
                        {item.records !== undefined && item.records !== null && item.records !== ''
                          ? item.records
                          : (item.totalRecords !== undefined ? String(item.totalRecords) : '0')}
                      </Text>

                      <Text style={[st.tableCellDuration, { flex: 1.0, textAlign: 'right' }]}>
                        {item.duration && item.duration !== '—' ? item.duration : '< 1s'}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={st.emptyBox}>
                  <Text style={st.emptyText}>Loading sync checkpoints...</Text>
                </View>
              )}
            </View>
          </View>

          {/* SECTION 3: Connection & Target DB Details */}
          <SectionTitle>Connection Details</SectionTitle>
          <View style={st.card}>
            <InfoRow
              label="Target Database Connection"
              value={isConnected ? '✓ Connected' : '✗ Disconnected'}
              valueColor={isConnected ? '#10B981' : '#EF4444'}
            />
            <Divider />
            <InfoRow label="Source Database" value={(syncData && syncData.sourceDb) || 'Local database (MainDb)'} />
            <Divider />
            <InfoRow label="Target Database" value={(syncData && syncData.targetDb) || 'comtech_Mirror'} valueColor={colors.goldLight} />
            <Divider />
            <InfoRow
              label="Last Synced"
              value={(syncData && syncData.lastSyncedAt) ? fmtDate(syncData.lastSyncedAt) : 'Waiting for write activity'}
            />
            <Divider />
            <InfoRow label="Last Refresh" value={lastFetched ? fmtTime(lastFetched) : '—'} valueColor={colors.textMuted} />
          </View>

          <Text style={st.footerNote}>
            Auto-refreshes every 5 seconds. Pull down to refresh immediately.
          </Text>
        </ScrollView>
      )}

      {/* View All Modal */}
      <Modal
        visible={Boolean(viewAllModal)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setViewAllModal(null)}
      >
        <View style={st.modalOverlay}>
          <View style={[st.modalBox, { paddingBottom: insets.bottom + 16 }]}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>
                {viewAllModal === 'logs'
                  ? 'All Recent Sync Logs'
                  : viewAllModal === 'errors'
                  ? 'All Sync Error Logs'
                  : 'Sync History (Last 24 Hours)'}
              </Text>
              <TouchableOpacity
                style={st.modalCloseBtn}
                onPress={() => setViewAllModal(null)}
                activeOpacity={0.7}
              >
                <Text style={st.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={st.modalScroll} showsVerticalScrollIndicator={true}>
              {viewAllModal === 'logs' ? (
                recentSyncLogs.length > 0 ? (
                  recentSyncLogs.map((log, idx) => (
                    <View
                      key={log.id || `modal_log_${idx}`}
                      style={[st.logRow, idx > 0 && st.rowBorderTop]}
                    >
                      <View style={[st.logDot, st.dotSuccess]} />
                      <Text style={st.logTime}>{log.timestamp ? fmtTime(log.timestamp) : (log.time || '—')}</Text>
                      <Text style={st.logMessage}>
                        {log.message || `Write synced successfully (${log.collection || 'db'} collection)`}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={st.emptyBox}>
                    <Text style={st.emptyText}>Waiting for sync activity logs...</Text>
                  </View>
                )
              ) : viewAllModal === 'errors' ? (
                errorLogs.length > 0 ? (
                  errorLogs.map((err, idx) => (
                    <TouchableOpacity
                      key={err.id || `modal_err_${idx}`}
                      style={[st.logRow, idx > 0 && st.rowBorderTop, st.logRowError]}
                      onPress={() => setSelectedErrorLog(err)}
                      activeOpacity={0.7}
                    >
                      <View style={[st.logDot, st.dotError]} />
                      <Text style={[st.logTime, { color: '#FCA5A5' }]}>
                        {err.timestamp ? fmtTime(err.timestamp) : (err.time || '—')}
                      </Text>
                      <Text style={[st.logMessage, st.logMessageError]}>
                        {err.message || `Failed to sync (${err.collection || 'db'} collection)`}
                        {err.error && err.error !== err.message ? ` • ${err.error}` : ''}
                      </Text>
                      <View style={st.errorDetailBadge}>
                        <Text style={st.errorDetailBadgeText}>Details →</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={st.emptyBox}>
                    <Text style={[st.emptyText, { color: '#10B981' }]}>
                      ✓ No sync errors found. All operations succeeded.
                    </Text>
                  </View>
                )
              ) : (
                <View>
                  <View style={st.tableHeaderRow}>
                    <Text style={[st.tableHeaderCol, { flex: 1.1 }]}>Time</Text>
                    <Text style={[st.tableHeaderCol, { flex: 1.3, textAlign: 'center' }]}>Status</Text>
                    <Text style={[st.tableHeaderCol, { flex: 1.1, textAlign: 'right' }]}>Records</Text>
                    <Text style={[st.tableHeaderCol, { flex: 1.0, textAlign: 'right' }]}>Duration</Text>
                  </View>
                  {history24h.map((item, idx) => {
                    const isSuccess = item.isSuccess !== false && !String(item.status).toLowerCase().includes('error');
                    return (
                      <View key={item.id || `modal_hist_${idx}`} style={[st.tableRow, idx > 0 && st.rowBorderTop]}>
                        <Text style={[st.tableCellTime, { flex: 1.1 }]}>{fmtHour(item.time || item.timestamp)}</Text>
                        <View style={{ flex: 1.3, alignItems: 'center' }}>
                          <View style={[st.statusPill, isSuccess ? st.statusPillSuccess : st.statusPillError]}>
                            <Text style={[st.statusPillText, isSuccess ? st.pillTextSuccess : st.pillTextError]}>
                              {item.status || (isSuccess ? 'Success' : 'Error')}
                            </Text>
                          </View>
                        </View>
                        <Text style={[st.tableCellRecords, { flex: 1.1, textAlign: 'right' }]}>
                          {item.records !== undefined && item.records !== null && item.records !== ''
                            ? item.records
                            : (item.totalRecords !== undefined ? String(item.totalRecords) : '0')}
                        </Text>
                        <Text style={[st.tableCellDuration, { flex: 1.0, textAlign: 'right' }]}>
                          {item.duration && item.duration !== '—' ? item.duration : '< 1s'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sync Error Details Modal */}
      <Modal
        visible={Boolean(selectedErrorLog)}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedErrorLog(null)}
      >
        <View style={st.errorModalOverlay}>
          <View style={[st.errorModalBox, { paddingBottom: insets.bottom + 16 }]}>
            <View style={st.errorModalHeader}>
              <View style={st.errorModalHeaderLeft}>
                <View style={st.errorModalIconBox}>
                  <Text style={st.errorModalIcon}>⚠️</Text>
                </View>
                <View>
                  <Text style={st.errorModalTitle}>Sync Error Details</Text>
                  <Text style={st.errorModalSubtitle}>Replication Failure Diagnostic</Text>
                </View>
              </View>
              <TouchableOpacity
                style={st.modalCloseBtn}
                onPress={() => setSelectedErrorLog(null)}
                activeOpacity={0.7}
              >
                <Text style={st.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={st.errorModalScroll} showsVerticalScrollIndicator={true}>
              {/* Failure Banner */}
              <View style={st.errorDetailBanner}>
                <View style={st.errorStatusPill}>
                  <Text style={st.errorStatusPillText}>🔴 FAILED</Text>
                </View>
                <Text style={st.errorDetailTime}>
                  {selectedErrorLog?.timestamp ? fmtDate(selectedErrorLog.timestamp) : (selectedErrorLog?.time || '—')}
                </Text>
              </View>

              {/* Metadata rows */}
              <View style={st.errorDetailCard}>
                <View style={st.errorDetailRow}>
                  <Text style={st.errorDetailLabel}>Target Collection</Text>
                  <Text style={st.errorDetailValue}>{selectedErrorLog?.collection || 'unknown'}</Text>
                </View>
                <View style={st.errorDetailDivider} />
                <View style={st.errorDetailRow}>
                  <Text style={st.errorDetailLabel}>Database Operation</Text>
                  <Text style={st.errorDetailValue}>{selectedErrorLog?.operation || 'Write'}</Text>
                </View>
                {selectedErrorLog?.documentId ? (
                  <>
                    <View style={st.errorDetailDivider} />
                    <View style={st.errorDetailRow}>
                      <Text style={st.errorDetailLabel}>Document ID</Text>
                      <Text style={[st.errorDetailValue, st.monoText]} selectable numberOfLines={1}>
                        {selectedErrorLog.documentId}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              {/* Error Message */}
              <Text style={st.errorSectionHeading}>Error Summary</Text>
              <View style={st.errorSummaryBox}>
                <Text style={st.errorSummaryText} selectable>
                  {selectedErrorLog?.message || 'Sync write operation failed'}
                </Text>
              </View>

              {/* Full Technical Trace / Reason */}
              <Text style={st.errorSectionHeading}>Technical Log Details</Text>
              <View style={st.errorTerminalBox}>
                <View style={st.errorTerminalHeader}>
                  <Text style={st.errorTerminalTitle}>Diagnostic Output (Selectable)</Text>
                </View>
                <Text style={st.errorTerminalText} selectable>
                  {selectedErrorLog?.error || selectedErrorLog?.message || 'No additional technical stack trace available.'}
                </Text>
              </View>

              <View style={st.errorAutoRetryNote}>
                <Text style={st.errorAutoRetryNoteText}>
                  ℹ️ Live database sync continuously monitors all collections and will replicate updates automatically.
                </Text>
              </View>

              <TouchableOpacity
                style={st.errorModalCloseAction}
                onPress={() => setSelectedErrorLog(null)}
                activeOpacity={0.8}
              >
                <Text style={st.errorModalCloseActionText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBorder,
    backgroundColor: 'rgba(8, 42, 42, 0.98)',
    ...cardShadow,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.goldLight, fontSize: 10, fontWeight: '700', lineHeight: 22 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.goldLight, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  headerSub: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 40, justifyContent: 'flex-end' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: colors.textMuted, fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  statusSub: { fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 15 },

  // Quick Stats
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statValue: { color: colors.goldLight, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 3, textAlign: 'center' },

  // Custom Screenshot 1 Cards
  cardContainer: {
    backgroundColor: '#072023',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
    ...cardShadow,
  },
  cardContainerError: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  errorCountText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.2,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  viewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  cardContentBody: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  // Log Rows (Screenshot 1 Left Card)
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSuccess: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  dotError: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  logTime: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94A3B8',
    fontWeight: '500',
  },
  logMessage: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
    fontWeight: '400',
  },
  logMessageError: {
    color: '#F87171',
  },
  logRowError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorDetailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDetailBadgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // History Table (Screenshot 1 Right Card)
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  tableCellTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E2E8F0',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusPillError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  pillTextSuccess: {
    color: '#10B981',
  },
  pillTextError: {
    color: '#EF4444',
  },
  tableCellRecords: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    fontFamily: 'monospace',
  },
  tableCellDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },

  // Connection Info Card
  sectionTitle: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: 4,
    overflow: 'hidden',
    ...cardShadow,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, flex: 0.45 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flex: 0.55, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.goldBorder, marginHorizontal: 14, opacity: 0.5 },
  emptyBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
  footerNote: { color: colors.textDim, fontSize: 10, textAlign: 'center', marginTop: 18, fontStyle: 'italic', marginBottom: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#072023',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    maxHeight: '85%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalScroll: {
    marginTop: 10,
  },

  // Filter Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  tabItemActiveError: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: '#EF4444',
  },
  tabItemWithErrors: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },

  // SECTION 0: Error Section Card
  errorSectionCard: {
    backgroundColor: 'rgba(45, 12, 14, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    overflow: 'hidden',
    ...cardShadow,
  },
  errorSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  errorIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    fontSize: 15,
  },
  errorSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FEE2E2',
    letterSpacing: 0.2,
  },
  errorSectionSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FCA5A5',
    marginTop: 1,
  },
  errorPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  errorPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorCardBody: {
    padding: 12,
  },
  errorItemCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: 12,
  },
  errorItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorItemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  errorCollectionTag: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  errorOperationTag: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  errorItemTime: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorItemMessage: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorSnippetBox: {
    marginTop: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    flexDirection: 'row',
    gap: 4,
  },
  errorSnippetLabel: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  errorSnippetText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
  },
  errorItemActionRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  errorItemActionText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllErrorsBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  viewAllErrorsBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },

  // Error Details Modal Styles
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  errorModalBox: {
    backgroundColor: '#1C0D0F',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    maxHeight: '90%',
    padding: 16,
  },
  errorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorModalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModalIcon: {
    fontSize: 16,
  },
  errorModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FEE2E2',
  },
  errorModalSubtitle: {
    fontSize: 11,
    color: '#FCA5A5',
    marginTop: 1,
  },
  errorModalScroll: {
    marginTop: 12,
  },
  errorDetailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorStatusPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  errorStatusPillText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorDetailTime: {
    color: '#E2E8F0',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  errorDetailCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  errorDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorDetailLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  errorDetailValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  errorDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 14,
  },
  monoText: {
    fontFamily: 'monospace',
  },
  errorSectionHeading: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  errorSummaryBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: 12,
    marginBottom: 8,
  },
  errorSummaryText: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorTerminalBox: {
    backgroundColor: '#0A0506',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  errorTerminalHeader: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorTerminalTitle: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorTerminalText: {
    color: '#F87171',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 12,
    lineHeight: 18,
  },
  errorAutoRetryNote: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorAutoRetryNoteText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  errorModalCloseAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  errorModalCloseActionText: {
    color: '#FEE2E2',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default DbSyncDetailScreen;
