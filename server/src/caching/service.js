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
exports.cacheContentForSchedule = exports.getCacheProgress = exports.updateCacheProgress = void 0;
const service_1 = require("../device/service");
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const cacheProgress = new Map();
const updateCacheProgress = (deviceId, data) => {
    const progressKey = `${deviceId}-${data.scheduleId}`;
    cacheProgress.set(progressKey, {
        progress: data.progress,
        status: data.status,
        deviceId,
    });
    if (data.status === "error") {
        micro_service_base_1.logger.error(`Caching failed for schedule ${data.scheduleId} on device ${deviceId}`);
    }
    else if (data.status === "complete") {
        micro_service_base_1.logger.info(`Caching completed for schedule ${data.scheduleId} on device ${deviceId}`);
    }
};
exports.updateCacheProgress = updateCacheProgress;
const getCacheProgress = (deviceId, scheduleId) => {
    return cacheProgress.get(`${deviceId}-${scheduleId}`);
};
exports.getCacheProgress = getCacheProgress;
const cacheContentForSchedule = (scheduleId, body) => __awaiter(void 0, void 0, void 0, function* () {
    const deviceSocket = (0, service_1.getDeviceSocket)(body.deviceId);
    if (!deviceSocket) {
        throw new Error(`Device ${body.deviceId} not found`);
    }
    if (!deviceSocket.connected) {
        throw new Error(`Device ${body.deviceId} is disconnected`);
    }
    // Send cache request to device
    deviceSocket.emit("cacheContent", {
        scheduleId,
        videoUrl: body.videoUrl,
        scheduleTime: body.scheduleTime,
        cacheDuration: body.cacheDuration,
    });
    micro_service_base_1.logger.info(`Cache request sent for schedule ${scheduleId} to device ${body.deviceId}`);
    return {
        message: `Cache request initiated for schedule ${scheduleId}`,
        deviceId: body.deviceId,
        scheduleTime: body.scheduleTime,
    };
});
exports.cacheContentForSchedule = cacheContentForSchedule;
