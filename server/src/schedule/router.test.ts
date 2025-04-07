import { testUtil } from "@kadima-tech/micro-service-base";
import { FastifyInstance } from "fastify";
import scheduleRouter from "./router";
import * as service from "./service";
import { Schedule } from "./types";

let app: FastifyInstance;

// Mock the service layer
jest.mock("./service", () => ({
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  getSchedule: jest.fn(),
  getSchedules: jest.fn(),
  deleteSchedule: jest.fn(),
}));

// Mock the caching service
jest.mock("../caching/service", () => ({
  cacheContentForSchedule: jest.fn(),
}));

beforeAll(async () => {
  app = testUtil.createTestApp();
  await app.register(scheduleRouter);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Schedule Router", () => {
  const mockSchedule: Schedule = {
    id: "schedule-123",
    deviceId: "device-123",
    videoUrl: "https://example.com/video.mp4",
    startTime: "2024-03-20T10:00:00Z",
    endTime: "2024-03-20T11:00:00Z",
    status: "pending",
    cacheDuration: 60,
    created: "2024-03-19T10:00:00Z",
    updated: "2024-03-19T10:00:00Z",
  };

  describe("POST /schedules", () => {
    const validPayload = {
      deviceId: "device-123",
      videoUrl: "https://example.com/video.mp4",
      startTime: "2024-03-20T10:00:00Z",
      endTime: "2024-03-20T11:00:00Z",
      cacheDuration: 60,
    };

    it("should create a new schedule successfully", async () => {
      (service.createSchedule as jest.Mock).mockResolvedValue(mockSchedule);

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: validPayload,
      });

      const expectedJson = {
        data: mockSchedule,
        links: {
          self: "http://localhost:80/schedules",
        },
      };

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expectedJson);
      expect(service.createSchedule).toHaveBeenCalledWith(validPayload);
    });

    it("should validate required fields", async () => {
      const invalidPayload = {
        deviceId: "device-123",
        // Missing required fields
      };

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it("should handle service errors", async () => {
      (service.createSchedule as jest.Mock).mockRejectedValue(
        new Error("Failed to create schedule")
      );

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: validPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: "Failed to create schedule",
      });
    });
  });

  describe("PUT /schedules/:scheduleId", () => {
    const scheduleId = "schedule-123";
    const validUpdates = {
      startTime: "2024-03-21T10:00:00Z",
      endTime: "2024-03-21T11:00:00Z",
    };

    it("should update a schedule successfully", async () => {
      const updatedSchedule = { ...mockSchedule, ...validUpdates };
      (service.updateSchedule as jest.Mock).mockResolvedValue(updatedSchedule);

      const response = await app.inject({
        method: "PUT",
        url: `/schedules/${scheduleId}`,
        payload: validUpdates,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(updatedSchedule);
      expect(service.updateSchedule).toHaveBeenCalledWith(
        scheduleId,
        validUpdates
      );
    });

    it("should handle non-existent schedule", async () => {
      (service.updateSchedule as jest.Mock).mockRejectedValue(
        new Error("Schedule not found")
      );

      const response = await app.inject({
        method: "PUT",
        url: `/schedules/${scheduleId}`,
        payload: validUpdates,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Schedule not found",
      });
    });
  });

  describe("GET /schedules/:scheduleId", () => {
    const scheduleId = "schedule-123";

    it("should get a schedule successfully", async () => {
      (service.getSchedule as jest.Mock).mockReturnValue(mockSchedule);

      const response = await app.inject({
        method: "GET",
        url: `/schedules/${scheduleId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockSchedule);
      expect(service.getSchedule).toHaveBeenCalledWith(scheduleId);
    });

    it("should handle non-existent schedule", async () => {
      (service.getSchedule as jest.Mock).mockImplementation(() => {
        throw new Error("Schedule not found");
      });

      const response = await app.inject({
        method: "GET",
        url: `/schedules/${scheduleId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Schedule not found",
      });
    });
  });

  describe("GET /schedules", () => {
    it("should get all schedules", async () => {
      (service.getSchedules as jest.Mock).mockReturnValue([mockSchedule]);

      const response = await app.inject({
        method: "GET",
        url: "/schedules",
      });

      const expectedJson = {
        data: [mockSchedule],
        links: {
          self: "http://localhost:80/schedules",
        },
      };

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expectedJson);
      expect(service.getSchedules).toHaveBeenCalledWith({});
    });

    it("should filter schedules by deviceId", async () => {
      (service.getSchedules as jest.Mock).mockReturnValue([mockSchedule]);

      const response = await app.inject({
        method: "GET",
        url: "/schedules?deviceId=device-123",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([mockSchedule]);
      expect(service.getSchedules).toHaveBeenCalledWith({
        deviceId: "device-123",
      });
    });

    it("should filter schedules by status", async () => {
      (service.getSchedules as jest.Mock).mockReturnValue([mockSchedule]);

      const response = await app.inject({
        method: "GET",
        url: "/schedules?status=pending",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([mockSchedule]);
      expect(service.getSchedules).toHaveBeenCalledWith({
        status: "pending",
      });
    });
  });

  describe("DELETE /schedules/:scheduleId", () => {
    const scheduleId = "schedule-123";

    it("should delete a schedule successfully", async () => {
      (service.deleteSchedule as jest.Mock).mockImplementation(() => undefined);

      const response = await app.inject({
        method: "DELETE",
        url: `/schedules/${scheduleId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        message: "Schedule deleted successfully",
      });
      expect(service.deleteSchedule).toHaveBeenCalledWith(scheduleId);
    });

    it("should handle non-existent schedule", async () => {
      (service.deleteSchedule as jest.Mock).mockImplementation(() => {
        throw new Error("Schedule not found");
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/schedules/${scheduleId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: "Schedule not found",
      });
    });
  });

  describe("Schema Validation", () => {
    it("should validate date formats", async () => {
      const invalidPayload = {
        ...mockSchedule,
        startTime: "invalid-date",
        endTime: "invalid-date",
      };

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate repeat values", async () => {
      const invalidPayload = {
        ...mockSchedule,
        repeat: "invalid-repeat-value",
      };

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it("should validate cacheDuration is a positive number", async () => {
      const invalidPayload = {
        ...mockSchedule,
        cacheDuration: -1,
      };

      const response = await app.inject({
        method: "POST",
        url: "/schedules",
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
