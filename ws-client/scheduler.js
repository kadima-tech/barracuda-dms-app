const path = require("path");
const fileManager = require("./file-manager");
const { log } = require("./logger");

// Map of active schedules
const schedules = new Map();
// Map of active downloads
const activeDownloads = new Map();

/**
 * Handles a cache request for content scheduling
 * @param {Object} data - The cache request data
 * @param {string} data.scheduleId - The ID of the schedule
 * @param {string} data.videoUrl - The URL of the video to cache
 * @param {string} data.scheduleTime - The time to schedule the content
 * @param {number} data.cacheDuration - The duration to cache the content
 * @param {Function} progressCallback - Callback function to report progress
 */
async function handleCacheRequest(data, progressCallback) {
  const { scheduleId, videoUrl, scheduleTime, cacheDuration } = data;
  log(`Received cache request for schedule ${scheduleId}: ${videoUrl}`);

  const fileExtension = path.extname(videoUrl) || ".mp4";
  const cacheFilePath = path.join(
    require("./config").CACHE_DIR,
    `${scheduleId}${fileExtension}`
  );

  try {
    if (activeDownloads.has(scheduleId)) {
      log(`Already downloading content for schedule ${scheduleId}`);
      return;
    }

    activeDownloads.set(scheduleId, true);

    // Notify about download start
    if (progressCallback) {
      progressCallback(scheduleId, 0, "downloading");
    }

    // Download the file
    await fileManager.downloadFile(
      videoUrl,
      cacheFilePath,
      scheduleId,
      (id, progress) => {
        if (progressCallback) {
          progressCallback(id, progress, "downloading");
        }
      }
    );

    // Notify about download completion
    if (progressCallback) {
      progressCallback(scheduleId, 100, "complete");
    }

    // Schedule content playback
    scheduleContent(scheduleId, cacheFilePath, scheduleTime);
  } catch (error) {
    log(`Error caching content for schedule ${scheduleId}: ${error.message}`);

    if (progressCallback) {
      progressCallback(scheduleId, 0, "error");
    }
  } finally {
    activeDownloads.delete(scheduleId);
  }
}

/**
 * Schedules content to play at the specified time
 * @param {string} scheduleId - The ID of the schedule
 * @param {string} filePath - The path to the content file
 * @param {string} scheduleTime - The time to play the content
 */
function scheduleContent(scheduleId, filePath, scheduleTime) {
  const scheduledTime = new Date(scheduleTime).getTime();
  const now = Date.now();
  const delay = scheduledTime - now;

  if (delay < 0) {
    log(`Schedule ${scheduleId} is in the past, playing immediately`);
    playContent(filePath);
    return;
  }

  log(`Scheduling content for ${scheduleTime} (in ${delay}ms)`);

  schedules.set(
    scheduleId,
    setTimeout(() => {
      playContent(filePath);
      schedules.delete(scheduleId);
    }, delay)
  );
}

/**
 * Plays the specified content
 * @param {string} filePath - The path to the content file
 */
function playContent(filePath) {
  log(`Playing content: ${filePath}`);
  fileManager.updateBrowserUrl(`file://${filePath}`);
}

/**
 * Cancels a scheduled content
 * @param {string} scheduleId - The ID of the schedule to cancel
 */
function cancelSchedule(scheduleId) {
  const timeout = schedules.get(scheduleId);
  if (timeout) {
    clearTimeout(timeout);
    schedules.delete(scheduleId);
    log(`Schedule ${scheduleId} cancelled`);
    return true;
  }
  return false;
}

/**
 * Checks if a schedule is active
 * @param {string} scheduleId - The ID of the schedule to check
 * @returns {boolean} - True if the schedule is active, false otherwise
 */
function isScheduleActive(scheduleId) {
  return schedules.has(scheduleId);
}

/**
 * Gets all active schedules
 * @returns {string[]} - Array of active schedule IDs
 */
function getActiveSchedules() {
  return Array.from(schedules.keys());
}

/**
 * Gets all active downloads
 * @returns {string[]} - Array of active download IDs
 */
function getActiveDownloads() {
  return Array.from(activeDownloads.keys());
}

module.exports = {
  handleCacheRequest,
  scheduleContent,
  playContent,
  cancelSchedule,
  isScheduleActive,
  getActiveSchedules,
  getActiveDownloads,
};
