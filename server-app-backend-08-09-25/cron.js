const pm2 = require('pm2');
const cron = require('node-cron');
const redis = require('redis');
const os = require('os');
const { sendNotification } = require('./notification');
const token = require('./device_tokens.json');
const { getDiskData } = require('./diskManage');

const APP_NAMES = ['App', 'Comtech-backend'];

const redisClient = redis.createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  },
});

const checkRedisStatus = async () => {
  try {
    await redisClient.connect();
    const pong = await redisClient.ping();
    await redisClient.disconnect();

    if (pong === 'PONG') {
      console.log('✅ Redis is running.');
    } else {
      throw new Error('Unexpected Redis response');
    }
  } catch (err) {
    console.warn(`⚠️ Redis is not running! Error: ${err.message}`);
    await sendNotification({
      title: `🚨 Redis DOWN`,
      body: `Redis server is not responding. Please check the server.`,
      device: token,
    });
  }
};

const diskAlertState = new Map();

function getNumberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function formatDiskLine(disk) {
  const percent = Number.isFinite(Number(disk.usePercent))
    ? Number(disk.usePercent).toFixed(2)
    : String(disk.usePercent);
  return `${disk.filesystem}: ${percent}% used (${disk.explorerText})`;
}

async function checkDiskUsageAndAlert() {
  const threshold = getNumberEnv("DISK_ALERT_THRESHOLD", 80);
  const repeatMinutes = getNumberEnv("DISK_ALERT_REPEAT_MINUTES", 360);
  const resetBelow = getNumberEnv("DISK_ALERT_RESET_BELOW", Math.max(threshold - 2, 0));
  const now = Date.now();
  const repeatMs = repeatMinutes * 60 * 1000;

  const disks = await getDiskData();
  const highDisks = disks.filter((d) => Number(d.usePercent) >= threshold);

  disks.forEach((d) => {
    const key = String(d.filesystem);
    if (Number(d.usePercent) < resetBelow) {
      const prev = diskAlertState.get(key);
      if (prev?.alerted) diskAlertState.set(key, { alerted: false, lastSentAt: prev.lastSentAt || 0 });
    }
  });

  const disksNeedingAlert = highDisks.filter((d) => {
    const key = String(d.filesystem);
    const state = diskAlertState.get(key) || { alerted: false, lastSentAt: 0 };
    if (!state.alerted) return true;
    return now - state.lastSentAt >= repeatMs;
  });

  if (disksNeedingAlert.length === 0) return;

  const hostname = os.hostname();
  const title = `🚨 Disk usage high (${threshold}%+) on ${hostname}`;
  const body = [
    `Disk usage crossed ${threshold}% on ${hostname}.`,
    ...highDisks.map((d) => formatDiskLine(d)),
    `Time: ${new Date().toISOString()}`,
  ].join("\n");

  const result = await sendNotification({ title, body, device: token });
  if (!result?.success) return;

  highDisks.forEach((d) => {
    const key = String(d.filesystem);
    diskAlertState.set(key, { alerted: true, lastSentAt: now });
  });
}

function startWatchCron() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏱️ Running watchdog check...');

    // Check Redis status
    await checkRedisStatus();

    // Check PM2 apps status
    pm2.connect((err) => {
      if (err) {
        console.error('❌ Could not connect to PM2:', err.message);
        return;
      }

      pm2.list((err, list) => {
        pm2.disconnect();
        if (err) {
          console.error('❌ Failed to get PM2 process list:', err.message);
          return;
        }

        APP_NAMES.forEach(async (appName) => {
          const target = list.find(proc => proc.name === appName);

          if (!target || target.pm2_env.status !== 'online') {
            console.warn(`⚠️ ${appName} is not running! Sending notification...`);
            await sendNotification({
              title: `🚨 ${appName} DOWN`,
              body: `The process "${appName}" is not running. Check the server.`,
              device: token
            });
          } else {
            console.log(`✅ ${appName} is running.`);
          }
        });
      });
    });
  });
}

function startDiskAlertCron() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await checkDiskUsageAndAlert();
    } catch (err) {
      console.error("Disk alert check failed:", err.message);
    }
  });
}

module.exports = { startWatchCron, startDiskAlertCron };
