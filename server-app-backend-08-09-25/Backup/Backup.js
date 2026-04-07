const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("./Mailer");

// Constants for each database
const BACKUP_CONFIGS = [
  {
    name: "comtech",
    uri: "mongodb+srv://comtechgoldapp:comTechGold2023@comtech.ubqnapp.mongodb.net/comtech",
    backupDir: "D:/mongodb-backup/comtech",
  },
  {
    name: "whitelabel_cgo",
    uri: "mongodb://127.0.0.1:27017/whitelabel_cgo", // Replace with actual URI if different
    backupDir: "D:/mongodb-backup/wl",
  },
];

const MONGODUMP_PATH = `"C:/Program Files (x86)/mongodb-database-tools/bin/mongodump"`;

// Utility function to back up a single DB
function backupDatabase({ name, uri, backupDir }) {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `${name}-backup-${timestamp}`);
  const dumpCommand = `${MONGODUMP_PATH} --uri="${uri}" --out="${backupPath}"`;




  console.log(`📦 Starting backup for: ${name}...`);

  exec(dumpCommand, (error, stdout, stderr) => {
    const endTimeIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false
    });

    if (error) {
      const errorMsg = `❌ Backup failed for ${name} on ${endTimeIST}\nError: ${error.message}`;
      console.error(errorMsg);
      sendEmail(`❌ MongoDB Backup Failed: ${name}`, errorMsg);
      return;
    }

    if (stderr) {
      console.warn(`⚠️ stderr for ${name}:`, stderr);
    }

    const successMsg = `✅ Backup completed for ${name} at: ${backupPath}\nFinished on: ${endTimeIST}`;
    console.log(successMsg);
    sendEmail(`✅ MongoDB Backup Success: ${name}`, successMsg);
  });
}

// Run backups in parallel
BACKUP_CONFIGS.forEach(config => backupDatabase(config));
