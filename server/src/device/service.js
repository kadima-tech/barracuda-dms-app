"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonForDevice = exports.handleInitialBallPosition = exports.handleBallPosition = exports.sendSlideshowConfig = exports.handleImageUploads = exports.sendUrlToDevice = exports.handleVideoUpload = exports.streamVideoService = exports.sendRebootCommand = exports.getConnectedDevices = exports.handleDeviceMessage = exports.unregisterDevice = exports.registerDevice = exports.setSocketIO = exports.getDeviceSocket = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const promises_1 = require("stream/promises");
const promises_2 = require("fs/promises");
const fs_2 = require("fs");
// Map to store connected devices by `deviceId`
const connectedDevices = new Map();
let io;
let currentBallHolder = 'device1';
let lastBallPosition = {
    x: 100,
    y: 100,
    velocity: { x: 0, y: 0 },
    timestamp: Date.now(),
};
// Function to get the DeviceSocket by deviceId
const getDeviceSocket = (deviceId) => {
    return connectedDevices.get(deviceId);
};
exports.getDeviceSocket = getDeviceSocket;
/**
 * Set the Socket.IO server instance for use in the service
 * @param socketIO - Socket.IO server instance
 */
const setSocketIO = (socketIO) => {
    io = socketIO;
};
exports.setSocketIO = setSocketIO;
/**
 * Register a device by associating its socket with a deviceId.
 * @param socket - The socket connection of the device
 * @param deviceId - Unique identifier for the device
 */
const registerDevice = (socket, deviceId) => {
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
    }
    catch (error) {
        console.error('Error registering device:', error);
        return false;
    }
};
exports.registerDevice = registerDevice;
/**
 * Unregister a device, removing it from the connected devices map.
 * @param deviceId - Unique identifier for the device
 */
const unregisterDevice = (deviceId) => {
    const deviceSocket = connectedDevices.get(deviceId);
    if (deviceSocket) {
        deviceSocket.disconnect(true); // Close the socket connection
    }
    connectedDevices.delete(deviceId);
    console.log(`Device ${deviceId} unregistered`);
};
exports.unregisterDevice = unregisterDevice;
/**
 * Handle an incoming heartbeat message from a device.
 * @param socket - The socket connection of the device
 * @param data - Device metrics data sent with the heartbeat
 */
const handleDeviceMessage = (socket, data) => {
    if (!socket.deviceId) {
        micro_service_base_1.logger.error('Received heartbeat from unregistered device');
        return;
    }
    // Log the incoming heartbeat data to verify we're receiving the currentUrl
    micro_service_base_1.logger.info(`Received heartbeat data: ${JSON.stringify(data)}`);
    // Update the socket's last heartbeat and metrics data
    socket.lastHeartbeat = Date.now();
    socket.data = Object.assign(Object.assign({}, socket.data), data);
    // Log the stored socket data to verify it's being saved
    micro_service_base_1.logger.info(`Updated socket data: ${JSON.stringify(socket.data)}`);
    // Process metrics for any alerts if thresholds are crossed
    checkForAlerts(socket.deviceId, socket.data);
    // Emit device update to all connected clients
    emitDeviceUpdate(socket.deviceId, socket.data);
    // Automatically assign zones based on device positions
    assignDeviceZones();
};
exports.handleDeviceMessage = handleDeviceMessage;
/**
 * Check for critical alerts based on device metrics.
 * @param deviceId - Unique Device ID
 * @param metrics - Metrics data to check
 */
function checkForAlerts(deviceId, metrics) {
    const { temperature, cpuLoad, memoryUsage, diskUsage } = metrics;
    const alerts = [];
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
function emitDeviceUpdate(deviceId, data) {
    if (io) {
        io.emit('deviceUpdate', Object.assign({ deviceId }, data));
    }
    else {
        console.error('Socket.IO server not initialized');
    }
}
/**
 * Retrieve a list of connected devices with their current metrics.
 */
const getConnectedDevices = () => {
    const devices = [];
    connectedDevices.forEach((socket, deviceId) => {
        if (socket.connected) {
            const deviceData = {
                deviceId,
                status: 'connected',
                lastHeartbeat: socket.lastHeartbeat || Date.now(),
                metrics: Object.assign(Object.assign({}, socket.data), { currentUrl: socket.data.currentUrl }),
            };
            micro_service_base_1.logger.info(`Found connected device: ${JSON.stringify(deviceData)}`);
            devices.push(deviceData);
        }
    });
    micro_service_base_1.logger.info(`Returning ${devices.length} connected devices`);
    return devices;
};
exports.getConnectedDevices = getConnectedDevices;
/**
 * Send a reboot command to a specific device.
 * @param deviceId - Unique Device ID
 * @returns Response object indicating success or error
 */
const sendRebootCommand = (deviceId) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else {
            console.log(`Device ${deviceId} successfully reconnected after reboot`);
            if (io) {
                io.emit('deviceRebootSuccess', { deviceId });
            }
        }
    }, 180000); // Check after 3 minutes
    return { message: `Reboot command sent to device ${deviceId}` };
});
exports.sendRebootCommand = sendRebootCommand;
/**
 * Stream a video file to the client with support for range requests.
 * @param req - FastifyRequest object
 * @param reply - FastifyReply object
 * @param videoName - Name of the video file to stream
 */
