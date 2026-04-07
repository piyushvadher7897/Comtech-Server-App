import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable
} from 'react-native';
import { formatUptime } from '../utils/utils';
import DeviceInfo from 'react-native-device-info';
import { Shoket_URL } from '../global/constant';

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

const getDriveTitleFromDisk = diskData => {
  const letter = getDriveLetterFromDisk(diskData);
  return letter ? `${letter} Drive Storage` : 'Drive Storage';
};

const ServerDetailsModal = ({ visible, onClose, serverData, serverName }) => (
  <Modal
    animationType="slide"
    transparent
    visible={visible}
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <View style={styles.modalContent}>
        <ScrollView>
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
      </View>
    </Pressable>
  </Modal>
);

const DriveDetailsModal = ({ visible, onClose, diskData, title }) => {
  const usePercent = diskData?.usePercent ?? diskData?.use;
  const hasPercent = typeof usePercent === 'number' && Number.isFinite(usePercent);
  const percentLabel = hasPercent ? `${Math.round(usePercent)}%` : 'N/A';

  const filesystem = diskData?.filesystem ?? diskData?.fs ?? 'N/A';
  const mount = diskData?.mount ?? diskData?.mounted ?? diskData?.path ?? 'N/A';
  const type = diskData?.type ?? diskData?.fstype ?? diskData?.format ?? 'N/A';

  const explorerTotal = diskData?.explorerTotal ?? null;
  const explorerFree = diskData?.explorerFree ?? null;
  const explorerText = diskData?.explorerText ?? null;

  const sizeBytes = diskData?.size ?? diskData?.total ?? diskData?.capacity;
  const usedBytes = diskData?.used ?? diskData?.usedBytes;
  const freeBytes = diskData?.available ?? diskData?.free ?? diskData?.freeBytes;

  const totalLabel = explorerTotal ?? formatBytes(sizeBytes);
  const freeLabel = explorerFree ?? formatBytes(freeBytes);
  const usedLabel = formatBytes(usedBytes);

  const summary =
    explorerText ??
    (explorerFree && explorerTotal
      ? `${explorerFree} free of ${explorerTotal}`
      : 'N/A');

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <ScrollView>
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
        </View>
      </Pressable>
    </Modal>
  );
};

const ServerStatusScreen = ({ setExternalRefresh, refreshingParent, ismarket,navigation }) => {
  // const SERVER_URL = 'ws://78.129.235.51:5080';
const SERVER_URL = `${Shoket_URL}`;
console.log("ismarket", ismarket);
  const [status, setStatus] = useState({
    pm2: [],
    redis: { status: 'unknown' },
    lastBackup: null,

  });
  console.log('Device Info:', status);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [driveModalVisible, setDriveModalVisible] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const wsRef = useRef(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const formatBackupDate = date => {
    if (!date) return 'No backup info';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getPM2ByName = (arr, name) => arr?.find(p => p.name === name);

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
    try {
      const ws = new WebSocket(SERVER_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log(JSON.stringify({ type: 'get_status' }))
        ws.send(JSON.stringify({ type: 'get_status' }));
      };

      ws.onmessage = event => {
        try {
          console.log('Raw message:', event);
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          if (data.error) return setError(data.error);

          if (data.type === 'status_update') {
            setStatus(data.data);
          } else if (data.type === 'pm2_status') {
            setStatus(prev => ({ ...prev, pm2: data.data }));
          }
          setError(null);
        } catch {
          setError('Failed to parse server message');
        }
      };

      ws.onerror = () => {
        setError('Connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };
    } catch {
      setError('Failed to connect to server');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    setExternalRefresh && setExternalRefresh(onRefresh);
  }, [setExternalRefresh]);

  const onRefresh = () => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: 'get_status' }));
  };

  useEffect(() => {
    refreshingParent && onRefresh();
  }, [refreshingParent]);

  const whitelabel = getPM2ByName(status.pm2, 'App');
  const comtech = getPM2ByName(status.pm2, 'Comtech-backend');
  console.log("disks==>", status?.disks);
  const diskList = Array.isArray(status?.disks)
    ? status.disks
    : Array.isArray(status?.diskData)
      ? status.diskData
      : Array.isArray(status?.disk)
        ? status.disk
        : [];
        console.log("diskList", diskList);

 const getDriveByLetter = letter => {
  const target = letter.toUpperCase();
  return diskList.find(disk => getDriveLetterFromDisk(disk) === target);
 };

  const cDrive = getDriveByLetter('C');
  const eDrive = getDriveByLetter('E');

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

        <View style={styles.headerContainer}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center'
          }}>
            <Animated.View
              style={[
                styles.blinkDot,
                { backgroundColor: isConnected ? 'red' : '', opacity: blinkAnim }
              ]}
            />
            <Text style={styles.header}>Server</Text>
          </View>
          <Text style={[styles.header, { marginEnd: 10 }]}>Status</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.serversWrapper}
          showsVerticalScrollIndicator={false}
        >
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
            title="StoneX Api Live"
            serverData={ismarket ? {status:"up"} : {status: 'down'}}
            backupDate={null}
            // onPress={() => handleServerPress(ismarket, 'Redis Server Live')}
          />
          <StorageRow
            diskData={cDrive}
            onPress={() => handleDrivePress(cDrive, getDriveTitleFromDisk(cDrive))}
          />
          <StorageRow
            diskData={eDrive}
            onPress={() => handleDrivePress(eDrive, getDriveTitleFromDisk(eDrive))}
          />
        </ScrollView>

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
      </View>
    </View>
  );
};

