const express = require('express');
const mongoose = require('mongoose');
const pm2 = require('pm2');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const redis = require('redis');
const { exec } = require('child_process');
const path = require("path");
const fs = require("fs");
const { notificationRouter, sendNotification } = require('./notification');
const token = require('./device_tokens.json');
const { startWatchCron, startDiskAlertCron } = require('./cron');
const { fetchApiSetting } = require('./fetchApiSetting');
const { getDiskData } = require('./diskManage');
require('dotenv').config();

const app = express();
const PORT = 5081;
app.use(cors());
app.use(express.json());
// define the paths for the folders you want to monitor
const paths = {
  wl: 'D:/mongodb-backup/wl',
  comtech: 'D:/mongodb-backup/comtech'
};

const server = http.createServer(app);
// Initialize WebSocket server
const ws = new WebSocket.Server({ server });

startWatchCron(); // Start the cron job to monitor PM2 and Redis status
startDiskAlertCron();

// check whether there are redis server running or not
async function checkRedisStatus(host, port) {
  const client = redis.createClient({
    socket: {
      host,
      port,
      connectTimeout: 3000
    }
  });

  try {
    await client.connect();
    await client.ping();
    await client.quit();

    console.log(`Redis is running on ${host}:${port}`);
    return { status: 'up' };
  } catch (error) {
    sendNotification({
      title: 'Redis Down Alert',
      body: `Redis server down on ${host}:${port}. Please contact admin.`,
      
    }); 
    console.error(`Redis not reachable on ${host}:${port}:`, error.message);

    // Try to close the client if it's still open
    try {
      await client.quit();
    } catch (e) {
      // Ignore quit errors
    }

    return {
      status: 'down',
      error: error.message,
      details: {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall
      }
    };
  }
}

//  To check server status 
function formatStatus(list) {

  const stoppedProcesses = list.filter(proc => proc.pm2_env.status !== 'online');
  if (stoppedProcesses.length > 0) {
    console.warn(`Warning: ${stoppedProcesses.length} processes are stopped.`);
    stoppedProcesses.forEach(proc => {
      console.warn(`Process ${proc.name} (PID: ${proc.pid}) is stopped.`);
      sendNotification({
        title: 'Process Stopped Alert',
        body: `Process ${proc.name} (PID: ${proc.pid}) is stopped.`,
        device: token
      });
    });
  } 
    return list.map(proc => ({
      name: proc.name,
      status: proc.pm2_env.status,
      pid: proc.pid,
      memory: proc.monit.memory,
      cpu: proc.monit.cpu,
      uptime: proc.pm2_env.pm_uptime
    }));
  


}

// function checkIISStatus() {
//   return new Promise((resolve, reject) => {
//     const psCommand = `powershell -Command "Get-Website | Select-Object Name, State, PhysicalPath, Bindings | ConvertTo-Json"`;

//     exec(psCommand, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
//       if (error) {
//         console.error('IIS status error:', error.message);
//         console.error('IIS status stderr:', stderr); 

//         return resolve({ status: 'error', error: error.message, details: stderr });
//       }

//       if (!stdout || stdout.trim() === '') {
//         console.warn('IIS status: No output from Get-Website. This might mean no websites configured or another issue.');
//         return resolve({ status: 'success', sites: [] });
//       }

//       try {
//         const sites = JSON.parse(stdout);
//         const formattedSites = Array.isArray(sites) ? sites : [sites];

//         resolve({
//           status: 'success',
//           sites: formattedSites.map(site => ({
//             name: site.Name,
//             state: site.State,
//             path: site.PhysicalPath,
//             bindings: site.Bindings 
//           }))
//         });
//       } catch (err) {
//         console.error('IIS parse error: Failed to parse JSON output from PowerShell.', err.message);
//         console.error('Raw stdout:', stdout);
//         resolve({ status: 'error', error: 'Failed to parse IIS data', details: err.message, rawOutput: stdout });
//       }
//     });
//   });
// }

fetchApiSetting().then(result => {
  console.log("Final Output:", result);
});


// Function to get the latest folder in a directory

