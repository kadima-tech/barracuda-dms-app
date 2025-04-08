"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUrlToDeviceSchema = exports.uploadVideoSchema = exports.getConnectedDevicesSchema = exports.unregisterDeviceSchema = exports.sendRebootCommandSchema = exports.handleHeartbeatSchema = exports.registerDeviceSchema = exports.streamVideoSchema = exports.tag = void 0;
const typebox_1 = require("@sinclair/typebox");
// Tag for grouping related API endpoints in documentation
exports.tag = {
    name: 'Device',
    description: 'Device Management',
};
// Device Metrics Resource Schema
const deviceMetricsResource = typebox_1.Type.Object({
    temperature: typebox_1.Type.Optional(typebox_1.Type.Number()),
    uptime: typebox_1.Type.Optional(typebox_1.Type.Number()),
    cpuLoad: typebox_1.Type.Optional(typebox_1.Type.Number()),
    memoryUsage: typebox_1.Type.Optional(typebox_1.Type.Number()),
    diskUsage: typebox_1.Type.Optional(typebox_1.Type.Number()),
    currentUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
}, { title: 'DeviceMetrics' });
// Connected Device Resource Schema
const connectedDeviceResource = typebox_1.Type.Object({
    deviceId: typebox_1.Type.String(),
    status: typebox_1.Type.String(),
    lastHeartbeat: typebox_1.Type.Number(),
    metrics: deviceMetricsResource,
}, { title: 'ConnectedDevice' });
// Common response wrapper
const responseWrapper = typebox_1.Type.Object({
    data: typebox_1.Type.Union([typebox_1.Type.Any(), typebox_1.Type.Array(typebox_1.Type.Any())]),
    links: typebox_1.Type.Object({
        self: typebox_1.Type.String(),
    }),
});
// Common error response
const errorResponse = typebox_1.Type.Object({
    error: typebox_1.Type.String(),
});
// Schema for registering a device
const registerDeviceBody = typebox_1.Type.Object({
    deviceId: typebox_1.Type.String(),
}, { title: 'RegisterDeviceBody' });
// Video Streaming Schema
exports.streamVideoSchema = {
    operationId: 'streamVideo',
    tags: [exports.tag.name],
    response: {
        '2xx': {
            type: 'string',
            description: 'Video stream response',
        },
    },
};
exports.registerDeviceSchema = {
    operationId: 'registerDevice',
    tags: [exports.tag.name],
    body: registerDeviceBody,
    response: {
        200: responseWrapper,
        500: errorResponse,
    },
};
// Schema for handling device heartbeat messages
const handleHeartbeatBody = typebox_1.Type.Intersect([typebox_1.Type.Object({ deviceId: typebox_1.Type.String() }), deviceMetricsResource], { title: 'HandleHeartbeatBody' });
exports.handleHeartbeatSchema = {
    operationId: 'handleHeartbeat',
    tags: [exports.tag.name],
    body: handleHeartbeatBody,
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
// Schema for the request parameter for the sendRebootCommand endpoint
const sendRebootCommandParams = typebox_1.Type.Object({
    deviceId: typebox_1.Type.String(),
}, { title: 'SendRebootCommandParams' });
exports.sendRebootCommandSchema = {
    operationId: 'sendRebootCommand',
    tags: [exports.tag.name],
    params: sendRebootCommandParams,
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
// Schema for unregistering a device
const unregisterDeviceParams = typebox_1.Type.Object({
    deviceId: typebox_1.Type.String(),
}, { title: 'UnregisterDeviceParams' });
exports.unregisterDeviceSchema = {
    operationId: 'unregisterDevice',
    tags: [exports.tag.name],
    params: unregisterDeviceParams,
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
// Schema for getting connected devices
exports.getConnectedDevicesSchema = {
    operationId: 'getConnectedDevices',
    tags: [exports.tag.name],
    response: {
        200: responseWrapper,
        500: errorResponse,
    },
};
// Schema for uploading video
exports.uploadVideoSchema = {
    operationId: 'uploadVideo',
    tags: [exports.tag.name],
    consumes: ['multipart/form-data'],
    response: {
        200: responseWrapper,
        400: errorResponse,
        500: errorResponse,
    },
};
// Add schema for sending URL to device
const sendUrlToDeviceBody = typebox_1.Type.Object({
    url: typebox_1.Type.String(),
    active: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
}, { title: 'SendUrlToDeviceBody' });
exports.sendUrlToDeviceSchema = {
    operationId: 'sendUrlToDevice',
    tags: [exports.tag.name],
    params: typebox_1.Type.Object({
        deviceId: typebox_1.Type.String(),
    }),
    body: sendUrlToDeviceBody,
    response: {
        200: responseWrapper,
        404: errorResponse,
    },
};