const ServerRow = ({ title, serverData, backupDate, onPress }) => (
  <TouchableOpacity style={styles.serverContainer} onPress={onPress}>
    <View style={[styles.serverInfo, { alignSelf: 'center' }]}>
      <Text style={styles.serverName}>{title}</Text>
      {serverData?.uptime != null && (
        <Text style={styles.serverType}>
          Uptime: {formatUptime(serverData.uptime)}
        </Text>
      )}
      {serverData?.backupDate && (
        <Text style={[styles.backupInfo,{fontSize: 10}]}>
          Last Backup: {serverData?.backupDate}
        </Text>
      )}
    </View>
    <View
      style={[
        styles.statusIndicator,
        {
          backgroundColor:
            serverData?.status === 'online' || serverData?.status === 'up' || serverData?.status === true
              ? '#008000'
              : '#ff0000',
          alignSelf: 'center'
        }
      ]}
    >
      <Text style={styles.statusText}>
        {serverData?.status === 'online' || serverData?.status === 'up'
          ? 'ON'
          : 'OFF'}
      </Text>
    </View>
  </TouchableOpacity>
);

function StorageRow({ title, diskData, onPress }) {
  const usePercent = diskData?.usePercent ?? diskData?.use;
  const hasPercent = typeof usePercent === 'number' && Number.isFinite(usePercent);
  const percent = hasPercent ? Math.max(0, Math.min(100, usePercent)) : null;
  const percentLabel = hasPercent ? `${Math.round(percent)}%` : 'N/A';

  const explorerTotal = diskData?.explorerTotal ?? null;
  const explorerFree = diskData?.explorerFree ?? null;

  const sizeBytes = diskData?.size ?? diskData?.total ?? diskData?.capacity;
  const usedBytes = diskData?.used ?? diskData?.usedBytes;
  const freeBytes = diskData?.available ?? diskData?.free ?? diskData?.freeBytes;

  const totalLabel = explorerTotal ?? formatBytes(sizeBytes);
  const freeLabel = explorerFree ?? formatBytes(freeBytes);
  const usedLabel = formatBytes(usedBytes);

  const filesystem = (diskData?.filesystem ?? diskData?.fs ?? '').toString();
  const type = (diskData?.type ?? diskData?.fstype ?? diskData?.format ?? '').toString();

  const driveLetter = getDriveLetterFromDisk(diskData) ?? '';
  const resolvedTitle = title ?? getDriveTitleFromDisk(diskData);

  const baseColor = driveLetter === 'C' ? '#00A3FF' : '#5BD100';
  const barColor = !hasPercent ? '#999999' : percent >= 80 ? '#FF0000' : baseColor;

  const subtitleParts = [];
  if (type) subtitleParts.push(type);
  if (totalLabel && totalLabel !== 'N/A') subtitleParts.push(totalLabel);
  const subtitle = subtitleParts.length ? subtitleParts.join(' • ') : 'Storage';

  return (
    <TouchableOpacity style={styles.driveCard} onPress={onPress}>
      <View style={styles.driveHeaderRow}>
        <View style={styles.driveHeaderLeft}>
          <View style={styles.driveIcon}>
            <Text style={styles.driveIconText}>{driveLetter || '?'}</Text>
          </View>
          <View style={styles.driveTitleGroup}>
            <Text style={styles.driveTitle}>{resolvedTitle}</Text>
            <Text style={styles.driveSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
        <Text style={[styles.drivePercent, { color: hasPercent ? barColor : '#999999' }]}>
          {percentLabel}
        </Text>
      </View>

      <View style={styles.driveProgressTrack}>
        {hasPercent && (
          <View style={[styles.driveProgressFill, { width: `${percent}%`, backgroundColor: barColor }]} />
        )}
      </View>

      <View style={styles.driveUsedFreeRow}>
        <View style={styles.driveUsedFreeItem}>
          <View style={[styles.driveDot, { backgroundColor: barColor }]} />
          <Text style={styles.driveUsedFreeText}>
            Used — {usedLabel}
          </Text>
        </View>
        <View style={styles.driveUsedFreeItem}>
          <View style={[styles.driveDot, { backgroundColor: '#D9D9D9' }]} />
          <Text style={styles.driveUsedFreeText}>
            Free — {freeLabel}
          </Text>
        </View>
      </View>

      <View style={styles.driveStatsRow}>
        <View style={styles.driveStatCard}>
          <Text style={styles.driveStatValue}>{usedLabel}</Text>
          <Text style={styles.driveStatLabel}>Used</Text>
        </View>
        <View style={styles.driveStatCard}>
          <Text style={styles.driveStatValue}>{freeLabel}</Text>
          <Text style={styles.driveStatLabel}>Free</Text>
        </View>
        <View style={styles.driveStatCard}>
          <Text style={styles.driveStatValue}>{totalLabel}</Text>
          <Text style={styles.driveStatLabel}>Total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 20,
  },
  errorContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffcccc',
    borderRadius: 8,
  },
 errorText: {
    color: '#b00020',
    fontWeight: 'bold',
    textAlign: 'center',
  },
    navigateContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
   navigateText: {
    color: '#023020',
    fontWeight: 'bold',
    textAlign: 'center',
  },
 
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  serversWrapper: {
    paddingVertical: 10,
    paddingBottom: 10,
  },
  header: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  serverContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  serverInfo: {
    flex: 1,
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 15,
    borderRadius: 10,
    height: 90,
    width: "65%",
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  blinkDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
    marginBottom: 4,
  },
  serverName: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  serverType: {
    color: 'rgb(8, 8, 8)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  backupInfo: {
    color: '#666',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  statusIndicator: {
    borderRadius: 15,
    minWidth: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    width: "30%",
    alignSelf: 'center'
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#023020',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#023020',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driveCard: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  driveIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driveIconText: {
    color: '#333',
    fontWeight: '800',
    fontSize: 16,
  },
  driveTitleGroup: {
    marginLeft: 10,
    flex: 1,
  },
  driveTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  driveSubtitle: {
    marginTop: 2,
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  drivePercent: {
    fontSize: 18,
    fontWeight: '900',
  },
  driveProgressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 8,
    backgroundColor: '#1D1D1D',
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
    marginRight: 8,
  },
  driveUsedFreeText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
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
});

export default ServerStatusScreen;
