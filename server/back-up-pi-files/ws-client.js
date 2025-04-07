// /home/pi/ws-client/ws-client.js
const io = require("socket.io-client");
const { exec, execSync } = require("child_process");
const os = require("os");
const http = require("http");
const fs = require("fs");
const https = require("https");
const path = require("path");

const DEVICE_ID = process.env.DEVICE_ID || "10000000048ec222";

//DEV
const SOCKET_URL = "http://192.168.178.17:8081";
const RECONNECT_INTERVAL = 5000; // 5 seconds
const CACHE_DIR = "/home/pi/cached_content";

let socket;
let heartbeatInterval;
let urls = [];
let currentUrlIndex = 0;
let isConnecting = false;
let activeDownloads = new Map(); // Track active downloads
let schedules = new Map(); // Track active schedules
let currentDisplayedUrl = null;

try {
  if (fs.existsSync("/home/pi/current_url.txt")) {
    currentDisplayedUrl = fs
      .readFileSync("/home/pi/current_url.txt", "utf8")
      .trim();
    log(`Initialized current URL from file: ${currentDisplayedUrl}`);
  }
} catch (error) {
  log(`Error reading stored URL: ${error}`);
}

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync("ws-client.log", logMessage);
}

function createSocket() {
  return io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ["websocket", "polling"],
  });
}

function checkServerStatus(callback) {
  const healthUrl = `${SOCKET_URL}/health`;
  log(`Checking server health at: ${healthUrl}`);

  http
    .get(healthUrl)
    .on("response", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        log(`Health check response: ${data}`);
        callback(null, res.statusCode);
      });
    })
    .on("error", (err) => {
      log(`Health check failed: ${err.message}`);
      callback(err);
    });
}

function connectToServer() {
  if (isConnecting) {
    log(
      "Already attempting to connect. Skipping redundant connection attempt."
    );
    return;
  }

  isConnecting = true;
  log("Attempting to connect to server...");
  checkServerStatus((err, statusCode) => {
    if (err) {
      log(`Server unreachable: ${err.message}`);
      log(`Retrying in ${RECONNECT_INTERVAL / 1000} seconds...`);
      isConnecting = false;
      setTimeout(connectToServer, RECONNECT_INTERVAL);
    } else {
      log(`Server health check status: ${statusCode}`);
      initializeSocketConnection();
    }
  });
}

function updateBrowserUrl(newUrl) {
  try {
    fs.writeFileSync("/home/pi/current_url.txt", newUrl);
    log(`New URL written to file: ${newUrl}`);

    // Signal the kiosk script to reload
    fs.writeFileSync("/home/pi/reload_flag", "reload");
    log("Reload flag set");
  } catch (error) {
    log(`Error updating browser URL: ${error}`);
  }
}

function switchToNextUrl() {
  currentUrlIndex = (currentUrlIndex + 1) % urls.length;
  const newUrl = urls[currentUrlIndex];
  log(`Switching to next URL: ${newUrl}`);
  updateBrowserUrl(newUrl);
}

// Test function to simulate URL change
function testUrlChange() {
  log("Testing URL change");
  if (urls.length > 0) {
    switchToNextUrl();
  } else {
    log("No URLs available");
  }
}

function initializeSocketConnection() {
  log("Initializing socket connection...");
  if (socket) {
    socket.removeAllListeners();
    socket.close();
  }

  socket = createSocket();

  socket.on("connect", () => {
    isConnecting = false;
    log(`Connected to DMS Socket.IO server with ID: ${socket.id}`);

    // Register device with server
    log(`Attempting to register device with ID: ${DEVICE_ID}`);
    socket.emit("register", { deviceId: DEVICE_ID }, (response) => {
      if (response) {
        log(`Registration response: ${JSON.stringify(response)}`);
        if (response.status === "success") {
          startHeartbeat();
        }
      } else {
        log("No registration response received");
      }
    });
  });

  socket.on("registerResponse", (response) => {
    log(`Received register response: ${JSON.stringify(response)}`);
  });

  socket.on("displayUrl", (data) => {
    log(`Received URL update: ${JSON.stringify(data)}`);
    if (data.url) {
      if (data.active) {
        currentDisplayedUrl = data.url;
        log(`Updated currentDisplayedUrl to: ${currentDisplayedUrl}`); // Add this log
        updateBrowserUrl(data.url);
      } else {
        currentDisplayedUrl = null;
        log("Cleared currentDisplayedUrl"); // Add this log
        updateBrowserUrl("about:blank");
      }
      socket.emit("urlReceived", { url: data.url, active: data.active });
    }
  });

  socket.on("connect_error", (error) => {
    log(`Connection error: ${error.message}`);
    reconnect();
  });

  socket.on("disconnect", (reason) => {
    log(`Disconnected from server. Reason: ${reason}`);
    stopHeartbeat();
    isConnecting = false;
    reconnect();
  });

  socket.on("error", (error) => {
    log(`Socket error: ${error.message}`);
  });

  socket.on("reboot", () => {
    log("Reboot command received. Rebooting the device...");
    exec("sudo reboot");
  });

  socket.on("changeUrl", (newUrl) => {
    log(`Received new URL: ${newUrl}`);
    if (newUrl === "next") {
      switchToNextUrl();
    } else {
      updateBrowserUrl(newUrl);
    }
  });

  socket.on("cacheContent", (data) => {
    log(`Received cache request: ${JSON.stringify(data)}`);
    handleCacheRequest(data);
  });

  socket.on("cancelSchedule", (scheduleId) => {
    log(`Received cancel request for schedule: ${scheduleId}`);
    cancelSchedule(scheduleId);
  });

  log("Attempting to connect socket...");
  socket.connect();
}

