const { io } = require('socket.io-client');

// Create a socket connection
const socket = io('https://server-564151515476.europe-west1.run.app', {
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  withCredentials: true,
  extraHeaders: {
    origin: 'https://server-564151515476.europe-west1.run.app',
  },
});

// Device ID to register
const deviceId = 'test-device-1';

// Handle connection
socket.on('connect', () => {
  console.log('Connected to server');

  // Register the device
  socket.emit('register', { deviceId }, (response) => {
    console.log('Registration response:', response);
  });

  // Start sending heartbeats
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat', { deviceId }, (response) => {
        console.log('Heartbeat response:', response);
      });
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Clean up interval on disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    clearInterval(heartbeatInterval);
  });
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Handle errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Handle reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);

  // Re-register the device after reconnection
  socket.emit('register', { deviceId }, (response) => {
    console.log('Re-registration response:', response);
  });
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('Shutting down...');
  socket.disconnect();
  process.exit();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
