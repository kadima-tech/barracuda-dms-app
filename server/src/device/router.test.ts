import { testUtil } from "@kadima-tech/micro-service-base";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { v4 } from "uuid";
import deviceRouter from "./router";
import * as service from "./service";
import { DeviceSocket } from "./types";

let app: FastifyInstance;
let mockSocket: Partial<DeviceSocket>;
let mockIo: Partial<Server>;

// Mock ALL service functions
jest.mock("./service", () => ({
  setSocketIO: jest.fn(),
  getDeviceSocket: jest.fn(),
  registerDevice: jest.fn(),
  unregisterDevice: jest.fn(),
  handleDeviceMessage: jest.fn(),
  getConnectedDevices: jest.fn(),
  sendRebootCommand: jest.fn(),
  streamVideoService: jest.fn(),
  handleVideoUpload: jest.fn(),
  sendUrlToDevice: jest.fn(),
}));

beforeAll(async () => {
  app = testUtil.createTestApp();

  // Mock Socket.IO instance
  mockIo = {
    emit: jest.fn(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  // Setup mock socket
  mockSocket = {
    id: v4(),
    emit: jest.fn(),
    on: jest.fn(),
    connected: true,
  };

  // Register device router
  await app.register(deviceRouter);

  // Set up Socket.IO
  service.setSocketIO(mockIo as Server);

  await app.ready();
});

beforeEach(() => {
  jest.clearAllMocks();

  // Setup ALL default mocks
  (service.getDeviceSocket as jest.Mock).mockReturnValue(mockSocket);
  (service.getConnectedDevices as jest.Mock).mockResolvedValue([
    {
      deviceId: "device-1",
      status: "connected",
      lastHeartbeat: Date.now(),
      metrics: { temperature: 25, cpuLoad: 50 },
    },
  ]);
  (service.sendRebootCommand as jest.Mock).mockResolvedValue({
    message: "Reboot command sent",
  });
  (service.handleVideoUpload as jest.Mock).mockResolvedValue({
    url: "http://example.com/video.mp4",
  });
  (service.sendUrlToDevice as jest.Mock).mockResolvedValue({
    message: "URL sent",
  });
  (service.streamVideoService as jest.Mock).mockImplementation((req, reply) =>
    reply.send("video data")
  );
});

describe("Device Router", () => {
  describe("GET /devices", () => {
    it("should return list of connected devices", async () => {
      const mockDevices = [
        {
          deviceId: "device-1",
          status: "connected",
          lastHeartbeat: Date.now(),
          metrics: {
            temperature: 25,
            cpuLoad: 50,
            currentUrl: "http://example.com",
          },
        },
        {
          deviceId: "device-2",
          status: "connected",
          lastHeartbeat: Date.now(),
          metrics: {
            temperature: 28,
            cpuLoad: 60,
            currentUrl: "http://test.com",
          },
        },
      ];

      (service.getConnectedDevices as jest.Mock).mockResolvedValue(mockDevices);

      const response = await app.inject({
        method: "GET",
        url: "/devices",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockDevices);
      expect(service.getConnectedDevices).toHaveBeenCalled();
    });

    it("should return empty array when no devices are connected", async () => {
      (service.getConnectedDevices as jest.Mock).mockResolvedValue([]);

      const response = await app.inject({
        method: "GET",
        url: "/devices",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
      expect(service.getConnectedDevices).toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      (service.getConnectedDevices as jest.Mock).mockRejectedValue(
        new Error("Failed to get devices")
      );

      const response = await app.inject({
        method: "GET",
        url: "/devices",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        errors: [
          {
            message: "Failed to get devices",
          },
        ],
      });
    });
  });

  describe("POST /devices/:deviceId/reboot", () => {
    it("should successfully send reboot command", async () => {
      const deviceId = "test-device";
      const expectedResponse = {
        message: `Reboot command sent to device ${deviceId}`,
      };

      (service.sendRebootCommand as jest.Mock).mockResolvedValue(
        expectedResponse
      );

      const response = await app.inject({
        method: "POST",
        url: `/devices/${deviceId}/reboot`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: expectedResponse,
        links: {
          self: `http://localhost:80/devices/${deviceId}/reboot`,
        },
      });
    });

    it("should return 404 for non-existent device", async () => {
      const deviceId = "non-existent-device";
      (service.sendRebootCommand as jest.Mock).mockRejectedValue(
        new Error(`Device ${deviceId} not found`)
      );

      const response = await app.inject({
        method: "POST",
        url: `/devices/${deviceId}/reboot`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: `Device ${deviceId} not found`,
      });
    });
  });

  describe("POST /devices/register", () => {
    it("should register a new device", async () => {
      const deviceId = "test-device";

      const response = await app.inject({
        method: "POST",
        url: "/devices/register",
        payload: { deviceId },
      });

      const expectedJson = {
        data: {
          message: `Device ${deviceId} registered successfully`,
        },
        links: {
          self: "http://localhost:80/devices/register",
        },
      };

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expectedJson);
    });
  });

  describe("POST /devices/heartbeat", () => {
    it("should handle device heartbeat", async () => {
      const deviceId = "test-device";
      const metrics = {
        temperature: 25,
        cpuLoad: 50,
        memoryUsage: 60,
        diskUsage: 70,
      };

      const response = await app.inject({
        method: "POST",
        url: "/devices/heartbeat",
        payload: { deviceId, ...metrics },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: {
          message: "Heartbeat received",
        },
        links: {
          self: "http://localhost:80/devices/heartbeat",
        },
      });
      expect(service.handleDeviceMessage).toHaveBeenCalledWith(
        mockSocket,
        metrics
      );
    });

    it("should return 404 for non-existent device", async () => {
      const deviceId = "non-existent-device";
      (service.getDeviceSocket as jest.Mock).mockReturnValue(undefined);

      const response = await app.inject({
        method: "POST",
        url: "/devices/heartbeat",
        payload: { deviceId, temperature: 25 },
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Device not connected",
      });
    });
  });

  describe("DELETE /devices/:deviceId", () => {
    it("should unregister a device", async () => {
      const deviceId = "test-device";

      const response = await app.inject({
        method: "DELETE",
        url: `/devices/${deviceId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: {
          message: `Device ${deviceId} unregistered successfully`,
        },
        links: {
          self: `http://localhost:80/devices/${deviceId}`,
        },
      });
      expect(service.unregisterDevice).toHaveBeenCalledWith(deviceId);
    });
  });

  describe("GET /devices/video", () => {
    it("should handle video streaming request", async () => {
      (service.streamVideoService as jest.Mock).mockImplementation(
        (req, reply) => {
          reply.header("Content-Type", "video/mp4");
          return reply.send("mock-video-stream");
        }
      );

      const response = await app.inject({
        method: "GET",
        url: "/devices/video",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("video/mp4");
      expect(service.streamVideoService).toHaveBeenCalled();
    });
  });
});