// Update the updateBrowserUrl function to store the current URL
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

function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      // Log the current URL before sending heartbeat
      log(`Current displayed URL before heartbeat: ${currentDisplayedUrl}`);

      const heartbeatData = {
        deviceId: DEVICE_ID,
        temperature: getTemperature(),
        uptime: getUptime(),
        cpuLoad: getCpuLoad(),
        memoryUsage: getMemoryUsage(),
        diskUsage: getDiskUsage(),
        activeDownloads: Array.from(activeDownloads.keys()),
        activeSchedules: Array.from(schedules.keys()),
        currentUrl: currentDisplayedUrl,
      };

      log(`Sending heartbeat with data: ${JSON.stringify(heartbeatData)}`);
      socket.emit("heartbeat", heartbeatData, (response) => {
        if (response) {
          log(`Heartbeat response: ${JSON.stringify(response)}`);
        }
      });
    }
  }, 5000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

function getTemperature() {
  try {
    // Method 1: Raspberry Pi specific
    const temp1 = execSync("vcgencmd measure_temp").toString().trim();
    const result1 = parseFloat(temp1.replace("temp=", "").replace("'C", ""));
    if (!isNaN(result1)) return result1;

    // Method 2: Generic Linux
    const temp2 = execSync("cat /sys/class/thermal/thermal_zone0/temp")
      .toString()
      .trim();
    const result2 = parseFloat(temp2) / 1000;
    if (!isNaN(result2)) return result2;

    // Method 3: Another generic approach
    const temp3 = execSync("sensors | grep 'Core 0' | awk '{print $3}'")
      .toString()
      .trim();
    const result3 = parseFloat(temp3.replace("+", "").replace("  C", ""));
    if (!isNaN(result3)) return result3;

    throw new Error("All temperature measurement methods failed");
  } catch (error) {
    log(`Error getting temperature: ${error}`);
    return null;
  }
}

function getUptime() {
  try {
    // Method 1: Node.js built-in
    const uptime1 = process.uptime();
    if (!isNaN(uptime1)) return uptime1;

    // Method 2: OS module
    const uptime2 = os.uptime();
    if (!isNaN(uptime2)) return uptime2;

    // Method 3: Reading from /proc/uptime
    const uptime3 = parseFloat(
      execSync("awk '{print $1}' /proc/uptime").toString().trim()
    );
    if (!isNaN(uptime3)) return uptime3;

    throw new Error("All uptime measurement methods failed");
  } catch (error) {
    log(`Error getting uptime: ${error}`);
    return null;
  }
}

function getCpuLoad() {
  try {
    // Method 1: top command
    const load1 = parseFloat(
      execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'")
        .toString()
        .trim()
    );
    if (!isNaN(load1)) return load1;

    // Method 2: mpstat command
    const load2 = parseFloat(
      execSync("mpstat 1 1 | awk '$12 ~ /[0-9.]+/ { print 100 - $12 }'")
        .toString()
        .trim()
    );
    if (!isNaN(load2)) return load2;

    // Method 3: OS module (average load over 1 minute)
    const load3 = os.loadavg()[0];
    if (!isNaN(load3)) return load3 * 100;

    throw new Error("All CPU load measurement methods failed");
  } catch (error) {
    log(`Error getting CPU load: ${error}`);
    return null;
  }
}

