import { testUtil } from '@kadima-tech/micro-service-base';
import { FastifyInstance } from 'fastify';
import { v4 } from 'uuid';
import cacheRouter from './router';
import * as service from './service';
import { DeviceSocket } from '../device/types';

let app: FastifyInstance;
let mockSocket: Partial<DeviceSocket>;

// Mock the service layer
jest.mock('./service', () => ({
  cacheContentForSchedule: jest.fn(),
  getCacheProgress: jest.fn(),
}));

// Mock the device service
jest.mock('../device/service', () => ({
  getDeviceSocket: jest.fn(),
}));

beforeAll(async () => {
  app = testUtil.createTestApp();
  await app.register(cacheRouter);
});

beforeEach(() => {
  jest.clearAllMocks();
  
  // Create a mock socket for testing
  mockSocket = {
    id: v4(),
    emit: jest.fn(),
    connected: true,
  };
});

describe('Cache Router', () => {
  describe('POST /cache/:scheduleId', () => {
    const validPayload = {
      videoUrl: 'https://example.com/video.mp4',
      scheduleTime: '2024-03-20T10:00:00Z',
      cacheDuration: 60,
      deviceId: 'test-device-id',
    };

    it('should successfully initiate content caching', async () => {
      const scheduleId = v4();
      const expectedResponse = {
        message: `Cache request initiated for schedule ${scheduleId}`,
        deviceId: validPayload.deviceId,
        scheduleTime: validPayload.scheduleTime,
      };

      (service.cacheContentForSchedule as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: validPayload,
      });

      const expectedJson = {
        data: expectedResponse,
        links: {
          self: `http://localhost:80/cache/${scheduleId}`,
        },
      };

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expectedJson);
      expect(service.cacheContentForSchedule).toHaveBeenCalledWith(
        scheduleId,
        validPayload
      );
    });

    it('should validate required fields', async () => {
      const scheduleId = v4();
      const invalidPayload = {
        deviceId: 'test-device-id',
        // Missing required fields
      };

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });
  });

  describe('GET /cache/:scheduleId/progress/:deviceId', () => {
    it('should return cache progress when found', async () => {
      const scheduleId = v4();
      const deviceId = 'test-device-id';
      const mockProgress = {
        progress: 50,
        status: 'downloading',
        deviceId,
      };

      (service.getCacheProgress as jest.Mock).mockReturnValue(mockProgress);

      const response = await app.inject({
        method: 'GET',
        url: `/cache/${scheduleId}/progress/${deviceId}`,
      });

      const expectedJson = {
        data: mockProgress,
        links: {
          self: `http://localhost:80/cache/${scheduleId}/progress/${deviceId}`,
        },
      };

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expectedJson);
      expect(service.getCacheProgress).toHaveBeenCalledWith(deviceId, scheduleId);
    });

    it('should return 404 when no progress is found', async () => {
      const scheduleId = v4();
      const deviceId = 'test-device-id';

      (service.getCacheProgress as jest.Mock).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: `/cache/${scheduleId}/progress/${deviceId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: 'No cache progress found for this schedule and device',
      });
    });
  });

  describe('Schema Validation', () => {
    const scheduleId = v4();

    it('should validate videoUrl format', async () => {
      const invalidPayload = {
        videoUrl: 'not-a-url',
        scheduleTime: '2024-03-20T10:00:00Z',
        cacheDuration: 60,
        deviceId: 'test-device-id',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate scheduleTime format', async () => {
      const invalidPayload = {
        videoUrl: 'https://example.com/video.mp4',
        scheduleTime: 'invalid-date',
        cacheDuration: 60,
        deviceId: 'test-device-id',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate cacheDuration is a positive number', async () => {
      const invalidPayload = {
        videoUrl: 'https://example.com/video.mp4',
        scheduleTime: '2024-03-20T10:00:00Z',
        cacheDuration: -1,
        deviceId: 'test-device-id',
      };

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: invalidPayload,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const scheduleId = v4();
      const validPayload = {
        videoUrl: 'https://example.com/video.mp4',
        scheduleTime: '2024-03-20T10:00:00Z',
        cacheDuration: 60,
        deviceId: 'test-device-id',
      };

      (service.cacheContentForSchedule as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await app.inject({
        method: 'POST',
        url: `/cache/${scheduleId}`,
        payload: validPayload,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: 'Unexpected error',
      });
    });
  });
});
