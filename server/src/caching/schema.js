"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheContentSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.cacheContentSchema = {
    body: typebox_1.Type.Object({
        videoUrl: typebox_1.Type.String({
            format: 'uri',
            description: 'URL of the video to cache',
        }),
        scheduleTime: typebox_1.Type.String({
            format: 'date-time',
            description: 'ISO 8601 timestamp for when to schedule the cache',
        }),
        cacheDuration: typebox_1.Type.Number({
            minimum: 1,
            description: 'Duration in minutes to keep the content cached',
        }),
        deviceId: typebox_1.Type.String({
            minLength: 1,
            description: 'ID of the device to cache content for',
        }),
    }, {
        title: 'CacheContent',
        additionalProperties: false,
    }),
    response: {
        200: typebox_1.Type.Object({
            data: typebox_1.Type.Object({
                message: typebox_1.Type.String(),
                deviceId: typebox_1.Type.String(),
                scheduleTime: typebox_1.Type.String(),
            }),
            links: typebox_1.Type.Object({
                self: typebox_1.Type.String(),
            }),
        }),
        400: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
        }),
        404: typebox_1.Type.Object({
            error: typebox_1.Type.String(),
        }),
    },
};
