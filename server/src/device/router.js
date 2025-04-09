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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multipart_1 = __importDefault(require("@fastify/multipart"));
const controller_1 = require("./controller");
const schema_1 = require("./schema");
const path_1 = require("path");
const static_1 = require("@fastify/static");
// Export Fastify plugin to define device routes
const deviceRoutes = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.log.info("Registering device routes plugin with opts:", JSON.stringify(opts));
    // Register multipart first
    yield fastify.register(multipart_1.default, {
        limits: {
            fieldSize: 50 * 1024 * 1024,
            fileSize: 100 * 1024 * 1024,
            files: 10,
        },
    });
    // Root route for listing devices - make sure this is registered
    fastify.get("/", {
        schema: schema_1.getConnectedDevicesSchema,
        handler: (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
            fastify.log.info("GET /devices handler called");
            const devices = yield (0, controller_1.getConnectedDevices)(request, reply);
            fastify.log.info(`Returning devices: ${JSON.stringify(devices)}`);
            return devices;
        }),
    });
    fastify.post("/:deviceId/reboot", { schema: schema_1.sendRebootCommandSchema }, controller_1.sendRebootCommand);
    fastify.post("/register", { schema: schema_1.registerDeviceSchema }, controller_1.registerDevice);
    fastify.post("/heartbeat", { schema: schema_1.handleHeartbeatSchema }, controller_1.handleHeartbeat);
    fastify.delete("/:deviceId", { schema: schema_1.unregisterDeviceSchema }, controller_1.unregisterDevice);
    fastify.get("/video", {
        schema: schema_1.streamVideoSchema,
        handler: (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
            const filename = request.query.filename;
            return (0, controller_1.streamVideo)(request, reply, filename);
        }),
    });
    fastify.post("/:deviceId/video/upload", {
        schema: schema_1.uploadVideoSchema,
    }, controller_1.uploadVideo);
    fastify.post("/:deviceId/url", { schema: schema_1.sendUrlToDeviceSchema }, controller_1.sendUrlToDevice);
    fastify.post("/:deviceId/images/upload", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, controller_1.uploadImages)(request, reply);
    }));
    fastify.get("/images", {
        handler: (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
            const filename = request.query.filename;
            return (0, controller_1.streamImage)(request, reply, filename);
        }),
    });
    // Serve static files for the ball page
    yield fastify.register(static_1.fastifyStatic, {
        root: (0, path_1.join)(__dirname, "../public"),
        prefix: "/public/",
    });
    // Add endpoint to serve the ball page
    fastify.get("/ball", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        return reply.sendFile("ball.html", (0, path_1.join)(__dirname, "../public"));
    }));
    // Add endpoint for ball position updates
    fastify.post("/:deviceId/ball-position", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, controller_1.handleBallPosition)(request, reply);
    }));
    fastify.get("/:deviceId/person", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const { deviceId } = request.params;
        const personData = yield (0, controller_1.getPersonForDevice)(deviceId);
        return reply.send(personData);
    }));
    fastify.log.info(`Routes registered under ${opts.prefix || "/"}`);
});
// Make sure we're not double-registering the prefix
exports.default = (fastify, opts, done) => {
    fastify.log.info("Starting device routes registration");
    fastify.register(deviceRoutes);
    fastify.log.info("Device routes registration completed");
    done();
};
