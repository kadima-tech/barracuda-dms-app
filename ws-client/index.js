// Main entry point for the WebSocket client
const socketManager = require("./socket-manager");
const metrics = require("./metrics");
const fileManager = require("./file-manager");
const scheduler = require("./scheduler");
const config = require("./config");
const { log } = require("./logger");

// Initialize modules and resolve circular dependencies
log("Initializing Barracuda DMS WebSocket client...");

// Create cache directory if it doesn't exist
fileManager.ensureCacheDirectory();

// Resolve circular dependency between fileManager and scheduler
fileManager.setSchedulerModule(scheduler);

// Display configuration
log(`Device ID: ${config.DEVICE_ID}`);
log(`Server URL: ${config.SERVER_URL}`);
log(`Socket URL: ${config.SOCKET_URL}`);
log(`Cache directory: ${config.CACHE_DIR}`);
log(`Log file: ${config.LOG_FILE}`);

// Start the connection process
socketManager.connectToServer();

// Setup periodic tasks
log("Setting up periodic tasks...");
setInterval(fileManager.testUrlChange, 30000);
setInterval(fileManager.cleanupCachedContent, 60 * 60 * 1000); // Run cleanup every hour

// Handle process termination
process.on("SIGINT", () => {
  log("Received SIGINT. Shutting down gracefully...");
  socketManager.stopHeartbeat();
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("Received SIGTERM. Shutting down gracefully...");
  socketManager.stopHeartbeat();
  process.exit(0);
});

log("Barracuda DMS WebSocket client initialized successfully.");
