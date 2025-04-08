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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const uuid_1 = require("uuid");
const router_1 = __importDefault(require("./router"));
const service = __importStar(require("./service"));
let app;
let mockSocket;
// Mock the service layer
jest.mock('./service', () => ({
    cacheContentForSchedule: jest.fn(),
    getCacheProgress: jest.fn(),
}));
// Mock the device service
jest.mock('../device/service', () => ({
    getDeviceSocket: jest.fn(),
}));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    app = micro_service_base_1.testUtil.createTestApp();
    yield app.register(router_1.default);
}));
beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock socket for testing
    mockSocket = {
        id: (0, uuid_1.v4)(),
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
        it('should successfully initiate content caching', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleId = (0, uuid_1.v4)();
            const expectedResponse = {
                message: `Cache request initiated for schedule ${scheduleId}`,
                deviceId: validPayload.deviceId,
                scheduleTime: validPayload.scheduleTime,
            };
            service.cacheContentForSchedule.mockResolvedValue(expectedResponse);
            const response = yield app.inject({
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
            expect(service.cacheContentForSchedule).toHaveBeenCalledWith(scheduleId, validPayload);
        }));
        it('should validate required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleId = (0, uuid_1.v4)();
            const invalidPayload = {
                deviceId: 'test-device-id',
                // Missing required fields
            };
            const response = yield app.inject({
                method: 'POST',
                url: `/cache/${scheduleId}`,
                payload: invalidPayload,
            });
            expect(response.statusCode).toBe(400);
            expect(response.json()).toHaveProperty('error');
        }));
    });
    describe('GET /cache/:scheduleId/progress/:deviceId', () => {
        it('should return cache progress when found', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleId = (0, uuid_1.v4)();
            const deviceId = 'test-device-id';
            const mockProgress = {
                progress: 50,
                status: 'downloading',
                deviceId,
            };
            service.getCacheProgress.mockReturnValue(mockProgress);
            const response = yield app.inject({
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
        }));
        it('should return 404 when no progress is found', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleId = (0, uuid_1.v4)();
            const deviceId = 'test-device-id';
            service.getCacheProgress.mockReturnValue(undefined);
            const response = yield app.inject({
                method: 'GET',
                url: `/cache/${scheduleId}/progress/${deviceId}`,
            });
            expect(response.statusCode).toBe(404);
            expect(response.json()).toEqual({
                error: 'No cache progress found for this schedule and device',
            });
        }));
    });
    describe('Schema Validation', () => {
        const scheduleId = (0, uuid_1.v4)();
        it('should validate videoUrl format', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPayload = {
                videoUrl: 'not-a-url',
                scheduleTime: '2024-03-20T10:00:00Z',
                cacheDuration: 60,
                deviceId: 'test-device-id',
            };
            const response = yield app.inject({
                method: 'POST',
                url: `/cache/${scheduleId}`,
                payload: invalidPayload,
            });
            expect(response.statusCode).toBe(400);
        }));
        it('should validate scheduleTime format', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPayload = {
                videoUrl: 'https://example.com/video.mp4',
                scheduleTime: 'invalid-date',
                cacheDuration: 60,
                deviceId: 'test-device-id',
            };
            const response = yield app.inject({
                method: 'POST',
                url: `/cache/${scheduleId}`,
                payload: invalidPayload,
            });
            expect(response.statusCode).toBe(400);
        }));
        it('should validate cacheDuration is a positive number', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPayload = {
                videoUrl: 'https://example.com/video.mp4',
                scheduleTime: '2024-03-20T10:00:00Z',
                cacheDuration: -1,
                deviceId: 'test-device-id',
            };
            const response = yield app.inject({
                method: 'POST',
                url: `/cache/${scheduleId}`,
                payload: invalidPayload,
            });
            expect(response.statusCode).toBe(400);
        }));
    });
    describe('Error Handling', () => {
        it('should handle unexpected errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const scheduleId = (0, uuid_1.v4)();
            const validPayload = {
                videoUrl: 'https://example.com/video.mp4',
                scheduleTime: '2024-03-20T10:00:00Z',
                cacheDuration: 60,
                deviceId: 'test-device-id',
            };
            service.cacheContentForSchedule.mockRejectedValue(new Error('Unexpected error'));
            const response = yield app.inject({
                method: 'POST',
                url: `/cache/${scheduleId}`,
                payload: validPayload,
            });
            expect(response.statusCode).toBe(404);
            expect(response.json()).toEqual({
                error: 'Unexpected error',
            });
        }));
    });
});
