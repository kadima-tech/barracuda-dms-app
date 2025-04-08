import {
  DeviceMetrics,
  DeviceSocket,
  Device,
  ImageUploadResponse,
  SlideshowConfig,
  BallPosition,
} from './types';
import { Server } from 'socket.io';

import { FastifyReply, FastifyRequest } from 'fastify';
import { createReadStream, statSync, createWriteStream } from 'fs';
import { join } from 'path';
import { logger } from '@kadima-tech/micro-service-base';
import { pipeline } from 'stream/promises';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Map to store connected devices by `deviceId`
const connectedDevices = new Map<string, DeviceSocket>();
let io: Server;
let currentBallHolder = 'device1';
let lastBallPosition: BallPosition & { velocity?: { x: number; y: number } } = {
  x: 100,
  y: 100,
  velocity: { x: 0, y: 0 },
  timestamp: Date.now(),
};

// Function to get the DeviceSocket by deviceId
export const getDeviceSocket = (deviceId: string): DeviceSocket | undefined => {
  return connectedDevices.get(deviceId);
};

/**
 * Set the Socket.IO server instance for use in the service
 * @param socketIO - Socket.IO server instance
 */
export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

/**
 * Register a device by associating its socket with a deviceId.
 * @param socket - The socket connection of the device
 * @param deviceId - Unique identifier for the device
 */
