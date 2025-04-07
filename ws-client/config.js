const os = require("os");
const path = require("path");
const fs = require("fs");

// Configuration constants
const DEVICE_ID =
  process.env.DEVICE_ID ||
  "DEVICE_" + Math.random().toString(36).substring(2, 10);
const SERVER_URL = process.env.SERVER_URL || "http://192.168.2.128:8085";
const SOCKET_URL = process.env.SOCKET_URL || "http://192.168.2.128:8085";
const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, "../cache");
const LOG_FILE =
  process.env.LOG_FILE || path.join(__dirname, "../logs/ws-client.log");
const RECONNECT_INTERVAL = parseInt(process.env.RECONNECT_INTERVAL, 10) || 5000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES, 10) || 10;

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

module.exports = {
  DEVICE_ID,
  SERVER_URL,
  SOCKET_URL,
  CACHE_DIR,
  LOG_FILE,
  RECONNECT_INTERVAL,
  MAX_RETRIES,
};
