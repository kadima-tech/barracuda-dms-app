import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import * as service from './service';
import { DeviceMetricsResource, SendRebootCommandParams } from './schema';
import { DeviceSocket } from './types';
import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

// Endpoint to get a list of connected devices
export const getConnectedDevices = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    req.log.info('Getting connected devices');
    const devices = service.getConnectedDevices();
    req.log.info(`Found ${devices.length} devices`);
    return reply.send({
      data: devices,
      links: {
        self: 'http://localhost:80/devices',
      },
    });
  } catch (error) {
    req.log.error('Error in getConnectedDevices:', error);
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Failed to get devices',
    });
  }
};

// Endpoint to send a reboot command to a specific device
export const sendRebootCommand = async (
  req: FastifyRequest<{ Params: SendRebootCommandParams }>,
  reply: FastifyReply
) => {
  const { deviceId } = req.params;
  try {
    const result = await service.sendRebootCommand(deviceId);
    return reply.send({
      data: result,
      links: {
        self: `http://localhost:80/devices/${deviceId}/reboot`,
      },
    });
  } catch (error) {
    return reply.status(404).send({
      error:
        error instanceof Error ? error.message : `Device ${deviceId} not found`,
    });
  }
};

// Endpoint to register a device
export const registerDevice = async (
  req: FastifyRequest<{ Body: { deviceId: string } }>,
  reply: FastifyReply
) => {
  const { deviceId } = req.body;

  // Register the device via the service layer
  const socket = (req as any).socket as DeviceSocket;
  if (!socket) {
    return reply.status(500).send({ error: 'Socket connection not found' });
  }

  service.registerDevice(socket, deviceId);
  return reply.send({
    data: {
      message: `Device ${deviceId} registered successfully`,
    },
    links: {
      self: 'http://localhost:80/devices/register',
    },
  });
};

// Endpoint to handle device heartbeats
export const handleHeartbeat = async (
  req: FastifyRequest<{ Body: DeviceMetricsResource & { deviceId: string } }>,
  reply: FastifyReply
) => {
  const { deviceId, ...metrics } = req.body;

  // Access the connectedDevices map directly to get the socket
  const socket = service.getDeviceSocket(deviceId);

  if (!socket) {
    return reply.status(404).send({ error: 'Device not connected' });
  }

  service.handleDeviceMessage(socket, metrics);
  return reply.send({
    data: {
      message: 'Heartbeat received',
    },
    links: {
      self: 'http://localhost:80/devices/heartbeat',
    },
  });
};

// Endpoint to unregister a device (disconnect)
export const unregisterDevice = async (
  req: FastifyRequest<{ Params: { deviceId: string } }>,
  reply: FastifyReply
) => {
  const { deviceId } = req.params;

  service.unregisterDevice(deviceId);
  return reply.send({
    data: {
      message: `Device ${deviceId} unregistered successfully`,
    },
    links: {
      self: `http://localhost:80/devices/${deviceId}`,
    },
  });
};

/**
 * Controller to handle video streaming requests.
 * @param req - FastifyRequest object
 * @param reply - FastifyReply object
 */
export const streamVideo = async (
  req: FastifyRequest,
  reply: FastifyReply,
  filename: string
) => {
  console.log('Video route accessed with filename:', filename);
  return service.streamVideoService(req, reply, filename);
};

/**
 * Controller to handle video upload requests.
 */
export const uploadVideo = async (
  req: FastifyRequest<{
    Params: { deviceId: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const data = await req.file();
    const deviceId = req.params.deviceId;

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (data.fieldname !== 'file') {
      return reply
        .status(400)
        .send({ error: "File must be uploaded with field name 'file'" });
    }

    if (!data.mimetype.startsWith('video/')) {
      return reply.status(400).send({ error: 'File must be a video' });
    }

    console.log('File received:', {
      filename: data.filename,
      mimetype: data.mimetype,
      fieldname: data.fieldname,
    });

    const result = await service.handleVideoUpload(data, deviceId);

    return reply.send({
      message: 'Video uploaded successfully',
      data: {
        url: result.url,
      },
    });
  } catch (error) {
    console.error('Error in uploadVideo:', error);
    if (error instanceof Error && error.message.includes('limits')) {
      return reply.status(413).send({
        error: 'File too large. Maximum size is 100MB',
      });
    }
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Failed to upload video',
    });
  }
};

// Add new endpoint to send URL to device
export const sendUrlToDevice = async (
  req: FastifyRequest<{
    Params: { deviceId: string };
    Body: { url: string; active?: boolean };
  }>,
  reply: FastifyReply
) => {
  const { deviceId } = req.params;
  const { url, active = true } = req.body;

  const result = await service.sendUrlToDevice(deviceId, url, active);
  return reply.status(result.error ? 404 : 200).send(result);
};

// Add new controller for handling multiple image uploads
export const uploadImages = async (
  req: FastifyRequest<{ Params: { deviceId: string } }>,
  reply: FastifyReply
) => {
  try {
    const parts = req.parts();
    const files = [];
    const deviceId = req.params.deviceId;

    for await (const part of parts) {
      if (part.file) {
        console.log('Processing uploaded file:', part.filename);
        files.push(part.file);
      }
    }

    if (files.length === 0) {
      return reply.status(400).send({ error: 'No files uploaded' });
    }

    console.log(`Processing ${files.length} files for device ${deviceId}`);
    const results = await service.handleImageUploads(files, deviceId);

    return reply.send({
      message: 'Images uploaded successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error in uploadImages:', error);
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Failed to upload images',
    });
  }
};

/**
 * Controller to handle image streaming requests.
 */
export const streamImage = async (
  req: FastifyRequest,
  reply: FastifyReply,
  filename: string
) => {
  try {
    const imagePath = join(__dirname, '../assets', filename);

    if (!existsSync(imagePath)) {
      return reply.status(404).send({ error: 'Image not found' });
    }

    const fileStream = createReadStream(imagePath);

    // Set appropriate content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    reply.header('Content-Type', contentType);
    return reply.send(fileStream);
  } catch (error) {
    req.log.error('Error in streamImage:', error);
    return reply.status(500).send({ error: 'Failed to stream image' });
  }
};
//////////
// Endpoint to handle ball position updates
export const handleBallPosition = async (
  req: FastifyRequest<{
    Body: {
      deviceId: string;
      x: number;
      y: number;
      timestamp: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { deviceId, x, y, timestamp } = req.body;

    const socket = service.getDeviceSocket(deviceId);
    if (!socket) {
      return reply.status(404).send({ error: 'Device not connected' });
    }

    await service.handleBallPosition(deviceId, { x, y, timestamp });
    return reply.send({ message: 'Ball position updated' });
  } catch (error) {
    req.log.error('Error in handleBallPosition:', error);
    return reply.status(500).send({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update ball position',
    });
  }
};
//////////////////////////////
export const getPersonForDevice = async (deviceId: string) => {
  return service.getPersonForDevice(deviceId);
};