const streamVideoService = (req, reply, videoName) => {
    try {
        console.log('Streaming video:', videoName);
        const videoPath = (0, path_1.join)(__dirname, '../assets', videoName);
        console.log('Video path:', videoPath);
        if (!(0, fs_2.existsSync)(videoPath)) {
            console.error('Video file not found:', videoPath);
            return reply.status(404).send({ error: 'Video not found' });
        }
        const videoStat = (0, fs_1.statSync)(videoPath);
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
            const fileStream = (0, fs_1.createReadStream)(videoPath, {
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
        const fileStream = (0, fs_1.createReadStream)(videoPath);
        reply
            .header('Content-Length', fileSize)
            .header('Content-Type', 'video/mp4');
        return reply.send(fileStream);
    }
    catch (error) {
        console.error('Error in streamVideoService:', error);
        return reply.status(500).send({ error: 'Failed to stream video' });
    }
};
exports.streamVideoService = streamVideoService;
/**
 * Handle video upload and storage
 */
//TODO: don't use any, but since it's a POC :)
const handleVideoUpload = (file, deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting video upload handling');
        // Ensure upload directory exists
        const uploadDir = (0, path_1.join)(__dirname, '../assets');
        console.log('Upload directory:', uploadDir);
        yield (0, promises_2.mkdir)(uploadDir, { recursive: true });
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `video-${timestamp}.mp4`;
        const filePath = (0, path_1.join)(uploadDir, filename);
        console.log('Saving file to:', filePath);
        // Save the video file
        yield (0, promises_1.pipeline)(file.file, (0, fs_1.createWriteStream)(filePath));
        console.log('File saved successfully');
        // Create the full URL including the server base URL
        const videoUrl = `/devices/video?filename=${filename}`;
        const fullUrl = `http://192.168.2.128:8080${videoUrl}`;
        // If deviceId is provided, send the URL to the device
        if (deviceId) {
            micro_service_base_1.logger.info(`Sending video URL to device ${deviceId}`);
            yield (0, exports.sendUrlToDevice)(deviceId, fullUrl, true);
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
    }
    catch (error) {
        console.error('Error in handleVideoUpload:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
});
exports.handleVideoUpload = handleVideoUpload;
/**
 * Send a URL to a specific device to display
 * @param deviceId - Unique Device ID
 * @param url - The URL to display
 * @param active - Whether the URL should be active
 * @returns Response object indicating success or error
 */
const sendUrlToDevice = (deviceId_1, url_1, ...args_1) => __awaiter(void 0, [deviceId_1, url_1, ...args_1], void 0, function* (deviceId, url, active = true) {
    const deviceSocket = connectedDevices.get(deviceId);
    if (!deviceSocket) {
        micro_service_base_1.logger.error(`Device ${deviceId} not found`);
        return { error: `Device ${deviceId} not found` };
    }
    if (!deviceSocket.connected) {
        micro_service_base_1.logger.error(`Device ${deviceId} is disconnected`);
        return { error: `Device ${deviceId} is disconnected` };
    }
    micro_service_base_1.logger.info(`Sending URL to device ${deviceId}:`, {
        url,
        active,
        socketId: deviceSocket.id,
    });
    // Update the socket's data with the current URL
    deviceSocket.data = Object.assign(Object.assign({}, deviceSocket.data), { currentUrl: active ? url : undefined });
    deviceSocket.emit('displayUrl', { url, active });
    // Log the updated socket data
    micro_service_base_1.logger.info(`Updated device data:`, deviceSocket.data);
    // Add confirmation log
    deviceSocket.once('urlReceived', (data) => {
        micro_service_base_1.logger.info(`Device ${deviceId} confirmed URL receipt:`, data);
    });
    return { message: `URL command sent to device ${deviceId}` };
});
exports.sendUrlToDevice = sendUrlToDevice;
// Add new function to handle multiple image uploads
const handleImageUploads = (files, deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting multiple image upload handling');
        // Ensure upload directory exists
        const uploadDir = (0, path_1.join)(__dirname, '../assets');
        console.log('Upload directory:', uploadDir);
        yield (0, promises_2.mkdir)(uploadDir, { recursive: true });
        const uploadPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            // Validate file type
            if (!file.mimetype.startsWith('image/')) {
                throw new Error(`Invalid file type: ${file.mimetype}`);
            }
            const timestamp = Date.now();
            const filename = `image-${timestamp}-${file.filename}`;
            const filePath = (0, path_1.join)(uploadDir, filename);
            console.log('Processing file:', {
                originalName: file.filename,
                newPath: filePath,
                mimetype: file.mimetype,
            });
            // Save the file using pipeline
            try {
                yield (0, promises_1.pipeline)(file.file, (0, fs_1.createWriteStream)(filePath));
                console.log('File saved successfully:', filename);
            }
            catch (error) {
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
        }));
        const results = yield Promise.all(uploadPromises);
        console.log('Successfully processed all images:', results);
        // If deviceId is provided, send the slideshow config to the device
        if (deviceId && results.length > 0) {
            const imageUrls = results.map((r) => r.url);
            yield (0, exports.sendSlideshowConfig)(deviceId, {
                images: imageUrls,
                interval: 5000,
                shuffle: false,
            });
        }
        return results;
    }
    catch (error) {
        console.error('Error in handleImageUploads:', error);
        throw error;
    }
});
exports.handleImageUploads = handleImageUploads;
// Add new function to send slideshow configuration to device
const sendSlideshowConfig = (deviceId, config) => __awaiter(void 0, void 0, void 0, function* () {
    const deviceSocket = connectedDevices.get(deviceId);
    if (!deviceSocket) {
        return { error: `Device ${deviceId} not found` };
    }
    if (!deviceSocket.connected) {
        return { error: `Device ${deviceId} is disconnected` };
    }
    deviceSocket.emit('slideshowConfig', config);
    return { message: `Slideshow config sent to device ${deviceId}` };
});
exports.sendSlideshowConfig = sendSlideshowConfig;
/**
 * Handle ball position updates and transfers between devices
 */
