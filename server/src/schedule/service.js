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
exports.deleteSchedule = exports.getSchedules = exports.getSchedule = exports.updateSchedule = exports.createSchedule = void 0;
const service_1 = require("../caching/service");
// In-memory storage for schedules (replace with database in production)
const schedules = new Map();
const createSchedule = (request) => __awaiter(void 0, void 0, void 0, function* () {
    const id = `schedule-${Date.now()}`;
    const now = new Date().toISOString();
    const schedule = Object.assign(Object.assign({ id }, request), { status: 'pending', created: now, updated: now });
    schedules.set(id, schedule);
    // Initiate caching if start time is within cache duration
    const startTime = new Date(schedule.startTime);
    const cacheTime = new Date(startTime.getTime() - (schedule.cacheDuration * 60 * 1000));
    if (cacheTime <= new Date()) {
        schedule.status = 'caching';
        yield (0, service_1.cacheContentForSchedule)(id, {
            videoUrl: schedule.videoUrl,
            scheduleTime: schedule.startTime,
            cacheDuration: schedule.cacheDuration,
            deviceId: schedule.deviceId
        });
    }
    return schedule;
});
exports.createSchedule = createSchedule;
const updateSchedule = (scheduleId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const schedule = schedules.get(scheduleId);
    if (!schedule) {
        throw new Error('Schedule not found');
    }
    const updatedSchedule = Object.assign(Object.assign(Object.assign({}, schedule), updates), { updated: new Date().toISOString() });
    schedules.set(scheduleId, updatedSchedule);
    return updatedSchedule;
});
exports.updateSchedule = updateSchedule;
const getSchedule = (scheduleId) => {
    const schedule = schedules.get(scheduleId);
    if (!schedule) {
        throw new Error('Schedule not found');
    }
    return schedule;
};
exports.getSchedule = getSchedule;
const getSchedules = (filters) => {
    let result = Array.from(schedules.values());
    if (filters === null || filters === void 0 ? void 0 : filters.deviceId) {
        result = result.filter(s => s.deviceId === filters.deviceId);
    }
    if (filters === null || filters === void 0 ? void 0 : filters.status) {
        result = result.filter(s => s.status === filters.status);
    }
    return result;
};
exports.getSchedules = getSchedules;
const deleteSchedule = (scheduleId) => {
    if (!schedules.delete(scheduleId)) {
        throw new Error('Schedule not found');
    }
};
exports.deleteSchedule = deleteSchedule;