function getLatestFolder(directoryPath, callback) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${directoryPath}`, err);
      return callback(null);
    }

    let folders = [];
    let pending = files.length;
    if (!pending) return callback(null);

    files.forEach(file => {
      const fullPath = path.join(directoryPath, file);
      fs.stat(fullPath, (err, stats) => {
        if (!err && stats.isDirectory()) {
          folders.push({ name: file, mtime: stats.mtime });
        }
        if (!--pending) {
          if (folders.length === 0) return callback(null);

          folders.sort((a, b) => b.mtime - a.mtime);
          callback(folders[0]); // latest
        }
      });
    });
  });
}

// asynchronous wrapper for getLatestFolder
const getLatestFolderAsync = (directoryPath) => {
  return new Promise((resolve) => {
    getLatestFolder(directoryPath, (folder) => {
      resolve(folder); // resolves with the result (or null)
    });
  });
};



// Endpoint to get the status of PM2, Redis, and folder info
app.get('/status', async (req, res) => {
  console.log("GET /status");

  try {
    // Redis status
    const redisData = await checkRedisStatus('127.0.0.1', 6379);
    if (redisData.status !== 'up') {
      sendNotification({
        title: 'Redis Down Alert',
        body: 'Redis server down please contact admin',
        device: token
      })
      console.error('Redis is down, returning partial status');
    }
    // PM2 status
    const pm2Data = await new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          console.error('PM2 connection error:', err);
          return reject(err);
        }

        pm2.list((err, list) => {
          pm2.disconnect();
          if (err) {
            console.error('PM2 list error:', err);
            return reject(err);
          }
          resolve(formatStatus(list));
        });
      });
    });

    // Get folder info in parallel
    const [latestWl, latestComtech] = await Promise.all([
      getLatestFolderAsync(paths.wl),
      getLatestFolderAsync(paths.comtech)
    ]);

    const diskData = await getDiskData();
console.log(diskData, 'diskData')
    // Structure folder data
    const result = {
      wlName: latestWl?.name || null,
      wlModifiedAt: latestWl
        ? latestWl.mtime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
        : null,
      comtechName: latestComtech?.name || null,
      comtechModifiedAt: latestComtech
        ? latestComtech.mtime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' })
        : null
    };

    // Send full response
    res.json({
      pm2: pm2Data,
      redis: redisData,
      folders: { ...result },
      disks: diskData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Status check error:', error.message);

    // Try to still get redis info
    const redisData = await checkRedisStatus('127.0.0.1', 6379);

    res.status(500).json({
      error: 'Failed to retrieve status',
      details: error.message,
      pm2: null,
      redis: redisData,
      timestamp: new Date().toISOString(),
    });
  }
})


// websocket to send status of pm2, redis, and folder info on specific time intervals
ws.on('connection', ws => {
  console.log('WebSocket client connected');
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const sendStatus = async () => {
    try {
      const redisStatus = await checkRedisStatus('127.0.0.1', 6379);

      const pm2Status = await new Promise((resolve, reject) => {
        pm2.connect(err => {
          if (err) {
            console.error('PM2 connection error:', err);
            return reject(err);
          }

          pm2.list((err, list) => {
            pm2.disconnect();
            if (err) {
              console.error('PM2 list error:', err);
              return reject(err);
            }
            resolve(formatStatus(list));
          });
        });
      });

      // Get latest folders
      const [latestWl, latestComtech] = await Promise.all([
        getLatestFolderAsync(paths.wl),
        getLatestFolderAsync(paths.comtech),
      ]);

      const diskData = await getDiskData();

      // Flattened structure
      const folderData = {
        wlName: latestWl?.name || null,
        wlModifiedAt: latestWl
          ? latestWl.mtime.toLocaleString('en-IN', { timeZone: 'Asia/Dubai' })
          : null,
        comtechName: latestComtech?.name || null,
        comtechModifiedAt: latestComtech
          ? latestComtech.mtime.toLocaleString('en-IN', { timeZone: 'Asia/Dubai' })
          : null
      };

      // Send combined status
      ws.send(JSON.stringify({
        type: 'status_update',
        data: {
          timestamp: new Date().toISOString(),
          pm2: pm2Status,
          redis: redisStatus,
          disks: diskData,
           ...folderData 
        }
      }));

    } catch (err) {
      console.error('Status update error:', err);
      const redisStatus = await checkRedisStatus('127.0.0.1', 6379);
      ws.send(JSON.stringify({
        type: 'status_update',
        data: {
          timestamp: new Date().toISOString(),
          pm2: null,
          redis: redisStatus,
          error: err.message
        }
      }));
    }
  };


  sendStatus();
  const statusInterval = setInterval(sendStatus, 10000);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'get_status') {
        sendStatus();
      }
    } catch (err) {
      console.error('Error handling client message:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(statusInterval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(statusInterval);
  });
});

// Add WebSocket server heartbeat
const heartbeat = setInterval(() => {
  ws.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Check every 30 seconds

ws.on('close', () => {
  clearInterval(heartbeat);
});



app.use('/notification', notificationRouter);

mongoose.connect(
  process.env.MONGO_URL_COMTECH
).then(() => console.log("DB connection successful"))
  .catch((err) => {
    console.log(err)
  })


server.listen(PORT, '0.0.0.0', () => {
  console.log(` PM2 + Redis status server running on port ${PORT}`);
});