export const registerDevice = (socket: DeviceSocket, deviceId: string) => {
  try {
    if (socket.deviceId) {
      connectedDevices.delete(socket.deviceId);
    }

    socket.deviceId = deviceId;
    socket.lastHeartbeat = Date.now();
    socket.data = {
      deviceId,
      screenWidth: 0,
      screenHeight: 0,
    };

    connectedDevices.set(deviceId, socket);
    if (io) {
      io.emit('devicesUpdated');
    }

    return true;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
};

/**
 * Unregister a device, removing it from the connected devices map.
 * @param deviceId - Unique identifier for the device
 */
export const unregisterDevice = (deviceId: string) => {
  const deviceSocket = connectedDevices.get(deviceId);
  if (deviceSocket) {
    deviceSocket.disconnect(true); // Close the socket connection
  }
  connectedDevices.delete(deviceId);
  console.log(`Device ${deviceId} unregistered`);
};

/**
 * Handle an incoming heartbeat message from a device.
 * @param socket - The socket connection of the device
 * @param data - Device metrics data sent with the heartbeat
 */
export const handleDeviceMessage = (
  socket: DeviceSocket,
  data: DeviceMetrics
) => {
  if (!socket.deviceId) {
    logger.error('Received heartbeat from unregistered device');
    return;
  }

  // Log the incoming heartbeat data to verify we're receiving the currentUrl
  logger.info(`Received heartbeat data: ${JSON.stringify(data)}`);

  // Update the socket's last heartbeat and metrics data
  socket.lastHeartbeat = Date.now();
  socket.data = {
    ...socket.data,
    ...data, // This should include currentUrl from the heartbeat
  };

  // Log the stored socket data to verify it's being saved
  logger.info(`Updated socket data: ${JSON.stringify(socket.data)}`);

  // Process metrics for any alerts if thresholds are crossed
  checkForAlerts(socket.deviceId, socket.data);

  // Emit device update to all connected clients
  emitDeviceUpdate(socket.deviceId, socket.data);

  // Automatically assign zones based on device positions
  assignDeviceZones();
};

/**
 * Check for critical alerts based on device metrics.
 * @param deviceId - Unique Device ID
 * @param metrics - Metrics data to check
 */
function checkForAlerts(deviceId: string, metrics: DeviceMetrics) {
  const { temperature, cpuLoad, memoryUsage, diskUsage } = metrics;
  const alerts: string[] = [];

  if (temperature !== undefined && temperature > 75) {
    alerts.push(`High temperature: ${temperature}°C`);
  }
  if (cpuLoad !== undefined && cpuLoad > 85) {
    alerts.push(`High CPU load: ${cpuLoad}%`);
  }
  if (memoryUsage !== undefined && memoryUsage > 90) {
    alerts.push(`High memory usage: ${memoryUsage}%`);
  }
  if (diskUsage !== undefined && diskUsage > 90) {
    alerts.push(`High disk usage: ${diskUsage}%`);
  }

  if (alerts.length > 0) {
    console.warn(`Alert for ${deviceId}:`, alerts.join(', '));
    if (io) {
      io.emit('deviceAlert', { deviceId, alerts });
    }
  }
}

/**
 * Emit an update for a device to all connected clients.
 * @param deviceId - Unique Device ID
 * @param data - The metrics data to emit
 */
function emitDeviceUpdate(deviceId: string, data: DeviceMetrics) {
  if (io) {
    io.emit('deviceUpdate', { deviceId, ...data });
  } else {
    console.error('Socket.IO server not initialized');
  }
}

/**
 * Retrieve a list of connected devices with their current metrics.
 */
export const getConnectedDevices = () => {
  const devices: Device[] = [];

  connectedDevices.forEach((socket, deviceId) => {
    if (socket.connected) {
      const deviceData: Device = {
        deviceId,
        status: 'connected' as const,
        lastHeartbeat: socket.lastHeartbeat || Date.now(),
        metrics: {
          ...socket.data,
          currentUrl: socket.data.currentUrl,
        },
      };

      logger.info(`Found connected device: ${JSON.stringify(deviceData)}`);
      devices.push(deviceData);
    }
  });

  logger.info(`Returning ${devices.length} connected devices`);
  return devices;
};

/**
 * Send a reboot command to a specific device.
 * @param deviceId - Unique Device ID
 * @returns Response object indicating success or error
 */
export const sendRebootCommand = async (deviceId: string) => {
  const deviceSocket = connectedDevices.get(deviceId);
  if (!deviceSocket) {
    return { error: `Device ${deviceId} not found` };
  }

  if (!deviceSocket.connected) {
    return { error: `Device ${deviceId} is disconnected` };
  }

  deviceSocket.emit('reboot');
  console.log(`Reboot command sent to device ${deviceId}`);

  // Set a timeout to check if the device reconnects after reboot
  setTimeout(() => {
    const updatedSocket = connectedDevices.get(deviceId);
    if (!updatedSocket || !updatedSocket.connected) {
      console.warn(`Device ${deviceId} did not reconnect after reboot`);
      if (io) {
        io.emit('deviceRebootFailed', { deviceId });
      }
    } else {
      console.log(`Device ${deviceId} successfully reconnected after reboot`);
      if (io) {
        io.emit('deviceRebootSuccess', { deviceId });
      }
    }
  }, 180000); // Check after 3 minutes

  return { message: `Reboot command sent to device ${deviceId}` };
};

/**
 * Stream a video file to the client with support for range requests.
 * @param req - FastifyRequest object
 * @param reply - FastifyReply object
 * @param videoName - Name of the video file to stream
 */
export const streamVideoService = (
  req: FastifyRequest,
  reply: FastifyReply,
  videoName: string
) => {
  try {
    console.log('Streaming video:', videoName);
    const videoPath = join(__dirname, '../assets', videoName);
    console.log('Video path:', videoPath);

    if (!existsSync(videoPath)) {
      console.error('Video file not found:', videoPath);
      return reply.status(404).send({ error: 'Video not found' });
    }

    const videoStat = statSync(videoPath);
    const fileSize = videoStat.size;
    const range = req.headers.range;

    console.log('Video stats:', {
      size: fileSize,
      range: range || 'none',
    });

    // Handle range request for partial content
    if (range) {
      const [start, end] = range
        .replace(/bytes=/, '')
        .split('-')
        .map(Number);
      const chunkStart = start || 0;
      const chunkEnd = end || fileSize - 1;
      const chunkSize = chunkEnd - chunkStart + 1;

      // Create a read stream for the specified range
      const fileStream = createReadStream(videoPath, {
        start: chunkStart,
        end: chunkEnd,
      });

      // Set appropriate headers for partial content response
      reply
        .code(206) // Partial Content
        .header('Content-Range', `bytes ${chunkStart}-${chunkEnd}/${fileSize}`)
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', chunkSize)
        .header('Content-Type', 'video/mp4');

      return reply.send(fileStream);
    }

    // Handle request without range (serve the entire video)
    const fileStream = createReadStream(videoPath);
    reply
      .header('Content-Length', fileSize)
      .header('Content-Type', 'video/mp4');

    return reply.send(fileStream);
  } catch (error) {
    console.error('Error in streamVideoService:', error);
    return reply.status(500).send({ error: 'Failed to stream video' });
  }
};

/**
 * Handle video upload and storage
 */

//TODO: don't use any, but since it's a POC :)
export const handleVideoUpload = async (file: any, deviceId?: string) => {
  try {
    console.log('Starting video upload handling');

    // Ensure upload directory exists
    const uploadDir = join(__dirname, '../assets');
    console.log('Upload directory:', uploadDir);

    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `video-${timestamp}.mp4`;
    const filePath = join(uploadDir, filename);

    console.log('Saving file to:', filePath);

    // Save the video file
    await pipeline(file.file, createWriteStream(filePath));
    console.log('File saved successfully');

    // Create the full URL including the server base URL
    const videoUrl = `/devices/video?filename=${filename}`;
    const fullUrl = `http://192.168.2.128:8080${videoUrl}`;

    // If deviceId is provided, send the URL to the device
    if (deviceId) {
      logger.info(`Sending video URL to device ${deviceId}`);
      await sendUrlToDevice(deviceId, fullUrl, true);
    }

    // Notify all connected clients about the new video
    if (io) {
      io.emit('videoUpdated', {
        timestamp,
        url: videoUrl,
      });
    }

    return {
      path: filePath,
      filename,
      url: videoUrl,
    };
  } catch (error) {
    console.error('Error in handleVideoUpload:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Send a URL to a specific device to display
 * @param deviceId - Unique Device ID
 * @param url - The URL to display
 * @param active - Whether the URL should be active
 * @returns Response object indicating success or error
 */
export const sendUrlToDevice = async (
  deviceId: string,
  url: string,
  active: boolean = true
) => {
  const deviceSocket = connectedDevices.get(deviceId);
  if (!deviceSocket) {
    logger.error(`Device ${deviceId} not found`);
    return { error: `Device ${deviceId} not found` };
  }

  if (!deviceSocket.connected) {
    logger.error(`Device ${deviceId} is disconnected`);
    return { error: `Device ${deviceId} is disconnected` };
  }

  logger.info(`Sending URL to device ${deviceId}:`, {
    url,
    active,
    socketId: deviceSocket.id,
  });

  // Update the socket's data with the current URL
  deviceSocket.data = {
    ...deviceSocket.data, // Preserve existing metrics
    currentUrl: active ? url : undefined,
  };

  deviceSocket.emit('displayUrl', { url, active });

  // Log the updated socket data
  logger.info(`Updated device data:`, deviceSocket.data);

  // Add confirmation log
  deviceSocket.once('urlReceived', (data) => {
    logger.info(`Device ${deviceId} confirmed URL receipt:`, data);
  });

  return { message: `URL command sent to device ${deviceId}` };
};

// Add new function to handle multiple image uploads
export const handleImageUploads = async (
  files: any[],
  deviceId?: string
): Promise<ImageUploadResponse[]> => {
  try {
    console.log('Starting multiple image upload handling');

    // Ensure upload directory exists
    const uploadDir = join(__dirname, '../assets');
    console.log('Upload directory:', uploadDir);

    await mkdir(uploadDir, { recursive: true });

    const uploadPromises = files.map(
      async (file): Promise<ImageUploadResponse> => {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          throw new Error(`Invalid file type: ${file.mimetype}`);
        }

        const timestamp = Date.now();
        const filename = `image-${timestamp}-${file.filename}`;
        const filePath = join(uploadDir, filename);

        console.log('Processing file:', {
          originalName: file.filename,
          newPath: filePath,
          mimetype: file.mimetype,
        });

        // Save the file using pipeline
        try {
          await pipeline(file.file, createWriteStream(filePath));
          console.log('File saved successfully:', filename);
        } catch (error) {
          console.error('Error saving file:', error);
          throw error;
        }

        const imageUrl = `/devices/images?filename=${filename}`;
        const fullUrl = `http://10.0.0.126:8080${imageUrl}`;

        return {
          path: filePath,
          filename,
          url: fullUrl,
        };
      }
    );

    const results = await Promise.all(uploadPromises);
    console.log('Successfully processed all images:', results);

    // If deviceId is provided, send the slideshow config to the device
    if (deviceId && results.length > 0) {
      const imageUrls = results.map((r) => r.url);
      await sendSlideshowConfig(deviceId, {
        images: imageUrls,
        interval: 5000,
        shuffle: false,
      });
    }

    return results;
  } catch (error) {
    console.error('Error in handleImageUploads:', error);
    throw error;
  }
};

// Add new function to send slideshow configuration to device
export const sendSlideshowConfig = async (
  deviceId: string,
  config: SlideshowConfig
) => {
  const deviceSocket = connectedDevices.get(deviceId);
  if (!deviceSocket) {
    return { error: `Device ${deviceId} not found` };
  }

  if (!deviceSocket.connected) {
    return { error: `Device ${deviceId} is disconnected` };
  }

  deviceSocket.emit('slideshowConfig', config);
  return { message: `Slideshow config sent to device ${deviceId}` };
};

/**
 * Handle ball position updates and transfers between devices
 */

// Helper function to get the next/previous device ID
const getNextDeviceId = (
  currentDeviceId: string,
  direction: 'next' | 'prev'
): string | null => {
  const devices = Array.from(connectedDevices.keys())
    .filter((id) => id.startsWith('device'))
    .sort();

  const currentIndex = devices.indexOf(currentDeviceId);
  if (currentIndex === -1) return null;

  if (direction === 'next') {
    const nextIndex = (currentIndex + 1) % devices.length;
    return devices[nextIndex];
  } else {
    const prevIndex = (currentIndex - 1 + devices.length) % devices.length;
    return devices[prevIndex];
  }
};

export const handleBallPosition = async (
  deviceId: string,
  position: BallPosition & {
    velocity?: { x: number; y: number };
    transfer?: boolean;
    direction?: 'next' | 'prev';
  }
) => {
  if (deviceId !== currentBallHolder) return;
  lastBallPosition = { ...position };

  const device = connectedDevices.get(deviceId);
  const screenWidth = device?.data?.screenWidth || 1024;

  if (
    position.velocity &&
    ((position.x >= screenWidth - 250 && position.velocity.x > 0) ||
      (position.x <= 0 && position.velocity.x < 0))
  ) {
    const direction = position.velocity.x > 0 ? 'next' : 'prev';
    const targetDeviceId = getNextDeviceId(deviceId, direction);

    if (!targetDeviceId) {
      if (io) {
        io.emit('ballPositionUpdate', {
          deviceId,
          x: direction === 'next' ? screenWidth - 250 : 10,
          y: position.y,
          velocity: {
            x: -position.velocity.x * 0.8,
            y: 0,
          },
          timestamp: Date.now(),
          currentHolder: deviceId,
        });
      }
      return;
    }

    currentBallHolder = targetDeviceId;
    const targetDevice = connectedDevices.get(targetDeviceId);
    const targetWidth = targetDevice?.data?.screenWidth || 1024;

    if (io) {
      io.emit('ballHolderUpdate', {
        currentHolder: targetDeviceId,
        previousHolder: deviceId,
      });

      io.emit('ballPositionUpdate', {
        deviceId: targetDeviceId,
        x: direction === 'next' ? 10 : targetWidth - 250,
        y: position.y,
        velocity: position.velocity,
        timestamp: Date.now(),
        currentHolder: targetDeviceId,
      });
    }
    return;
  }

  if (io) {
    io.emit('ballPositionUpdate', {
      ...position,
      deviceId,
      timestamp: Date.now(),
      currentHolder: deviceId,
    });
  }
};

// Update the initial position handler
export const handleInitialBallPosition = (socket: DeviceSocket) => {
  if (!socket.deviceId) return;

  if (io) {
    socket.emit('ballHolderUpdate', { currentHolder: currentBallHolder });
    if (socket.deviceId === currentBallHolder) {
      socket.emit('ballPositionUpdate', {
        ...lastBallPosition,
        deviceId: currentBallHolder,
        timestamp: Date.now(),
        currentHolder: currentBallHolder,
      });
    }
  }
};

/**
 * Assign zones to connected devices based on their relative positions
 */
const assignDeviceZones = () => {
  const devices = Array.from(connectedDevices.values());

  // Simple assignment - devices form a horizontal chain
  devices.forEach((device, index) => {
    if (!device.data) device.data = {};

    if (index > 0) {
      device.data.zone = {
        position: 'right',
        x: 0,
        y: 0,
        width: 10,
        height: device.data.screenHeight || 0,
      };
    }

    if (index < devices.length - 1) {
      device.data.zone = {
        position: 'left',
        x: (device.data.screenWidth || 0) - 10,
        y: 0,
        width: 10,
        height: device.data.screenHeight || 0,
      };
    }
  });

  // Notify all devices of zone updates
  if (io) {
    io.emit(
      'zonesUpdated',
      devices.map((d) => ({
        deviceId: d.deviceId,
        zone: d.data.zone,
      }))
    );
  }
};

// Add this interface to your types.ts file
interface PersonData {
  id: string;
  name: string;
  roomNumber: string;
  imageUrl: string;
}

// Add this to your service.ts
export const getPersonForDevice = async (
  deviceId: string
): Promise<PersonData> => {
  // This is where you would typically fetch from a database
  // For now, we'll use mock data
  const mockPersons: { [key: string]: PersonData } = {
    device1: {
      id: '1',
      name: 'Marie-Antoinette van Leeuwenhoven',
      roomNumber: 'Kamer 02',
      imageUrl: '/assets/person1.jpg',
    },
    device2: {
      id: '2',
      name: 'Johannes van der Molen',
      roomNumber: 'Kamer 04',
      imageUrl: '/assets/person2.jpg',
    },
    // Add more mock data as needed
  };

  return (
    mockPersons[deviceId] || {
      id: '0',
      name: 'Niet toegewezen',
      roomNumber: 'Geen kamer',
      imageUrl: '/assets/placeholder.jpg',
    }
  );
};