// Helper function to get the next/previous device ID
const getNextDeviceId = (currentDeviceId, direction) => {
    const devices = Array.from(connectedDevices.keys())
        .filter((id) => id.startsWith('device'))
        .sort();
    const currentIndex = devices.indexOf(currentDeviceId);
    if (currentIndex === -1)
        return null;
    if (direction === 'next') {
        const nextIndex = (currentIndex + 1) % devices.length;
        return devices[nextIndex];
    }
    else {
        const prevIndex = (currentIndex - 1 + devices.length) % devices.length;
        return devices[prevIndex];
    }
};
const handleBallPosition = (deviceId, position) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (deviceId !== currentBallHolder)
        return;
    lastBallPosition = Object.assign({}, position);
    const device = connectedDevices.get(deviceId);
    const screenWidth = ((_a = device === null || device === void 0 ? void 0 : device.data) === null || _a === void 0 ? void 0 : _a.screenWidth) || 1024;
    if (position.velocity &&
        ((position.x >= screenWidth - 250 && position.velocity.x > 0) ||
            (position.x <= 0 && position.velocity.x < 0))) {
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
        const targetWidth = ((_b = targetDevice === null || targetDevice === void 0 ? void 0 : targetDevice.data) === null || _b === void 0 ? void 0 : _b.screenWidth) || 1024;
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
        io.emit('ballPositionUpdate', Object.assign(Object.assign({}, position), { deviceId, timestamp: Date.now(), currentHolder: deviceId }));
    }
});
exports.handleBallPosition = handleBallPosition;
// Update the initial position handler
const handleInitialBallPosition = (socket) => {
    if (!socket.deviceId)
        return;
    if (io) {
        socket.emit('ballHolderUpdate', { currentHolder: currentBallHolder });
        if (socket.deviceId === currentBallHolder) {
            socket.emit('ballPositionUpdate', Object.assign(Object.assign({}, lastBallPosition), { deviceId: currentBallHolder, timestamp: Date.now(), currentHolder: currentBallHolder }));
        }
    }
};
exports.handleInitialBallPosition = handleInitialBallPosition;
/**
 * Assign zones to connected devices based on their relative positions
 */
const assignDeviceZones = () => {
    const devices = Array.from(connectedDevices.values());
    // Simple assignment - devices form a horizontal chain
    devices.forEach((device, index) => {
        if (!device.data)
            device.data = {};
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
        io.emit('zonesUpdated', devices.map((d) => ({
            deviceId: d.deviceId,
            zone: d.data.zone,
        })));
    }
};
// Add this to your service.ts
const getPersonForDevice = (deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    // This is where you would typically fetch from a database
    // For now, we'll use mock data
    const mockPersons = {
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
    return (mockPersons[deviceId] || {
        id: '0',
        name: 'Niet toegewezen',
        roomNumber: 'Geen kamer',
        imageUrl: '/assets/placeholder.jpg',
    });
});
exports.getPersonForDevice = getPersonForDevice;
