"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonForDevice = exports.handleBallPosition = exports.streamImage = exports.uploadImages = exports.sendUrlToDevice = exports.uploadVideo = exports.streamVideo = exports.unregisterDevice = exports.handleHeartbeat = exports.registerDevice = exports.sendRebootCommand = exports.getConnectedDevices = void 0;
const service = __importStar(require("./service"));
const path_1 = require("path");
const fs_1 = require("fs");
// Endpoint to get a list of connected devices
const getConnectedDevices = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        req.log.info('Getting connected devices');
        const devices = service.getConnectedDevices();
        req.log.info(`Found ${devices.length} devices`);
        return reply.send({
            data: devices,
            links: {
                self: 'http://localhost:80/devices',
            },
        });
    }
    catch (error) {
        req.log.error('Error in getConnectedDevices:', error);
        return reply.status(500).send({
            error: error instanceof Error ? error.message : 'Failed to get devices',
        });
    }
});
exports.getConnectedDevices = getConnectedDevices;
// Endpoint to send a reboot command to a specific device
const sendRebootCommand = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    try {
        const result = yield service.sendRebootCommand(deviceId);
        return reply.send({
            data: result,
            links: {
                self: `http://localhost:80/devices/${deviceId}/reboot`,
            },
        });
    }
    catch (error) {
        return reply.status(404).send({
            error: error instanceof Error ? error.message : `Device ${deviceId} not found`,
        });
    }
});
exports.sendRebootCommand = sendRebootCommand;
// Endpoint to register a device
const registerDevice = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.body;
    // Register the device via the service layer
    const socket = req.socket;
    if (!socket) {
        return reply.status(500).send({ error: 'Socket connection not found' });
    }
    service.registerDevice(socket, deviceId);
    return reply.send({
        data: {
            message: `Device ${deviceId} registered successfully`,
        },
        links: {
            self: 'http://localhost:80/devices/register',
        },
    });
});
exports.registerDevice = registerDevice;
// Endpoint to handle device heartbeats
const handleHeartbeat = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { deviceId } = _a, metrics = __rest(_a, ["deviceId"]);
    // Access the connectedDevices map directly to get the socket
    const socket = service.getDeviceSocket(deviceId);
    if (!socket) {
        return reply.status(404).send({ error: 'Device not connected' });
    }
    service.handleDeviceMessage(socket, metrics);
    return reply.send({
        data: {
            message: 'Heartbeat received',
        },
        links: {
            self: 'http://localhost:80/devices/heartbeat',
        },
    });
});
exports.handleHeartbeat = handleHeartbeat;
// Endpoint to unregister a device (disconnect)
const unregisterDevice = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    service.unregisterDevice(deviceId);
    return reply.send({
        data: {
            message: `Device ${deviceId} unregistered successfully`,
        },
        links: {
            self: `http://localhost:80/devices/${deviceId}`,
        },
    });
});
exports.unregisterDevice = unregisterDevice;
/**
 * Controller to handle video streaming requests.
 * @param req - FastifyRequest object
 * @param reply - FastifyReply object
 */
const streamVideo = (req, reply, filename) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Video route accessed with filename:', filename);
    return service.streamVideoService(req, reply, filename);
});
exports.streamVideo = streamVideo;
/**
 * Controller to handle video upload requests.
 */
const uploadVideo = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield req.file();
        const deviceId = req.params.deviceId;
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }
        if (data.fieldname !== 'file') {
            return reply
                .status(400)
                .send({ error: "File must be uploaded with field name 'file'" });
        }
        if (!data.mimetype.startsWith('video/')) {
            return reply.status(400).send({ error: 'File must be a video' });
        }
        console.log('File received:', {
            filename: data.filename,
            mimetype: data.mimetype,
            fieldname: data.fieldname,
        });
        const result = yield service.handleVideoUpload(data, deviceId);
        return reply.send({
            message: 'Video uploaded successfully',
            data: {
                url: result.url,
            },
        });
    }
    catch (error) {
        console.error('Error in uploadVideo:', error);
        if (error instanceof Error && error.message.includes('limits')) {
            return reply.status(413).send({
                error: 'File too large. Maximum size is 100MB',
            });
        }
        return reply.status(500).send({
            error: error instanceof Error ? error.message : 'Failed to upload video',
        });
    }
});
exports.uploadVideo = uploadVideo;
// Add new endpoint to send URL to device
const sendUrlToDevice = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId } = req.params;
    const { url, active = true } = req.body;
    const result = yield service.sendUrlToDevice(deviceId, url, active);
    return reply.status(result.error ? 404 : 200).send(result);
});
exports.sendUrlToDevice = sendUrlToDevice;
// Add new controller for handling multiple image uploads
const uploadImages = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        const parts = req.parts();
        const files = [];
        const deviceId = req.params.deviceId;
        try {
            for (var _d = true, parts_1 = __asyncValues(parts), parts_1_1; parts_1_1 = yield parts_1.next(), _a = parts_1_1.done, !_a; _d = true) {
                _c = parts_1_1.value;
                _d = false;
                const part = _c;
                if (part.file) {
                    console.log('Processing uploaded file:', part.filename);
                    files.push(part.file);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = parts_1.return)) yield _b.call(parts_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (files.length === 0) {
            return reply.status(400).send({ error: 'No files uploaded' });
        }
        console.log(`Processing ${files.length} files for device ${deviceId}`);
        const results = yield service.handleImageUploads(files, deviceId);
        return reply.send({
            message: 'Images uploaded successfully',
            data: results,
        });
    }
    catch (error) {
        console.error('Error in uploadImages:', error);
        return reply.status(500).send({
            error: error instanceof Error ? error.message : 'Failed to upload images',
        });
    }
});
exports.uploadImages = uploadImages;
/**
 * Controller to handle image streaming requests.
 */
const streamImage = (req, reply, filename) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const imagePath = (0, path_1.join)(__dirname, '../assets', filename);
        if (!(0, fs_1.existsSync)(imagePath)) {
            return reply.status(404).send({ error: 'Image not found' });
        }
        const fileStream = (0, fs_1.createReadStream)(imagePath);
        // Set appropriate content type based on file extension
        const ext = (_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };
        const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
        reply.header('Content-Type', contentType);
        return reply.send(fileStream);
    }
    catch (error) {
        req.log.error('Error in streamImage:', error);
        return reply.status(500).send({ error: 'Failed to stream image' });
    }
});
exports.streamImage = streamImage;
//////////
// Endpoint to handle ball position updates
const handleBallPosition = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, x, y, timestamp } = req.body;
        const socket = service.getDeviceSocket(deviceId);
        if (!socket) {
            return reply.status(404).send({ error: 'Device not connected' });
        }
        yield service.handleBallPosition(deviceId, { x, y, timestamp });
        return reply.send({ message: 'Ball position updated' });
    }
    catch (error) {
        req.log.error('Error in handleBallPosition:', error);
        return reply.status(500).send({
            error: error instanceof Error
                ? error.message
                : 'Failed to update ball position',
        });
    }
});
exports.handleBallPosition = handleBallPosition;
//////////////////////////////
const getPersonForDevice = (deviceId) => __awaiter(void 0, void 0, void 0, function* () {
    return service.getPersonForDevice(deviceId);
});
exports.getPersonForDevice = getPersonForDevice;