function getMemoryUsage() {
  try {
    // Method 1: free command
    const mem1 = parseFloat(
      execSync("free | grep Mem | awk '{print $3/$2 * 100.0}'")
        .toString()
        .trim()
    );
    if (!isNaN(mem1)) return mem1;

    // Method 2: Another free command approach
    const mem2 = parseFloat(
      execSync("free -m | awk 'NR==2{printf \"%.2f\", $3*100/$2 }'")
        .toString()
        .trim()
    );
    if (!isNaN(mem2)) return mem2;

    // Method 3: OS module
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const mem3 = ((totalMem - freeMem) / totalMem) * 100;
    if (!isNaN(mem3)) return mem3;

    throw new Error("All memory usage measurement methods failed");
  } catch (error) {
    log(`Error getting memory usage: ${error}`);
    return null;
  }
}
function getDiskUsage() {
  try {
    // Method 1: df command
    const disk1 = parseFloat(
      execSync("df -h / | awk 'NR==2 {print $5}'")
        .toString()
        .trim()
        .replace("%", "")
    );
    if (!isNaN(disk1)) return disk1;

    // Method 2: Another df command approach
    const disk2 = parseInt(
      execSync('df -h / | awk \'$NF=="/"{printf "%d", $5}\'').toString().trim()
    );
    if (!isNaN(disk2)) return disk2;

    // Method 3: du command (might be slow on large filesystems)
    const disk3 = parseFloat(
      execSync("du -sh / | awk '{print $1}'").toString().trim().replace("G", "")
    );
    if (!isNaN(disk3)) return (disk3 / os.totalmem()) * 1e9 * 100;

    throw new Error("All disk usage measurement methods failed");
  } catch (error) {
    log(`Error getting disk usage: ${error}`);
    return null;
  }
}
function reconnect() {
  log(`Scheduling reconnection in ${RECONNECT_INTERVAL / 1000} seconds...`);
  stopHeartbeat();
  setTimeout(connectToServer, RECONNECT_INTERVAL);
}

function downloadFile(url, filePath, scheduleId) {
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

        socket.emit("cacheProgress", {
          scheduleId,
          deviceId: DEVICE_ID,
          progress: Math.round(progress),
          status: "downloading",
        });
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

async function handleCacheRequest(data) {
  const { scheduleId, videoUrl, scheduleTime, cacheDuration } = data;
  log(`Received cache request for schedule ${scheduleId}: ${videoUrl}`);

  const fileExtension = path.extname(videoUrl) || ".mp4";
  const cacheFilePath = path.join(CACHE_DIR, `${scheduleId}${fileExtension}`);

  try {
    if (activeDownloads.has(scheduleId)) {
      log(`Already downloading content for schedule ${scheduleId}`);
      return;
    }

    activeDownloads.set(scheduleId, true);

    socket.emit("cacheProgress", {
      scheduleId,
      deviceId: DEVICE_ID,
      progress: 0,
      status: "downloading",
    });

    await downloadFile(videoUrl, cacheFilePath, scheduleId);

    socket.emit("cacheProgress", {
      scheduleId,
      deviceId: DEVICE_ID,
      progress: 100,
      status: "complete",
    });

    scheduleContent(scheduleId, cacheFilePath, scheduleTime);
  } catch (error) {
    log(`Error caching content for schedule ${scheduleId}: ${error.message}`);
    socket.emit("cacheProgress", {
      scheduleId,
      deviceId: DEVICE_ID,
      progress: 0,
      status: "error",
    });
  } finally {
    activeDownloads.delete(scheduleId);
  }
}

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

function playContent(filePath) {
  log(`Playing content: ${filePath}`);
  updateBrowserUrl(`file://${filePath}`);
}

function cancelSchedule(scheduleId) {
  const timeout = schedules.get(scheduleId);
  if (timeout) {
    clearTimeout(timeout);
    schedules.delete(scheduleId);
    log(`Schedule ${scheduleId} cancelled`);
  }
}

function cleanupCachedContent() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      // Extract scheduleId from filename (removes file extension)
      const scheduleId = path.parse(file).name;

      // Check if file is older than 24 hours AND not associated with any active schedule
      if (fileAge > 24 * 60 * 60 * 1000 && !schedules.has(scheduleId)) {
        fs.unlinkSync(filePath);
        log(`Removed old cached file: ${file}`);
      } else {
        log(
          `Keeping file ${file} (${
            schedules.has(scheduleId) ? "active schedule" : "recent file"
          })`
        );
      }
    });
  } catch (error) {
    log(`Error cleaning up cached content: ${error}`);
  }
}

// Start the connection process
connectToServer();
setInterval(testUrlChange, 30000);
setInterval(cleanupCachedContent, 60 * 60 * 1000); // Run cleanup every hour
