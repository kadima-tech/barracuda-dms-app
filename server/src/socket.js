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
exports.initializeSocketIO = exports.connectedDevices = void 0;
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const service_1 = require("./device/service");
const service_2 = require("./caching/service");
// Map to store connected devices by their `deviceId`
exports.connectedDevices = new Map();
/**
 * Initialize Socket.IO with the provided Socket.IO server instance.
 * @param io - Socket.IO server instance from Fastify
 */
const initializeSocketIO = (io) => {
    // Pass the io instance to deviceController
    (0, service_1.setSocketIO)(io);
    // Handle new connections
    io.on("connection", (socket) => {
        micro_service_base_1.logger.info("New device connected with socket ID:", socket.id);
        // Handle device registration
        socket.on("register", (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            micro_service_base_1.logger.info(`Registration attempt - Device ID: ${data.deviceId}, Socket ID: ${socket.id}`);
            try {
                // Clear any existing registration for this device ID
                const existingSocket = exports.connectedDevices.get(data.deviceId);
                if (existingSocket) {
                    micro_service_base_1.logger.info(`Disconnecting existing socket for device ${data.deviceId}`);
                    existingSocket.disconnect(true);
                    exports.connectedDevices.delete(data.deviceId);
                }
                // Register the new device
                (0, service_1.registerDevice)(socket, data.deviceId);
                // Send acknowledgment if callback exists
                if (typeof callback === "function") {
                    callback({
                        status: "success",
                        message: `Device ${data.deviceId} registered successfully`,
                    });
                }
            }
            catch (error) {
                micro_service_base_1.logger.error(`Error during registration:`, error);
                if (typeof callback === "function") {
                    callback({ status: "error", message: "Registration failed" });
                }
            }
        }));
        // Handle heartbeat messages
        socket.on("heartbeat", (data, callback) => {
            try {
                micro_service_base_1.logger.info(`Received heartbeat from socket ${socket.id}`);
                (0, service_1.handleDeviceMessage)(socket, data);
                if (typeof callback === "function") {
                    callback({ status: "success", message: "Heartbeat received" });
                }
            }
            catch (error) {
                micro_service_base_1.logger.error(`Error handling heartbeat:`, error);
                if (typeof callback === "function") {
                    callback({ status: "error", message: "Failed to process heartbeat" });
                }
            }
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            if (socket.deviceId) {
                micro_service_base_1.logger.info(`Device ${socket.deviceId} disconnected`);
                (0, service_1.unregisterDevice)(socket.deviceId);
            }
        });
        // Handle ball position updates
        socket.on("ballPosition", (data) => {
            (0, service_1.handleBallPosition)(data.deviceId, data);
        });
        // Handle initial ball position requests
        socket.on("requestBallPosition", () => {
            (0, service_1.handleInitialBallPosition)(socket);
        });
        // Add new handler for cache progress updates
        socket.on("cacheProgress", (data) => {
            micro_service_base_1.logger.info(`Cache progress for schedule ${data.scheduleId}: ${data.progress}% - ${data.status}`);
            (0, service_2.updateCacheProgress)(socket.deviceId, data);
            // Broadcast progress to any interested clients
            io.emit("cacheProgressUpdate", Object.assign({ deviceId: socket.deviceId }, data));
        });
    });
    return io;
};
exports.initializeSocketIO = initializeSocketIO;
