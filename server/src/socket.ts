import { Server } from "socket.io";
import { logger } from "@kadima-tech/micro-service-base";
import {
  handleDeviceMessage,
  unregisterDevice,
  setSocketIO,
  registerDevice,
  handleBallPosition,
  handleInitialBallPosition,
} from "./device/service";
import { DeviceSocket } from "./device/types";
import { updateCacheProgress } from "./caching/service";

// Map to store connected devices by their `deviceId`
export const connectedDevices = new Map<string, DeviceSocket>();

/**
 * Initialize Socket.IO with the provided Socket.IO server instance.
 * @param io - Socket.IO server instance from Fastify
 */
export const initializeSocketIO = (io: Server) => {
  // Pass the io instance to deviceController
  setSocketIO(io);

  // Handle new connections
  io.on("connection", (socket: DeviceSocket) => {
    logger.info("New device connected with socket ID:", socket.id);

    // Handle device registration
    socket.on("register", async (data: { deviceId: string }, callback) => {
      logger.info(
        `Registration attempt - Device ID: ${data.deviceId}, Socket ID: ${socket.id}`
      );

      try {
        // Clear any existing registration for this device ID
        const existingSocket = connectedDevices.get(data.deviceId);
        if (existingSocket) {
          logger.info(
            `Disconnecting existing socket for device ${data.deviceId}`
          );
          existingSocket.disconnect(true);
          connectedDevices.delete(data.deviceId);
        }

        // Register the new device
        registerDevice(socket, data.deviceId);

        // Send acknowledgment if callback exists
        if (typeof callback === "function") {
          callback({
            status: "success",
            message: `Device ${data.deviceId} registered successfully`,
          });
        }
      } catch (error) {
        logger.error(`Error during registration:`, error);
        if (typeof callback === "function") {
          callback({ status: "error", message: "Registration failed" });
        }
      }
    });

    // Handle heartbeat messages
    socket.on("heartbeat", (data: any, callback) => {
      try {
        logger.info(`Received heartbeat from socket ${socket.id}`);
        handleDeviceMessage(socket, data);

        if (typeof callback === "function") {
          callback({ status: "success", message: "Heartbeat received" });
        }
      } catch (error) {
        logger.error(`Error handling heartbeat:`, error);
        if (typeof callback === "function") {
          callback({ status: "error", message: "Failed to process heartbeat" });
        }
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (socket.deviceId) {
        logger.info(`Device ${socket.deviceId} disconnected`);
        unregisterDevice(socket.deviceId);
      }
    });

    // Handle ball position updates
    socket.on("ballPosition", (data) => {
      handleBallPosition(data.deviceId, data);
    });

    // Handle initial ball position requests
    socket.on("requestBallPosition", () => {
      handleInitialBallPosition(socket);
    });

    // Add new handler for cache progress updates
    socket.on(
      "cacheProgress",
      (data: {
        scheduleId: string;
        progress: number;
        status: "downloading" | "complete" | "error";
      }) => {
        logger.info(
          `Cache progress for schedule ${data.scheduleId}: ${data.progress}% - ${data.status}`
        );
        updateCacheProgress(socket.deviceId!, data);

        // Broadcast progress to any interested clients
        io.emit("cacheProgressUpdate", {
          deviceId: socket.deviceId,
          ...data,
        });
      }
    );
  });

  return io;
};
