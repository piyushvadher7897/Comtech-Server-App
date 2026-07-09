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
    console.log("[server-app-notification] No device tokens in device_tokens.json");
    return { success: false, error: "No valid device tokens" };
  }

  console.log("[server-app-notification] Sending to", tokens.length, "device(s)");

  const sanitizedData = {};
  if (data.data && typeof data.data === "object") {
    for (const [key, value] of Object.entries(data.data)) {
      if (value == null) continue;
      sanitizedData[key] =
        typeof value === "string" ? value : String(value);
    }
  }

  try {
    const message = {
      tokens,
      notification: {
        title: data.title,
        body: data.body,
      },
    };

    if (Object.keys(sanitizedData).length) {
      message.data = sanitizedData;
    }

    const response = await getMessaging().sendEachForMulticast(message);

    console.log("[server-app-notification] Sent:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    return { success: true, response };
  } catch (err) {
    console.error("[server-app-notification] Error:", err.message || err);
    return { success: false, error: err.message || err };
  }
};

router.post("/send", async (req, res) => {
  const { title, body, data } = req.body || {};
  console.log("[server-app-notification] POST /send", { title, body });

  if (!title || !body) {
    return res.status(400).json({ success: false, error: "Title and body are required" });
  }

  const result = await sendNotification({ title, body, data });
  const statusCode = result.success ? 200 : 500;
  return res.status(statusCode).json(result);
});

module.exports = {
  notificationRouter: router,
  sendNotification,
};
