const fs = require("fs");
const config = require("./config");

/**
 * Log a message to both console and log file
 * @param {string} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${config.DEVICE_ID}] ${message}\n`;

  // Log to console
  console.log(logEntry);

  // Log to file
  try {
    fs.appendFileSync(config.LOG_FILE, logEntry);
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

module.exports = { log };
