const http = require("http");
const https = require("https");
const io = require("socket.io-client");
const config = require("./config");
const metrics = require("./metrics");
const scheduler = require("./scheduler");
const fileManager = require("./file-manager");
const { log } = require("./logger");

// Connection state variables
let socket = null;
let isConnecting = false;
let heartbeatInterval = null;
let reconnectAttempts = 0;

/**
 * Checks if the server is available
 * @param {Function} callback - Callback function (err, statusCode)
 */
function checkServerStatus(callback) {
  const url = new URL(config.SERVER_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === "https:" ? 443 : 80),
    path: "/health",
    method: "GET",
    timeout: 5000,
  };

  const protocol = url.protocol === "https:" ? https : http;

  const req = protocol.request(options, (res) => {
    callback(null, res.statusCode);
  });

  req.on("error", (err) => {
    callback(err);
  });

  req.on("timeout", () => {
    req.destroy();
    callback(new Error("Request timed out"));
  });

  req.end();
}

/**
 * Reconnects to the server after a delay
 */
function reconnect() {
  log(
    `Scheduling reconnection in ${config.RECONNECT_INTERVAL / 1000} seconds...`
  );
  stopHeartbeat();
  setTimeout(connectToServer, config.RECONNECT_INTERVAL);
}

/**
 * Starts heartbeat for regular server updates
 */
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    if (socket && socket.connected) {
      // Log the current URL before sending heartbeat
      log(
        `Current displayed URL before heartbeat: ${fileManager.getCurrentDisplayedUrl()}`
      );

      const heartbeatData = {
        deviceId: config.DEVICE_ID,
        ...metrics.collectAllMetrics(),
        activeDownloads: scheduler.getActiveDownloads(),
        activeSchedules: scheduler.getActiveSchedules(),
        currentUrl: fileManager.getCurrentDisplayedUrl(),
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

/**
 * Stops the heartbeat interval
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Initializes socket connection and event handlers
 */
function initializeSocketConnection() {
  if (socket) {
    socket.disconnect();
  }

  log(`Connecting to socket server at ${config.SOCKET_URL}...`);

  // Initialize socket connection
  socket = io(config.SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: false, // We'll handle reconnection manually
    query: {
      deviceId: config.DEVICE_ID,
    },
  });

  // Connection event
  socket.on("connect", () => {
    log(`Connected to server with ID: ${socket.id}`);
    isConnecting = false;
    reconnectAttempts = 0;

    // Send device registration
    socket.emit(
      "registerDevice",
      {
        deviceId: config.DEVICE_ID,
      },
      (response) => {
        if (response && response.status === "success") {
          log("Device registered successfully");
        } else {
          log(`Device registration failed: ${JSON.stringify(response)}`);
        }
      }
    );

    // Start heartbeat after successful connection
    startHeartbeat();
  });

  // Disconnection event
  socket.on("disconnect", (reason) => {
    log(`Disconnected from server: ${reason}`);
    stopHeartbeat();
    reconnect();
  });

  // Error event
  socket.on("connect_error", (error) => {
    log(`Connection error: ${error.message}`);
    isConnecting = false;

    if (reconnectAttempts < config.MAX_RETRIES) {
      reconnectAttempts++;
      reconnect();
    } else {
      log(
        "Maximum reconnection attempts reached. Stopping reconnection attempts."
      );
    }
  });

  // Content update event
  socket.on("contentUpdate", (data) => {
    log(`Received content update: ${JSON.stringify(data)}`);
    fileManager.updateBrowserUrl(data.url);
  });

  // Cache request event
  socket.on("cacheRequest", (data) => {
    log(`Received cache request: ${JSON.stringify(data)}`);
    scheduler.handleCacheRequest(data, (scheduleId, progress, status) => {
      socket.emit("cacheProgress", {
        scheduleId,
        deviceId: config.DEVICE_ID,
        progress,
        status,
      });
    });
  });

  // Cancel schedule event
  socket.on("cancelSchedule", (data) => {
    log(`Received cancel schedule request: ${JSON.stringify(data)}`);
    const { scheduleId } = data;
    const cancelled = scheduler.cancelSchedule(scheduleId);

    socket.emit("scheduleStatus", {
      deviceId: config.DEVICE_ID,
      scheduleId,
      status: cancelled ? "cancelled" : "not_found",
    });
  });
}

/**
 * Connects to the server
 */
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
      log(`Retrying in ${config.RECONNECT_INTERVAL / 1000} seconds...`);
      isConnecting = false;

      if (reconnectAttempts < config.MAX_RETRIES) {
        reconnectAttempts++;
        setTimeout(connectToServer, config.RECONNECT_INTERVAL);
      } else {
        log(
          "Maximum reconnection attempts reached. Stopping reconnection attempts."
        );
      }
    } else {
      log(`Server health check status: ${statusCode}`);
      initializeSocketConnection();
    }
  });
}

/**
 * Gets the socket instance
 * @returns {Object|null} - The socket instance or null if not connected
 */
function getSocket() {
  return socket;
}

/**
 * Checks if the socket is connected
 * @returns {boolean} - True if connected, false otherwise
 */
function isConnected() {
  return socket && socket.connected;
}

module.exports = {
  connectToServer,
  reconnect,
  startHeartbeat,
  stopHeartbeat,
  getSocket,
  isConnected,
};
