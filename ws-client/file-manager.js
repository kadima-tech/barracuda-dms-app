const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const config = require("./config");
const { log } = require("./logger");

// Track the current displayed URL
let currentDisplayedUrl = "";
// Reference to scheduler module (set later to avoid circular dependency)
let schedulerModule = null;

/**
 * Sets the scheduler module reference
 * @param {Object} scheduler - The scheduler module
 */
function setSchedulerModule(scheduler) {
  schedulerModule = scheduler;
}

/**
 * Ensures the cache directory exists
 */
function ensureCacheDirectory() {
  if (!fs.existsSync(config.CACHE_DIR)) {
    try {
      fs.mkdirSync(config.CACHE_DIR, { recursive: true });
      log(`Created cache directory: ${config.CACHE_DIR}`);
    } catch (error) {
      log(`Error creating cache directory: ${error}`);
    }
  }
}

/**
 * Updates the browser URL and signals the kiosk to reload
 * @param {string} newUrl - The new URL to display
 */
function updateBrowserUrl(newUrl) {
  try {
    currentDisplayedUrl = newUrl; // Store the current URL
    fs.writeFileSync("/home/pi/current_url.txt", newUrl);
    log(`New URL written to file: ${newUrl}`);
    // Signal the kiosk script to reload
    fs.writeFileSync("/home/pi/reload_flag", "reload");
    log("Reload flag set");
  } catch (error) {
    log(`Error updating browser URL: ${error}`);
  }
}

/**
 * Tests if the URL has changed
 */
function testUrlChange() {
  try {
    if (fs.existsSync("/home/pi/current_url.txt")) {
      const storedUrl = fs
        .readFileSync("/home/pi/current_url.txt", "utf8")
        .trim();
      log(`Current URL from file: ${storedUrl}`);

      if (storedUrl !== currentDisplayedUrl) {
        log(
          `URL mismatch detected: file=${storedUrl}, memory=${currentDisplayedUrl}`
        );
        currentDisplayedUrl = storedUrl;
      }
    }
  } catch (error) {
    log(`Error testing URL change: ${error}`);
  }
}

/**
 * Downloads a file from a URL
 * @param {string} url - The URL of the file to download
 * @param {string} filePath - The path to save the file to
 * @param {string} scheduleId - The ID of the schedule
 * @returns {Promise<string>} - A promise that resolves with the file path when download is complete
 */
function downloadFile(url, filePath, scheduleId, progressCallback) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const protocol = url.startsWith("https") ? https : http;
    let receivedBytes = 0;
    let totalBytes = 0;

    const req = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      totalBytes = parseInt(response.headers["content-length"], 10);
      response.pipe(file);

      response.on("data", (chunk) => {
        receivedBytes += chunk.length;
        const progress = (receivedBytes / totalBytes) * 100;

        if (progressCallback) {
          progressCallback(scheduleId, Math.round(progress));
        }
      });

      file.on("finish", () => {
        file.close();
        resolve(filePath);
      });
    });

    req.on("error", (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });

    file.on("error", (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

/**
 * Cleans up old cached content
 */
function cleanupCachedContent() {
  try {
    if (!schedulerModule) {
      log("Scheduler module not set, skipping cleanup");
      return;
    }

    const files = fs.readdirSync(config.CACHE_DIR);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(config.CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      // Extract scheduleId from filename (removes file extension)
      const scheduleId = path.parse(file).name;

      // Files older than 24 hours and not in active schedules should be removed
      if (fileAge > 24 * 60 * 60 * 1000) {
        const isActiveSchedule = schedulerModule.isScheduleActive(scheduleId);

        if (!isActiveSchedule) {
          fs.unlinkSync(filePath);
          log(`Removed old cached file: ${file}`);
        } else {
          log(`Keeping file ${file} (active schedule)`);
        }
      } else {
        log(`Keeping file ${file} (recent file)`);
      }
    });
  } catch (error) {
    log(`Error cleaning up cached content: ${error}`);
  }
}

/**
 * Get the current displayed URL
 * @returns {string} - The current URL being displayed
 */
function getCurrentDisplayedUrl() {
  return currentDisplayedUrl;
}

module.exports = {
  ensureCacheDirectory,
  updateBrowserUrl,
  testUrlChange,
  downloadFile,
  cleanupCachedContent,
  getCurrentDisplayedUrl,
  setSchedulerModule,
};
