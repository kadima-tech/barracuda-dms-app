// src/device/router.ts
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import multipart from "@fastify/multipart";
import {
  getConnectedDevices,
  sendRebootCommand,
  registerDevice,
  handleHeartbeat,
  unregisterDevice,
  streamVideo,
  uploadVideo,
  sendUrlToDevice,
  uploadImages,
  streamImage,
  handleBallPosition,
  getPersonForDevice,
} from "./controller";
import {
  getConnectedDevicesSchema,
  sendRebootCommandSchema,
  registerDeviceSchema,
  handleHeartbeatSchema,
  unregisterDeviceSchema,
  streamVideoSchema,
  uploadVideoSchema,
  sendUrlToDeviceSchema,
} from "./schema";
import { join } from "path";
import { fastifyStatic } from "@fastify/static";

// Export Fastify plugin to define device routes
const deviceRoutes = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  fastify.log.info(
    "Registering device routes plugin with opts:",
    JSON.stringify(opts)
  );

  // Register multipart first
  await fastify.register(multipart, {
    limits: {
      fieldSize: 50 * 1024 * 1024,
      fileSize: 100 * 1024 * 1024,
      files: 10,
    },
  });

  // Root route for listing devices - make sure this is registered
  fastify.get("/", {
    schema: getConnectedDevicesSchema,
    handler: async (request, reply) => {
      fastify.log.info("GET /devices handler called");
      const devices = await getConnectedDevices(request, reply);
      fastify.log.info(`Returning devices: ${JSON.stringify(devices)}`);
      return devices;
    },
  });

  fastify.post(
    "/:deviceId/reboot",
    { schema: sendRebootCommandSchema },
    sendRebootCommand
  );
  fastify.post("/register", { schema: registerDeviceSchema }, registerDevice);
  fastify.post(
    "/heartbeat",
    { schema: handleHeartbeatSchema },
    handleHeartbeat
  );
  fastify.delete(
    "/:deviceId",
    { schema: unregisterDeviceSchema },
    unregisterDevice
  );
  fastify.get("/video", {
    schema: streamVideoSchema,
    handler: async (
      request: FastifyRequest<{
        Querystring: { filename: string };
      }>,
      reply
    ) => {
      const filename = request.query.filename;
      return streamVideo(request, reply, filename);
    },
  });
  fastify.post(
    "/:deviceId/video/upload",
    {
      schema: uploadVideoSchema,
    },
    uploadVideo
  );

  fastify.post(
    "/:deviceId/url",
    { schema: sendUrlToDeviceSchema },
    sendUrlToDevice
  );

  fastify.post(
    "/:deviceId/images/upload",
    async (
      request: FastifyRequest<{ Params: { deviceId: string } }>,
      reply: FastifyReply
    ) => {
      return uploadImages(request, reply);
    }
  );

  fastify.get("/images", {
    handler: async (
      request: FastifyRequest<{
        Querystring: { filename: string };
      }>,
      reply
    ) => {
      const filename = request.query.filename;
      return streamImage(request, reply, filename);
    },
  });

  // Serve static files for the ball page
  await fastify.register(fastifyStatic, {
    root: join(__dirname, "../public"),
    prefix: "/public/",
  });

  // Add endpoint to serve the ball page
  fastify.get("/ball", async (request, reply) => {
    return reply.sendFile("ball.html", join(__dirname, "../public"));
  });

  // Add endpoint for ball position updates
  fastify.post("/:deviceId/ball-position", async (request, reply) => {
    return handleBallPosition(
      request as FastifyRequest<{
        Body: {
          deviceId: string;
          x: number;
          y: number;
          timestamp: number;
        };
      }>,
      reply
    );
  });

  fastify.get(
    "/:deviceId/person",
    async (
      request: FastifyRequest<{ Params: { deviceId: string } }>,
      reply: FastifyReply
    ) => {
      const { deviceId } = request.params;
      const personData = await getPersonForDevice(deviceId);
      return reply.send(personData);
    }
  );

  fastify.log.info(`Routes registered under ${opts.prefix || "/"}`);
};

// Make sure we're not double-registering the prefix
export default (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.log.info("Starting device routes registration");
  fastify.register(deviceRoutes);
  fastify.log.info("Device routes registration completed");
  done();
};
