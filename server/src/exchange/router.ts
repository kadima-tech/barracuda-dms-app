import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { logger } from '@kadima-tech/micro-service-base';
import { ExchangeService } from './service';
import { BookingRequestSchema } from './schema';
import { config } from '../config';
import { getRoomInfo } from './controller';

const exchangeRouter = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  const exchangeService = ExchangeService.getInstance();

  // Root route - redirects to auth if needed
  fastify.get('/', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await exchangeService.hasValidCredentials())) {
        // Redirect to authorization if no valid credentials
        const authUrl = await exchangeService.getAuthorizationUrl();
        return reply.redirect(authUrl);
      }
      return reply.redirect(`${config.APP_URL}/room-booking/booking-dashboard`);
    } catch (error) {
      logger.error('Error in root exchange route:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all rooms
  fastify.get('/rooms', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await exchangeService.hasValidCredentials())) {
        // Redirect to authorization if no valid credentials
        const authUrl = await exchangeService.getAuthorizationUrl();
        return reply.redirect(authUrl);
      }

      const rooms = await exchangeService.getAllRooms();
      return reply.send(rooms);
    } catch (error) {
      logger.error('Error fetching rooms:', error);
      return reply.status(500).send({ error: 'Failed to fetch rooms' });
    }
  });

  // Get room info
  fastify.get('/rooms/:roomId', getRoomInfo);

  // Book a room
  fastify.post(
    '/rooms/:roomId/book',
    {
      schema: {
        body: BookingRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { roomId } = request.params as { roomId: string };
        const bookingRequest = request.body as any;

        logger.info(
          `Booking room ${roomId} for ${bookingRequest.duration} minutes`
        );

        // Check if we have valid credentials
        if (!(await exchangeService.hasValidCredentials())) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const result = await exchangeService.bookRoom(roomId, bookingRequest);

        if (!result.success) {
          return reply.status(500).send({ error: 'Failed to book room' });
        }

        return reply.send(result);
      } catch (error) {
        logger.error('Error booking room:', error);
        return reply.status(500).send({ error: 'Failed to book room' });
      }
    }
  );

  // Cancel a meeting
  fastify.delete(
    '/rooms/:roomId/meetings/:meetingId',
    async (request, reply) => {
      try {
        const { roomId, meetingId } = request.params as {
          roomId: string;
          meetingId: string;
        };

        logger.info(`Cancelling meeting ${meetingId} in room ${roomId}`);

        // Check if we have valid credentials
        if (!(await exchangeService.hasValidCredentials())) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const result = await exchangeService.cancelMeeting(roomId, meetingId);

        if (!result.success) {
          return reply
            .status(500)
            .send({ error: result.error || 'Failed to cancel meeting' });
        }

        return reply.send({ success: true });
      } catch (error) {
        logger.error('Error cancelling meeting:', error);
        return reply.status(500).send({ error: 'Failed to cancel meeting' });
      }
    }
  );

  // Alternative route to cancel a meeting (using POST instead of DELETE)
  fastify.post('/rooms/:roomId/meetings/cancel', async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string };
      const { meetingId } = request.body as { meetingId: string };

      if (!meetingId) {
        return reply
          .status(400)
          .send({ error: 'Missing meetingId in request body' });
      }

      logger.info(
        `[Alternative] Cancelling meeting ${meetingId} in room ${roomId}`
      );

      // Check if we have valid credentials
      if (!(await exchangeService.hasValidCredentials())) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const result = await exchangeService.cancelMeeting(roomId, meetingId);

      if (!result.success) {
        return reply
          .status(500)
          .send({ error: result.error || 'Failed to cancel meeting' });
      }

      return reply.send({ success: true });
    } catch (error) {
      logger.error('Error cancelling meeting:', error);
      return reply.status(500).send({ error: 'Failed to cancel meeting' });
    }
  });

  // Microsoft authorization endpoint
  fastify.get('/authorize', async (request, reply) => {
    try {
      const authUrl = await exchangeService.getAuthorizationUrl();
      logger.info(`Redirecting to Microsoft auth: ${authUrl}`);
      return reply.redirect(authUrl);
    } catch (error) {
      logger.error('Error during Microsoft authorization:', error);
      return reply.status(500).send({ error: 'Authorization failed' });
    }
  });

  // Microsoft callback endpoint
  fastify.get('/callback', async (request, reply) => {
    try {
      const { code, error } = request.query as {
        code?: string;
        error?: string;
      };

      if (error) {
        logger.error('Microsoft auth error:', error);
        return reply.redirect(
          `${config.APP_URL}/room-booking/booking-dashboard?error=${error}`
        );
      }

      if (!code) {
        logger.error('No authorization code received');
        return reply.redirect(
          `${config.APP_URL}/room-booking/booking-dashboard?error=no_code`
        );
      }

      const success = await exchangeService.exchangeCodeForToken(code);
      if (!success) {
        return reply.redirect(
          `${config.APP_URL}/room-booking/booking-dashboard?error=token_exchange_failed`
        );
      }

      // Successfully authenticated, redirect to dashboard
      return reply.redirect(`${config.APP_URL}/room-booking/booking-dashboard`);
    } catch (error) {
      logger.error('Error in callback:', error);
      return reply.redirect(
        `${config.APP_URL}/room-booking/booking-dashboard?error=callback_failed`
      );
    }
  });

  // Add this route for initial auth
  fastify.get('/auth', async (request, reply) => {
    try {
      const authUrl = `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/oauth2/v2.0/authorize`;
      const params = new URLSearchParams({
        client_id: config.EXCHANGE_CLIENT_ID,
        response_type: 'code',
        redirect_uri: config.EXCHANGE_REDIRECT_URI,
        response_mode: 'query',
        scope: config.SCOPES.join(' '),
        prompt: 'consent',
        state: request.id,
      });

      return reply.redirect(`${authUrl}?${params.toString()}`);
    } catch (error) {
      logger.error('Error initiating auth flow:', error);
      return reply.status(500).send('Error initiating authentication');
    }
  });

  // Add this route for admin consent
  fastify.get('/admin-consent', async (request, reply) => {
    try {
      const adminConsentUrl = `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/adminconsent`;
      const params = new URLSearchParams({
        client_id: config.EXCHANGE_CLIENT_ID,
        redirect_uri: config.EXCHANGE_REDIRECT_URI,
        scope: 'https://graph.microsoft.com/.default',
        state: 'admin_consent',
      });

      return reply.redirect(`${adminConsentUrl}?${params.toString()}`);
    } catch (error) {
      logger.error('Error initiating admin consent flow:', error);
      return reply.status(500).send('Error initiating admin consent');
    }
  });

  // Add this route to check auth status
  fastify.get('/status', async (request, reply) => {
    try {
      const isAuthenticated = await exchangeService.hasValidCredentials();
      return reply.send({ authenticated: isAuthenticated });
    } catch (error) {
      logger.error('Error checking auth status:', error);
      return reply.status(500).send({
        error: 'Failed to check authentication status',
        authenticated: false,
      });
    }
  });
};

export default (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.register(exchangeRouter);
  done();
};
