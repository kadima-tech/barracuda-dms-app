// src/index.ts
import { createMicroService, logger } from '@kadima-tech/micro-service-base';
import deviceRouter from './device/router';
import cacheRouter from './caching/router';
import scheduleRouter from './schedule/router';
import spotifyRouter from './spotify/router';
import { initializeSocketIO } from './socket';
import 'fastify';
import { Server } from 'socket.io';
import exchangeRouter from './exchange/router';
import fastifyCors from '@fastify/cors';
import newsRouter from './news/router';

// Add type declaration to extend FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

const setup = async () => {
  try {
    logger.info('Starting setup of Fastify server...');

    // Get port from environment variable or use default
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    logger.info(`Server will listen on port ${port}`);

    // Setup up Fastify
    const { fastify } = await createMicroService({
      title: 'BarracudaDMS Service',
      routes: [],
    });

    logger.info('Fastify instance created successfully.');

    // Add CORS configuration before registering routes
    await fastify.register(fastifyCors, {
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
        'https://web-564151515476.europe-west1.run.app',
        'https://server-564151515476.europe-west1.run.app',
      ],
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    logger.info('CORS configuration added.');

    // Manually register routes with prefixes
    await fastify.register(deviceRouter, { prefix: '/devices' });
    await fastify.register(cacheRouter, { prefix: '/cache' });
    await fastify.register(scheduleRouter, { prefix: '/schedule' });
    await fastify.register(spotifyRouter, { prefix: '/spotify' });
    await fastify.register(exchangeRouter, { prefix: '/exchange' });
    await fastify.register(newsRouter, { prefix: '/proxy' });

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
          'https://web-564151515476.europe-west1.run.app',
          'https://server-564151515476.europe-west1.run.app',
        ],
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      },
    });

    logger.info('Socket.IO registered with Fastify.');

    // Initialize Socket.IO after Fastify is ready
    fastify.ready().then(() => {
      initializeSocketIO(fastify.io);
      logger.info('Socket.IO initialized successfully');
    });

    // Add health check endpoint
    fastify.get('/health', async (request, reply) => {
      logger.info('Health check endpoint hit.');
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Log all routes after server is ready
    fastify.ready(() => {
      logger.info('All registered routes:');
      console.log(fastify.printRoutes());
    });

    // Start Fastify server on port 8080
    await fastify.listen({ port: port, host: '0.0.0.0' });
    logger.info(
      'Fastify HTTP server with Socket.IO started successfully on port 8080'
    );
  } catch (e) {
    logger.error('Failed to start service because of error:', e);
    console.error('Detailed error:', e);
    process.exit(1);
  }
};

// Self-invoking function to start the server
(async () => {
  try {
    await setup();
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
})();
