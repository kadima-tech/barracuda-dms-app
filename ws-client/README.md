# Barracuda DMS WebSocket Client

This is a refactored version of the Barracuda DMS WebSocket client using SOLID principles.

## SOLID Principles Applied

1. **Single Responsibility Principle**: Each module has a single responsibility:
   - `config.js`: Manages configuration and environment variables
   - `logger.js`: Handles logging
   - `metrics.js`: Collects system metrics
   - `file-manager.js`: Manages file operations and URL handling
   - `scheduler.js`: Handles content scheduling
   - `socket-manager.js`: Manages WebSocket connections

2. **Open/Closed Principle**: The code is structured to be open for extension but closed for modification. New functionality can be added by extending the existing modules without modifying their core functionality.

3. **Liskov Substitution Principle**: Not directly applicable as we're not using class inheritance, but the module interfaces are consistent and could be replaced with alternative implementations.

4. **Interface Segregation Principle**: Each module exports only the functions that clients need, not forcing clients to depend on interfaces they don't use.

5. **Dependency Inversion Principle**: High-level modules (like `index.js`) depend on abstractions, not concrete implementations. Dependencies are injected through module imports.

## Directory Structure

```
ws-client/
├── config.js        # Configuration and environment variables
├── file-manager.js  # File operations and URL management
├── index.js         # Main entry point
├── logger.js        # Logging functionality
├── metrics.js       # System metrics collection
├── package.json     # Project dependencies
├── README.md        # This documentation
├── scheduler.js     # Content scheduling
└── socket-manager.js # WebSocket connection management
```

## Setup & Usage

1. Install dependencies:
   ```
   npm install
   ```

2. Run the client:
   ```
   npm start
   ```

3. Environment Variables (optional):
   - `DEVICE_ID`: Device identifier (defaults to random ID)
   - `SERVER_URL`: Server URL (defaults to development server)
   - `SOCKET_URL`: WebSocket server URL (defaults to development server)
   - `CACHE_DIR`: Directory for caching content (defaults to ../cache)
   - `LOG_FILE`: Log file path (defaults to ../logs/ws-client.log)
   - `RECONNECT_INTERVAL`: Reconnection interval in ms (defaults to 5000)
   - `MAX_RETRIES`: Maximum reconnection attempts (defaults to 10) 