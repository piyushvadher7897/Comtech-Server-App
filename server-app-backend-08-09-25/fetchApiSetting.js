const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Directory to save logs
const LOG_DIR = path.join(__dirname, 'logs');
const SUCCESS_FILE = path.join(LOG_DIR, 'apiResponse.json');
const ERROR_FILE = path.join(LOG_DIR, 'jsonerror.json');

// Ensure directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function fetchApiSetting() {
  const url = "https://appapi.comtechgold.com/api/setting";

  try {
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    // Save success response
    fs.writeFileSync(SUCCESS_FILE, JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      data
    }, null, 2));

    console.log("✅ API response saved:", SUCCESS_FILE);
    return data;

  } catch (error) {
    const statusCode = error.response?.status || 500;

    const errorData = {
      success: false,
      timestamp: new Date().toISOString(),
      statusCode,
      message: error.message,
      details: error.response?.data || "No response data"
    };

    // Save only in one file
    fs.writeFileSync(ERROR_FILE, JSON.stringify(errorData, null, 2));

    console.error("❌ API error saved in:", ERROR_FILE);
    return errorData;
  }
}

module.exports = { fetchApiSetting };
