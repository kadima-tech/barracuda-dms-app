"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteScheduleSchema = exports.getSchedulesSchema = exports.getScheduleSchema = exports.updateScheduleSchema = exports.createScheduleSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const scheduleBase = {
    deviceId: typebox_1.Type.String(),
    videoUrl: typebox_1.Type.String(),
    startTime: typebox_1.Type.String(),
    endTime: typebox_1.Type.String(),
    repeat: typebox_1.Type.Optional(typebox_1.Type.Union([
        typebox_1.Type.Literal('daily'),
        typebox_1.Type.Literal('weekly'),
        typebox_1.Type.Literal('monthly'),
        typebox_1.Type.Literal('none'),
    ])),
    cacheDuration: typebox_1.Type.Number(),
};
const scheduleResponse = typebox_1.Type.Object(Object.assign(Object.assign({ id: typebox_1.Type.String() }, scheduleBase), { status: typebox_1.Type.Union([
        typebox_1.Type.Literal('pending'),
        typebox_1.Type.Literal('caching'),
        typebox_1.Type.Literal('ready'),
        typebox_1.Type.Literal('playing'),
        typebox_1.Type.Literal('completed'),
        typebox_1.Type.Literal('error'),
    ]), created: typebox_1.Type.String(), updated: typebox_1.Type.String() }));
const responseWrapper = typebox_1.Type.Object({
    data: typebox_1.Type.Union([scheduleResponse, typebox_1.Type.Array(scheduleResponse)]),
    links: typebox_1.Type.Object({
        self: typebox_1.Type.String(),
    }),
});
const errorResponse = typebox_1.Type.Object({
    error: typebox_1.Type.String(),
});
exports.createScheduleSchema = {
    body: typebox_1.Type.Object(scheduleBase),
    response: {
        200: responseWrapper,
        400: errorResponse,
    },
};
exports.updateScheduleSchema = {
    params: typebox_1.Type.Object({
        scheduleId: typebox_1.Type.String(),
    }),
    body: typebox_1.Type.Partial(typebox_1.Type.Object(scheduleBase)),
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
exports.getScheduleSchema = {
    params: typebox_1.Type.Object({
        scheduleId: typebox_1.Type.String(),
    }),
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
exports.getSchedulesSchema = {
    querystring: typebox_1.Type.Object({
        deviceId: typebox_1.Type.Optional(typebox_1.Type.String()),
        status: typebox_1.Type.Optional(typebox_1.Type.String()),
    }),
    response: {
        200: responseWrapper,
        500: errorResponse,
    },
};
exports.deleteScheduleSchema = {
    params: typebox_1.Type.Object({
        scheduleId: typebox_1.Type.String(),
    }),
    response: {
        200: typebox_1.Type.Object({
            data: typebox_1.Type.Object({
                message: typebox_1.Type.String(),
            }),
            links: typebox_1.Type.Object({
                self: typebox_1.Type.String(),
            }),
        }),
        404: errorResponse,
    },
};
