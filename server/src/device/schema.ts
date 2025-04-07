import { Static, Type } from "@sinclair/typebox";
import { FastifySchema } from "fastify";

// Tag for grouping related API endpoints in documentation
export const tag = {
  name: "Device",
  description: "Device Management",
};

// Device Metrics Resource Schema
const deviceMetricsResource = Type.Object(
  {
    temperature: Type.Optional(Type.Number()),
    uptime: Type.Optional(Type.Number()),
    cpuLoad: Type.Optional(Type.Number()),
    memoryUsage: Type.Optional(Type.Number()),
    diskUsage: Type.Optional(Type.Number()),
    currentUrl: Type.Optional(Type.String()),
  },
  { title: "DeviceMetrics" }
);

// Connected Device Resource Schema
const connectedDeviceResource = Type.Object(
  {
    deviceId: Type.String(),
    status: Type.String(),
    lastHeartbeat: Type.Number(),
    metrics: deviceMetricsResource,
  },
  { title: "ConnectedDevice" }
);

// Response Schema for the getConnectedDevices endpoint
const getConnectedDevicesResponse = Type.Array(connectedDeviceResource);

// Schema for registering a device
const registerDeviceBody = Type.Object(
  {
    deviceId: Type.String(),
  },
  { title: "RegisterDeviceBody" }
);

// Video Streaming Schema
export const streamVideoSchema: FastifySchema = {
  operationId: "streamVideo",
  tags: [tag.name],
  response: {
    "2xx": {
      type: "string",
      description: "Video stream response",
    },
  },
};

export const registerDeviceSchema: FastifySchema = {
  operationId: "registerDevice",
  tags: [tag.name],
  body: registerDeviceBody,
  response: {
    "2xx": {
      type: "object",
      properties: {
        message: Type.String(),
      },
      description: "Confirmation of successful device registration",
    },
  },
};

// Schema for handling device heartbeat messages
const handleHeartbeatBody = Type.Intersect(
  [Type.Object({ deviceId: Type.String() }), deviceMetricsResource],
  { title: "HandleHeartbeatBody" }
);

export const handleHeartbeatSchema: FastifySchema = {
  operationId: "handleHeartbeat",
  tags: [tag.name],
  body: handleHeartbeatBody,
  response: {
    "2xx": {
      type: "object",
      properties: {
        message: Type.String(),
      },
      description: "Acknowledgment of heartbeat received",
    },
  },
};

// Schema for the request parameter for the sendRebootCommand endpoint
const sendRebootCommandParams = Type.Object(
  {
    deviceId: Type.String(),
  },
  { title: "SendRebootCommandParams" }
);

export const sendRebootCommandSchema: FastifySchema = {
  operationId: "sendRebootCommand",
  tags: [tag.name],
  params: sendRebootCommandParams,
  response: {
    "2xx": {
      type: "object",
      properties: {
        message: Type.String(),
      },
      description: "Confirmation of reboot command sent",
    },
    "404": {
      type: "object",
      properties: {
        error: Type.String(),
      },
      description: "Error if device not found or disconnected",
    },
  },
};

// Schema for unregistering a device
const unregisterDeviceParams = Type.Object(
  {
    deviceId: Type.String(),
  },
  { title: "UnregisterDeviceParams" }
);

export const unregisterDeviceSchema: FastifySchema = {
  operationId: "unregisterDevice",
  tags: [tag.name],
  params: unregisterDeviceParams,
  response: {
    "2xx": {
      type: "object",
      properties: {
        message: Type.String(),
      },
      description: "Confirmation of device unregistration",
    },
  },
};

// Schema for getting connected devices
export const getConnectedDevicesSchema: FastifySchema = {
  operationId: "getConnectedDevices",
  tags: [tag.name],
  response: {
    "2xx": {
      ...getConnectedDevicesResponse,
      description: "List of connected devices with metrics",
    },
  },
};

// Schema for uploading video
export const uploadVideoSchema: FastifySchema = {
  operationId: 'uploadVideo',
  tags: [tag.name],
  consumes: ['multipart/form-data'],
  response: {
    200: {
      type: 'object',
      properties: {
        message: Type.String(),
      },
      description: 'Video upload success response',
    },
    400: {
      type: 'object',
      properties: {
        error: Type.String(),
      },
      description: 'Bad request error',
    },
    500: {
      type: 'object',
      properties: {
        error: Type.String(),
      },
      description: 'Server error response',
    },
  },
};

// Add schema for sending URL to device
const sendUrlToDeviceBody = Type.Object(
  {
    url: Type.String(),
    active: Type.Optional(Type.Boolean()),
  },
  { title: "SendUrlToDeviceBody" }
);

export const sendUrlToDeviceSchema: FastifySchema = {
  operationId: "sendUrlToDevice",
  tags: [tag.name],
  params: Type.Object({
    deviceId: Type.String(),
  }),
  body: sendUrlToDeviceBody,
  response: {
    "2xx": {
      type: "object",
      properties: {
        message: Type.String(),
      },
      description: "Confirmation of URL command sent",
    },
    "404": {
      type: "object",
      properties: {
        error: Type.String(),
      },
      description: "Error if device not found or disconnected",
    },
  },
};

// Export TypeScript types for strict typing in other files
export type RegisterDeviceBody = Static<typeof registerDeviceBody>;
export type HandleHeartbeatBody = Static<typeof handleHeartbeatBody>;
export type SendRebootCommandParams = Static<typeof sendRebootCommandParams>;
export type UnregisterDeviceParams = Static<typeof unregisterDeviceParams>;
export type ConnectedDeviceResource = Static<typeof connectedDeviceResource>;
export type DeviceMetricsResource = Static<typeof deviceMetricsResource>;
