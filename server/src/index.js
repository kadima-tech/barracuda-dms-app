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
// src/index.ts
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const router_1 = __importDefault(require("./device/router"));
const router_2 = __importDefault(require("./caching/router"));
const router_3 = __importDefault(require("./schedule/router"));
const router_4 = __importDefault(require("./spotify/router"));
const socket_1 = require("./socket");
require("fastify");
const router_5 = __importDefault(require("./exchange/router"));
const cors_1 = __importDefault(require("@fastify/cors"));
const router_6 = __importDefault(require("./news/router"));
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        micro_service_base_1.logger.info('Starting setup of Fastify server...');
        // Get port from environment variable or use default
        const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
        micro_service_base_1.logger.info(`Server will listen on port ${port}`);
        // Setup up Fastify
        const { fastify } = yield (0, micro_service_base_1.createMicroService)({
            title: 'BarracudaDMS Service',
            routes: [],
        });
        micro_service_base_1.logger.info('Fastify instance created successfully.');
        // Add CORS configuration before registering routes
        yield fastify.register(cors_1.default, {
            origin: [
                'http://192.168.2.128:5173',
                'http://localhost:5173',
                'http://192.168.2.128:5174',
                'http://localhost:5174',
                'http://192.168.2.128:8080',
                'http://localhost:8080',
                'http://localhost:3000',
                'http://192.168.2.128',
                'http://localhost',
            ],
            methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        });
        micro_service_base_1.logger.info('CORS configuration added.');
        // Manually register routes with prefixes
        yield fastify.register(router_1.default, { prefix: '/devices' });
        yield fastify.register(router_2.default, { prefix: '/cache' });
        yield fastify.register(router_3.default, { prefix: '/schedule' });
        yield fastify.register(router_4.default, { prefix: '/spotify' });
        yield fastify.register(router_5.default, { prefix: '/exchange' });
        yield fastify.register(router_6.default, { prefix: '/proxy' });
        // Register Socket.IO with Fastify
        fastify.register(require('fastify-socket.io'), {
            cors: {
                origin: [
                    'http://192.168.2.128:5173',
                    'http://localhost:5173',
                    'http://192.168.2.128:5174',
                    'http://localhost:5174',
                    'http://192.168.2.128:8080',
                    'http://localhost:8080',
                    'http://192.168.2.128',
                    'http://localhost',
                ],
                methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
                credentials: true,
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            },
        });
        micro_service_base_1.logger.info('Socket.IO registered with Fastify.');
        // Initialize Socket.IO after Fastify is ready
        fastify.ready().then(() => {
            (0, socket_1.initializeSocketIO)(fastify.io);
            micro_service_base_1.logger.info('Socket.IO initialized successfully');
        });
        // Add health check endpoint
        fastify.get('/health', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
            micro_service_base_1.logger.info('Health check endpoint hit.');
            return { status: 'ok', timestamp: new Date().toISOString() };
        }));
        // Log all routes after server is ready
        fastify.ready(() => {
            micro_service_base_1.logger.info('All registered routes:');
            console.log(fastify.printRoutes());
        });
        // Start Fastify server on port 8080
        yield fastify.listen({ port: port, host: '0.0.0.0' });
        micro_service_base_1.logger.info('Fastify HTTP server with Socket.IO started successfully on port 8080');
    }
    catch (e) {
        micro_service_base_1.logger.error('Failed to start service because of error:', e);
        console.error('Detailed error:', e);
        process.exit(1);
    }
});
setup();
