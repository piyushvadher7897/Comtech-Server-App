import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { formatUptime } from '../utils/utils';
import { Shoket_URL, SERVER_APP_URL, SERVER_APP_HEADERS } from '../global/constant';
import { colors, cardShadow } from '../theme/theme';
import { getServerIconType, ServerIconBox } from '../components/ServerIcons';
import StatusBadge from '../components/StatusBadge';

const formatBytes = bytes => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return 'N/A';
  if (value === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  const normalized = value / Math.pow(1024, unitIndex);
  const decimals = unitIndex <= 1 ? 0 : normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2;
  return `${normalized.toFixed(decimals)} ${units[unitIndex]}`;
};

const toBytes = value => {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const text = value.toString().trim();
  if (!text) return null;

  const match = text.match(/^([\d.,]+)\s*([kmgtp]?)(i?b)?$/i);
  if (!match) return null;

  const numberPart = Number.parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(numberPart)) return null;

  const unitPrefix = (match[2] || '').toLowerCase();
  const pow =
    unitPrefix === ''
      ? 0
      : unitPrefix === 'k'
        ? 1
        : unitPrefix === 'm'
          ? 2
          : unitPrefix === 'g'
            ? 3
            : unitPrefix === 't'
              ? 4
              : unitPrefix === 'p'
                ? 5
                : null;
  if (pow == null) return null;

  return numberPart * Math.pow(1024, pow);
};

const bytesLabel = (rawValue, fallbackBytes) => {
  if (rawValue == null) return formatBytes(fallbackBytes);
  if (typeof rawValue === 'number') return formatBytes(rawValue);
  if (typeof rawValue === 'string') {
    const parsed = toBytes(rawValue);
    if (parsed == null) return rawValue;
    if (/[a-zA-Z]/.test(rawValue)) return rawValue;
    return formatBytes(parsed);
  }
  return formatBytes(fallbackBytes);
};

const getDriveLetterFromDisk = diskData => {
  const candidates = [
    diskData?.filesystem,
    diskData?.fs,
    diskData?.mount,
    diskData?.mounted,
    diskData?.path
  ]
    .filter(Boolean)
    .map(v => v.toString());

  for (const value of candidates) {
    const match = value.toUpperCase().match(/([A-Z]):/);
    if (match?.[1]) return match[1];
  }
  return null;
};

const getDiskKey = diskData => {
  // Windows: use drive letter (C, D, etc.)
  const letter = getDriveLetterFromDisk(diskData);
  if (letter) return letter;
  // Linux: use mount point as key
  const mount = (diskData?.mount ?? diskData?.mounted ?? diskData?.filesystem ?? diskData?.fs ?? '').toString();
  return mount || null;
};

const isUsefulDisk = diskData => {
  const mount = (diskData?.mount ?? diskData?.mounted ?? diskData?.filesystem ?? '').toString();
  // Filter out Docker overlays and other virtual filesystems
  if (mount.includes('/docker/') || mount.includes('/overlay')) return false;
  // Filter out tiny system partitions (< 1 GB)
  const size = diskData?.size ?? diskData?.total ?? 0;
  if (typeof size === 'number' && size > 0 && size < 1024 * 1024 * 1024) return false;
  return true;
};

const LINUX_MOUNT_LABELS = {
  '/': 'Root Storage',
  '/home': 'Home Storage',
  '/var': 'Var Storage',
  '/tmp': 'Temp Storage',
  '/boot': 'Boot Storage',
  '/boot/efi': 'EFI Boot',
};

const getDriveTitleFromDisk = diskData => {
  const letter = getDriveLetterFromDisk(diskData);
  if (letter) return `${letter} Drive Storage`;
  const mount = (diskData?.mount ?? diskData?.mounted ?? diskData?.filesystem ?? '').toString();
  if (LINUX_MOUNT_LABELS[mount]) return LINUX_MOUNT_LABELS[mount];
  if (mount) return `${mount} Storage`;
  return 'Drive Storage';
};

