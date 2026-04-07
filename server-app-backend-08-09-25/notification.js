const path = require("path");
const express = require("express");
const fs = require("fs");
const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");

const router = express.Router();
const DEVICE_TOKEN_FILE = path.join(__dirname, "device_tokens.json"); // safer pathing

// ✅ Firebase Admin Initialization
if (!admin.apps.length) {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Helper to read tokens
function readDeviceTokens() {
  try {
    const data = fs.readFileSync(DEVICE_TOKEN_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// ✅ Helper to write tokens
function writeDeviceTokens(tokens) {
  fs.writeFileSync(DEVICE_TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

// ✅ API to register device token
router.post("/device-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  const tokens = readDeviceTokens();
  if (tokens.includes(token)) {
    return res.status(200).json({ message: "Token already exists" });
  }

  tokens.push(token);
  try {
    writeDeviceTokens(tokens);
    res.status(201).json({ message: "Token added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save token" });
  }
});

// ✅ Send Notification Function
const sendNotification = async (data) => {
  const tokens = readDeviceTokens();

  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.log("No valid device tokens found.");
    return { success: false, error: "No valid device tokens" };
  }

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: data.title,
        body: data.body,
      },
    });

    console.log("Notification sent successfully:", response);
    return { success: true, response };
  } catch (err) {
    console.error("Error sending notification:", err);
    return { success: false, error: err };
  }
};

module.exports = {
  notificationRouter: router,
  sendNotification,
};