const ServerDetailsModal = ({ visible, onClose, serverData, serverName }) => (
  <Modal
    animationType="slide"
    transparent
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text style={styles.modalTitle}>{serverName}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    serverData?.status === 'online' ||
                    serverData?.status === 'up'
                      ? '#008000'
                      : '#ff0000'
                }
              ]}
            >
              {serverData?.status === 'online' ||
              serverData?.status === 'up'
                ? 'Online'
                : 'Offline'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Uptime:</Text>
            <Text style={styles.detailValue}>
              {formatUptime(serverData?.uptime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Memory Usage:</Text>
            <Text style={styles.detailValue}>
              {serverData?.memory
                ? `${(serverData.memory / (1024 * 1024)).toFixed(2)} MB`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CPU Usage:</Text>
            <Text style={styles.detailValue}>
              {serverData?.cpu ? `${serverData.cpu}%` : 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Backup:</Text>
            <Text style={[styles.detailValue,{fontSize: 12}]}>
              {serverData?.backupDate
                ? serverData?.backupDate
                : 'N/A'}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const DriveDetailsModal = ({ visible, onClose, diskData, title }) => {
  const usePercent = diskData?.usePercent ?? diskData?.use;
  const hasPercent = typeof usePercent === 'number' && Number.isFinite(usePercent);
  const percent = hasPercent ? Math.max(0, Math.min(100, usePercent)) : null;
  const percentLabel = hasPercent ? `${Math.round(percent)}%` : 'N/A';

  const filesystem = diskData?.filesystem ?? diskData?.fs ?? 'N/A';
  const mount = diskData?.mount ?? diskData?.mounted ?? diskData?.path ?? 'N/A';
  const type = diskData?.type ?? diskData?.fstype ?? diskData?.format ?? 'N/A';

  const explorerTotalRaw = diskData?.explorerTotal ?? null;
  const explorerFreeRaw = diskData?.explorerFree ?? null;
  const explorerText = diskData?.explorerText ?? null;

  const sizeBytesRaw = diskData?.size ?? diskData?.total ?? diskData?.capacity;
  const usedBytesRaw = diskData?.used ?? diskData?.usedBytes;
  const freeBytesRaw = diskData?.available ?? diskData?.free ?? diskData?.freeBytes;

  const totalBytes = toBytes(explorerTotalRaw) ?? toBytes(sizeBytesRaw);
  const freeBytes = toBytes(explorerFreeRaw) ?? toBytes(freeBytesRaw);
  const usedBytes =
    toBytes(usedBytesRaw) ?? (totalBytes != null && freeBytes != null ? totalBytes - freeBytes : null);

  const totalLabel = bytesLabel(explorerTotalRaw, totalBytes);
  const freeLabel = bytesLabel(explorerFreeRaw, freeBytes);
  const usedLabel = formatBytes(usedBytes);

  const summary =
    explorerText ??
    (freeLabel !== 'N/A' && totalLabel !== 'N/A'
      ? `${freeLabel} free of ${totalLabel}`
      : 'N/A');

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={styles.modalTitle}>{title}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Used:</Text>
              <Text style={styles.detailValue}>{percentLabel}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Summary:</Text>
              <Text style={[styles.detailValue, { fontSize: 12 }]}>{summary}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Filesystem:</Text>
              <Text style={styles.detailValue}>{filesystem}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mount:</Text>
              <Text style={styles.detailValue}>{mount}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{type}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total:</Text>
              <Text style={styles.detailValue}>{totalLabel}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Free:</Text>
              <Text style={styles.detailValue}>{freeLabel}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Used Space:</Text>
              <Text style={styles.detailValue}>{usedLabel}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const TimelineCard = React.memo(({ item }) => {
  const isItemSuccess = item.status === 'success';
  const isHeartbeat =
    item.collection === 'Sync Health Check' ||
    item.collection === 'Atlas Heartbeat' ||
    item.id?.startsWith('hb_');
  const displayName = isHeartbeat ? 'Sync Health Check' : item.collection;
  const badgeLabel = !isItemSuccess
    ? '✗ ISSUE'
    : isHeartbeat
      ? '🟢 HEALTHY'
      : '✓ SYNCED';

  return (
    <View
      style={[
        styles.syncTimelineItem,
        !isItemSuccess
          ? styles.syncTimelineItemError
          : isHeartbeat
            ? styles.syncTimelineItemHeartbeat
            : styles.syncTimelineItemSuccess,
      ]}
    >
      <View style={styles.syncTimelineHeader}>
        <View
          style={[
            styles.syncTimelineTimeBadge,
            !isItemSuccess
              ? styles.syncTimelineTimeBadgeError
              : isHeartbeat
                ? styles.syncTimelineTimeBadgeHeartbeat
                : styles.syncTimelineTimeBadgeSuccess,
          ]}
        >
          <Text style={styles.syncTimelineTimeText}>
            {item.time || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Recent')}
          </Text>
        </View>
        <Text
          style={[
            styles.syncTimelineStatusText,
            {
              color: !isItemSuccess
                ? '#EF4444'
                : isHeartbeat
                  ? '#38BDF8'
                  : '#10B981',
            },
          ]}
        >
          {badgeLabel}
        </Text>
      </View>
      <Text style={styles.syncTimelineCollText} numberOfLines={1}>
        {displayName}
      </Text>
      {item.message ? (
        <Text
          style={[
            styles.syncTimelineMsgText,
            { color: isItemSuccess ? colors.textMuted : '#F87171' },
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      ) : null}
    </View>
  );
});

const SyncDetailsModal = React.memo(({ visible, onClose, syncData, navigation }) => {
  const isOnline = syncData?.status === 'online';
  const isWarning = syncData?.status === 'warning';
  const isConnected = Boolean(syncData?.targetConnected);
  const statusColor = isOnline ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444';
  const statusText = isOnline
    ? 'Continuous Live Sync Active'
    : isWarning
      ? 'Warning (Recent Sync Issue)'
      : syncData?.status
        ? syncData.status.toUpperCase()
        : 'Offline';

  const lastSyncStr = syncData?.lastSyncedAt
    ? new Date(syncData.lastSyncedAt).toLocaleString()
    : 'Waiting for live write activity';

  const totalOps = syncData?.totalSyncedCount ?? 0;
  const syncMode = (syncData?.mode ? String(syncData.mode) : 'REALTIME').toUpperCase();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={styles.modalTitle}>Database Live Replication</Text>

            {/* Continuous Live Status Header Card */}
            <View style={[styles.syncStatusHeaderCard, { borderColor: statusColor }]}>
              <View style={[styles.syncDot, { backgroundColor: statusColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.syncStatusHeaderText, { color: statusColor }]}>
                  {statusText}
                </Text>
                <Text style={styles.syncStatusHeaderSub}>
                  {isOnline
                    ? 'All database writes are continuously replicated to the cloud database in real time.'
                    : (syncData?.error || syncData?.lastError?.message || 'Database sync is disconnected or paused.')}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Grid */}
            <View style={styles.syncStatsGrid}>
              <View style={styles.syncStatBox}>
                <Text style={styles.syncStatNumber}>{totalOps}</Text>
                <Text style={styles.syncStatLabel}>Total Synced</Text>
              </View>
              <View style={styles.syncStatBox}>
                <Text style={[styles.syncStatNumber, { color: '#38BDF8' }]}>{syncMode}</Text>
                <Text style={styles.syncStatLabel}>Sync Mode</Text>
              </View>
            </View>

            {/* Connection & Database Details */}
            <View style={styles.syncDetailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Target Database Connection:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: isConnected ? '#10B981' : '#EF4444', fontWeight: '700' },
                  ]}
                >
                  {isConnected ? '✓ Connected' : '✗ Disconnected'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source Database:</Text>
                <Text style={[styles.detailValue, { fontSize: 12 }]}>
                  {syncData?.sourceDb || 'Local database (MainDb)'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Target Database:</Text>
                <Text style={[styles.detailValue, { fontSize: 12, color: colors.goldLight }]}>
                  {syncData?.targetDb || 'comtech_Mirror'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Synced:</Text>
                <Text style={[styles.detailValue, { fontSize: 12 }]}>
                  {lastSyncStr}
                </Text>
              </View>
            </View>


            {/* Continuous Sync Timeline & Checkpoints */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.syncSectionHeading}>Live Replication Timeline & Activity:</Text>
              <View style={[styles.timelineBoxContainer, { marginTop: 6 }]}>
                {Array.isArray(syncData?.timeline) && syncData.timeline.length > 0 ? (
                  <ScrollView
                    style={styles.timelineScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                  >
                    {syncData.timeline.map((item, idx) => (
                      <TimelineCard
                        key={item.id || `${item.collection}_${idx}`}
                        item={item}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.syncTimelineEmpty}>
                    <Text style={styles.syncTimelineEmptyText}>
                      🟢 Continuous replication active & listening for write operations...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Active Error Log (Auto-cleared when new sync succeeds) */}
            {(syncData?.lastError || (Array.isArray(syncData?.recentErrors) && syncData.recentErrors.length > 0)) ? (
              <View style={styles.syncErrorBox}>
                <Text style={styles.syncErrorTitle}>⚠️ Current Sync Issue:</Text>
                <Text style={styles.syncErrorMsg}>
                  {syncData?.lastError?.message || syncData?.recentErrors?.[0]?.message || 'Sync error'}
                </Text>
                {syncData?.lastError?.collection ? (
                  <Text style={styles.syncErrorColl}>
                    Failed Collection: {syncData.lastError.collection}
                  </Text>
                ) : null}
                {syncData?.lastError?.timestamp ? (
                  <Text style={styles.syncErrorTime}>
                    {new Date(syncData.lastError.timestamp).toLocaleString()}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                  }}
                  onPress={() => {
                    onClose();
                    navigation?.navigate('DbSyncDetail');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>
                    Open Full Sync Error Logs →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const ServerStatusScreen = ({ setExternalRefresh, refreshingParent, ismarket,navigation }) => {
  // const SERVER_URL = 'ws://78.129.235.51:5080';
const SERVER_URL = `${Shoket_URL}`;
console.log("ismarket", ismarket);
  const [status, setStatus] = useState({
    pm2: [],
    redis: { status: 'unknown' },
    dbSync: null,
    lastBackup: null,
  });
  console.log('Device Info:', status);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [driveModalVisible, setDriveModalVisible] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Direct fetch for live DB Sync status so it works reliably with zero-flicker diffing
  const fetchSyncStatusDirect = async () => {
    try {
      const url = `${SERVER_APP_URL}/api/sync/status`;
      const res = await fetch(url, {
        headers: {
          ...SERVER_APP_HEADERS,
          'User-Agent': 'ServerApp/1.0',
        },
      });
      const json = await res.json();
      if (json && json.success && json.data) {
        setStatus(prev => {
          if (JSON.stringify(prev?.dbSync) === JSON.stringify(json.data)) {
            return prev;
          }
          return {
            ...prev,
            dbSync: json.data,
          };
        });
      }
    } catch (e) {
      console.log('Direct sync status fetch error:', e?.message);
    }
  };

  useEffect(() => {
    fetchSyncStatusDirect();
    const syncTimer = setInterval(fetchSyncStatusDirect, 5000);
    return () => clearInterval(syncTimer);
  }, []);

  const formatBackupDate = date => {
    if (!date) return 'No backup info';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getPM2ByName = (arr, ...names) => {
    if (!arr || !Array.isArray(arr)) return undefined;
    const targets = names.map(n => String(n).toLowerCase());
    return arr.find(p => p?.name && targets.includes(String(p.name).toLowerCase()));
  };

  const handleServerPress = (serverData, serverName) => {
    setSelectedServer({ data: serverData, name: serverName });
    setModalVisible(true);
  };

  const handleDrivePress = (diskData, title) => {
    setSelectedDrive({ data: diskData, title });
    setDriveModalVisible(true);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [blinkAnim]);

  const connectWebSocket = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    try {
      const ws = new WebSocket(SERVER_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log(JSON.stringify({ type: 'get_status' }));
        ws.send(JSON.stringify({ type: 'get_status' }));
      };

      ws.onmessage = event => {
        try {
          console.log('Raw message:', event);
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          if (data.error) return setError(data.error);

          if (data.type === 'status_update') {
            setStatus(prev => ({
              ...prev,
              ...data.data,
              disks:
                Array.isArray(data.data?.disks) && data.data.disks.length > 0
                  ? data.data.disks
                  : prev?.disks ?? [],
              dbSync:
                data.data?.dbSync && data.data.dbSync.status === 'online'
                  ? data.data.dbSync
                  : (prev?.dbSync && prev.dbSync.status === 'online'
                      ? prev.dbSync
                      : (data.data?.dbSync !== undefined && data.data?.dbSync !== null
                          ? data.data.dbSync
                          : prev?.dbSync)),
            }));
          } else if (data.type === 'pm2_status') {
            setStatus(prev => ({ ...prev, pm2: data.data }));
          }
          setError(null);
        } catch {
          setError('Failed to parse server message');
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!reconnectTimerRef.current) {
          setError('Connection error');
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWebSocket();
          }, 5000);
        }
      };
    } catch {
      setError('Failed to connect to server');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    setExternalRefresh && setExternalRefresh(onRefresh);
  }, [setExternalRefresh]);

  const onRefresh = () => {
    fetchSyncStatusDirect();
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: 'get_status' }));
  };

  useEffect(() => {
    refreshingParent && onRefresh();
  }, [refreshingParent]);

  const whitelabel = getPM2ByName(status.pm2, 'WL-backend', 'wl-backend', 'App', 'app', 'whitelabel');
  const comtech = getPM2ByName(status.pm2, 'comtech-backend', 'Comtech-backend', 'comtech');
  console.log("disks==>", status?.disks);
  const diskList = Array.isArray(status?.disks)
    ? status.disks
    : Array.isArray(status?.diskData)
      ? status.diskData
      : Array.isArray(status?.disk)
        ? status.disk
        : [];
        console.log("diskList", diskList);

  const driveEntries = (() => {
    const map = new Map();

    for (const disk of diskList) {
      if (!isUsefulDisk(disk)) continue;
      const key = getDiskKey(disk);
      if (!key) continue;
      if (!map.has(key)) map.set(key, disk);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, disk]) => disk);
  })();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
         {/* <TouchableOpacity style={styles.navigateContainer} onPress={()=>{navigation.navigate('CronData')}} >
            <Text style={styles.navigateText}>{`Weekend Orders ==>`}</Text>
          </TouchableOpacity> */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Image
            source={require('../../asset/images/APP_ICON.png')}
            style={styles.sectionLogo}
          />
          <View style={styles.sectionTitleWrap}>
            {!isConnected && (
              <Animated.View
                style={[styles.connectionDot, { opacity: blinkAnim }]}
              />
            )}
            <Text style={styles.sectionTitle}>SERVER STATUS</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>

        {status?.dbSync?.lastError ? (
          <TouchableOpacity
            style={styles.syncAlertBanner}
            onPress={() => navigation?.navigate('DbSyncDetail')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.syncAlertTitle}>⚠️ DB Sync Alert</Text>
              <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>View Error Logs →</Text>
            </View>
            <Text style={styles.syncAlertMessage} numberOfLines={2}>
              {status.dbSync.lastError.message || 'Error occurred during database mirror'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.serversWrapper}>
          <ServerRow
            title="Whitelabel Live"
            serverData={{...whitelabel,"backupDate":status?.wlModifiedAt}}
            backupDate={status.wlModifiedAt}
            onPress={() => handleServerPress({...whitelabel,"backupDate":status?.wlModifiedAt}, 'Whitelabel Live')}
          />
          <ServerRow
            title="ComTech App Live"
            serverData={{...comtech,"backupDate":status?.comtechModifiedAt}}
            backupDate={status.comtechModifiedAt}
            onPress={() => handleServerPress({...comtech,"backupDate":status?.comtechModifiedAt}, 'ComTech App Live')}
          />
          <ServerRow
            title="Admin Backend Live"
            serverData={{...comtech,"backupDate":status?.comtechModifiedAt}}
            backupDate={status.comtechModifiedAt}
            onPress={() => handleServerPress({...comtech,"backupDate":status?.comtechModifiedAt}, 'Admin Backend Live')}
          />
          <ServerRow
            title="Redis Server Live"
            serverData={status.redis}
            backupDate={null}
            onPress={() => handleServerPress(status.redis, 'Redis Server Live')}
          />
          <ServerRow
            title="Database Sync Live"
            serverData={{
              status:
                status?.dbSync?.status === 'online' || status?.dbSync?.status === 'warning'
                  ? 'online'
                  : 'offline',
              backupDate:
                status?.dbSync?.status === 'online'
                  ? (status?.dbSync?.lastSyncedAt
                      ? `🟢 Live • ${status.dbSync.lastSyncedCollection || 'doc'} at ${new Date(status.dbSync.lastSyncedAt).toLocaleTimeString()}`
                      : `🟢 Live • Continuous Replication (${status?.dbSync?.totalSyncedCount ?? 0} ops)`)
                  : status?.dbSync?.status === 'paused' || status?.dbSync?.status === 'disabled'
                  ? '🟠 Sync Off • Replication Paused'
                  : status?.dbSync?.status === 'warning'
                  ? (status?.dbSync?.lastError?.message
                      ? `🟠 Warning: ${status.dbSync.lastError.message}`
                      : '🟠 Warning: Retrying recent write')
                  : (status?.dbSync?.lastError?.message
                      ? `🔴 Offline: ${status.dbSync.lastError.message}`
                      : '🔴 Disconnected from Cloud DB'),
            }}
            backupDate={null}
            onPress={() => navigation?.navigate('DbSyncDetail')}
          />

           <ServerRow
            title="StoneX Api Live"
            serverData={ismarket ? {status:"up"} : {status: 'down'}}
            backupDate={null}
            // onPress={() => handleServerPress(ismarket, 'Redis Server Live')}
          />
          {driveEntries.map((diskData, index) => (
            <StorageRow
              key={getDriveLetterFromDisk(diskData) ?? diskData?.mount ?? diskData?.filesystem ?? `disk-${index}`}
              diskData={diskData}
              onPress={() => handleDrivePress(diskData, getDriveTitleFromDisk(diskData))}
            />
          ))}
        </View>

        <ServerDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          serverData={selectedServer?.data}
          serverName={selectedServer?.name}
        />

        <DriveDetailsModal
          visible={driveModalVisible}
          onClose={() => setDriveModalVisible(false)}
          diskData={selectedDrive?.data}
          title={selectedDrive?.title}
        />

        <SyncDetailsModal
          visible={syncModalVisible}
          onClose={() => setSyncModalVisible(false)}
          syncData={status?.dbSync}
          navigation={navigation}
        />
      </View>
    </View>
  );
};

const isServerOn = serverData =>
  serverData?.status === 'online' ||
  serverData?.status === 'up' ||
  serverData?.status === true;

const ServerRow = ({ title, serverData, onPress }) => {
  const on = isServerOn(serverData);
  const iconType = getServerIconType(title);

  return (
    <TouchableOpacity
      style={styles.serverContainer}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}>
      <View style={styles.serverIconWrap}>
        <ServerIconBox type={iconType} size={22} />
      </View>
      <View style={styles.serverInfo}>
        <Text style={styles.serverName}>{title}</Text>
        {serverData?.uptime != null && (
          <Text style={styles.serverMeta}>
            Uptime: {formatUptime(serverData.uptime)}
          </Text>
        )}
        {serverData?.backupDate ? (
          <Text style={styles.backupInfo} numberOfLines={1}>
            {serverData.backupDate}
          </Text>
        ) : null}
      </View>
      <StatusBadge on={on} />
    </TouchableOpacity>
  );
};

function StorageRow({ title, diskData, onPress }) {
  const usePercent = diskData?.usePercent ?? diskData?.use;
  const hasPercent = typeof usePercent === 'number' && Number.isFinite(usePercent);
  const percent = hasPercent ? Math.max(0, Math.min(100, usePercent)) : null;
  const percentLabel = hasPercent ? `${Math.round(percent)}%` : 'N/A';

  const explorerTotalRaw = diskData?.explorerTotal ?? null;
  const explorerFreeRaw = diskData?.explorerFree ?? null;

  const sizeBytesRaw = diskData?.size ?? diskData?.total ?? diskData?.capacity;
  const usedBytesRaw = diskData?.used ?? diskData?.usedBytes;
  const freeBytesRaw = diskData?.available ?? diskData?.free ?? diskData?.freeBytes;

  const totalBytes = toBytes(explorerTotalRaw) ?? toBytes(sizeBytesRaw);
  const freeBytes = toBytes(explorerFreeRaw) ?? toBytes(freeBytesRaw);
  const usedBytes =
    toBytes(usedBytesRaw) ?? (totalBytes != null && freeBytes != null ? totalBytes - freeBytes : null);

  const totalLabel = bytesLabel(explorerTotalRaw, totalBytes);
  const freeLabel = bytesLabel(explorerFreeRaw, freeBytes);
  const usedLabel = formatBytes(usedBytes);

  const filesystem = (diskData?.filesystem ?? diskData?.fs ?? '').toString();
  const type = (diskData?.type ?? diskData?.fstype ?? diskData?.format ?? '').toString();

  const driveLetter = getDriveLetterFromDisk(diskData) ?? '';
  const resolvedTitle = title ?? getDriveTitleFromDisk(diskData);

  const subtitleParts = [];
  if (type) subtitleParts.push(type);
  if (totalLabel && totalLabel !== 'N/A') subtitleParts.push(totalLabel);
  const subtitle = subtitleParts.length ? subtitleParts.join(' • ') : 'Storage';

  const barColorThemed = !hasPercent
    ? colors.textDim
    : percent >= 80
      ? colors.off
      : driveLetter === 'C'
        ? '#38BDF8'
        : colors.on;

  return (
    <TouchableOpacity style={styles.driveCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.driveHeaderRow}>
        <View style={styles.driveHeaderLeft}>
          <View style={styles.serverIconWrap}>
            <ServerIconBox type="storage" size={20} />
          </View>
          <View style={styles.driveTitleGroup}>
            <Text style={styles.driveTitle}>{resolvedTitle}</Text>
            <Text style={styles.driveSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.drivePercent,
            { color: hasPercent ? barColorThemed : colors.textDim },
          ]}>
          {percentLabel}
        </Text>
      </View>

      <View style={styles.driveProgressTrack}>
        {hasPercent && (
          <View
            style={[
              styles.driveProgressFill,
              { width: `${percent}%`, backgroundColor: barColorThemed },
            ]}
          />
        )}
      </View>

      <View style={styles.driveUsedFreeRow}>
        <View style={styles.driveUsedFreeItem}>
          <View style={[styles.driveDot, { backgroundColor: barColorThemed }]} />
          <Text style={styles.driveUsedFreeText}>Used: {usedLabel}</Text>
        </View>
        <View style={styles.driveUsedFreeItem}>
          <View style={[styles.driveDot, { backgroundColor: colors.textDim }]} />
          <Text style={styles.driveUsedFreeText}>Free: {freeLabel}</Text>
        </View>
        <View style={styles.driveUsedFreeItem}>
          <View style={[styles.driveDot, { backgroundColor: colors.goldMuted }]} />
          <Text style={styles.driveUsedFreeText}>Total: {totalLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 8,
  },
  errorContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },
  errorText: {
    color: colors.errorText,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
  },
  navigateContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  navigateText: {
    color: colors.gold,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    gap: 10,
    backgroundColor: 'rgba(8, 42, 42, 0.92)',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldBorder,
  },
  sectionLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.off,
  },
  serversWrapper: {
    paddingBottom: 8,
    gap: 10,
  },
  serverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 12,
    minHeight: 74,
    gap: 10,
    ...cardShadow,
  },
  serverIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
    minHeight: 44,
  },
  serverName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  serverMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  backupInfo: {
    color: colors.textDim,
    fontSize: 10,
    marginTop: 3,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.modalBg,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    width: '94%',
    maxHeight: '86%',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    ...cardShadow,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.goldLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBorder,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  closeButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.goldLight,
    fontSize: 15,
    fontWeight: 'bold',
  },
  driveCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    padding: 14,
    width: '100%',
    ...cardShadow,
  },
  driveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  driveTitleGroup: {
    marginLeft: 10,
    flex: 1,
  },
  driveTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  driveSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  drivePercent: {
    fontSize: 17,
    fontWeight: '800',
  },
  driveProgressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  driveProgressFill: {
    height: '100%',
    borderRadius: 8,
  },
  driveUsedFreeRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driveUsedFreeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
    marginLeft: 2,
  },
  driveUsedFreeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  driveStatsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  driveStatCard: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  driveStatValue: {
    color: '#222',
    fontSize: 14,
    fontWeight: '800',
  },
  driveStatLabel: {
    marginTop: 2,
    color: '#777',
    fontSize: 12,
    fontWeight: '700',
  },
  syncAlertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  syncAlertTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  syncAlertMessage: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '500',
  },
  syncErrorBox: {
    width: '100%',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  syncErrorTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  syncErrorMsg: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
  },
  syncErrorColl: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  syncErrorTime: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 6,
  },
  syncStatusHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncStatusHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  syncStatusHeaderSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  syncSectionHeading: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  collectionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  collectionBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collectionBadgeText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '600',
  },
  syncActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  syncActivitySuccess: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  syncActivityColl: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  syncActivityTime: {
    color: colors.textMuted,
    fontSize: 10,
  },
  syncStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  syncStatBox: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatNumber: {
    color: colors.goldLight,
    fontSize: 14,
    fontWeight: '800',
  },
  syncStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  syncDetailSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  collectionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  syncTimelineItemSuccess: {
    borderLeftColor: '#10B981',
  },
  syncTimelineItemHeartbeat: {
    borderLeftColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  syncTimelineTimeBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  syncTimelineTimeBadgeHeartbeat: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  syncTimelineItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  syncTimelineItemError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderLeftColor: '#EF4444',
  },
  syncTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncTimelineTimeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  syncTimelineTimeBadgeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  syncTimelineTimeText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  syncTimelineStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncTimelineCollText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  syncTimelineMsgText: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  timelineBoxContainer: {
    maxHeight: 220,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 6,
    overflow: 'hidden',
  },
  timelineScrollView: {
    maxHeight: 206,
  },
  syncTimelineEmpty: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTimelineEmptyText: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default ServerStatusScreen;
