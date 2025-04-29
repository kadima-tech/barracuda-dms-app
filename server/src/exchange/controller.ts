import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ExchangeService } from './service';
import { logger } from '@kadima-tech/micro-service-base';
import { BookingRequest } from './schema';
import { config } from '../config';

const exchangeService = ExchangeService.getInstance();

// Define plugin to register routes
export default async function exchangeRoutes(fastify: FastifyInstance) {
  // Add this special proxy handler at the top of the routes function
  fastify.get(
    '/proxy-redirect',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        logger.info('Handling proxy redirect');
        // Redirect to the actual app URL with successful authentication
        return reply.redirect(
          `${config.APP_URL}/room-booking/booking-dashboard`
        );
      } catch (error) {
        logger.error('Error in proxy redirect:', error);
        return reply.code(500).send('Error redirecting');
      }
    }
  );

  // Update the REDIRECT_URI to use localhost but redirect to our proxy
  const actualAppUrl = config.APP_URL; // Store the actual app URL for redirects
  // This is a hack to make Azure AD happy while still working with IP addresses
  // if (!process.env.EXCHANGE_REDIRECT_URI) {
  //   // Only override if not explicitly set
  //   process.env.EXCHANGE_REDIRECT_URI =
  //     'https://web-564151515476.europe-west1.run.app/exchange/callback';
  // }
  process.env.EXCHANGE_REDIRECT_URI =
    'https://server-564151515476.europe-west1.run.app/exchange/callback';

  // Endpoint to initiate OAuth flow
  fastify.get(
    '/auth',
    async (
      request: FastifyRequest<{
        Querystring: {
          admin_consent?: string;
          return_host?: string;
          t?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { admin_consent, return_host } = request.query;
        logger.info(
          `Auth request with admin_consent=${admin_consent}, return_host=${return_host}`
        );

        // Create a state object with return_host and other metadata
        const stateObj = {
          flow: 'authentication',
          timestamp: Date.now(),
          return_host: return_host || null,
          admin_consent: admin_consent === 'true',
        };

        const stateString = Buffer.from(JSON.stringify(stateObj)).toString(
          'base64'
        );
        logger.info(
          `Generated state parameter with payload: ${JSON.stringify(stateObj)}`
        );

        // Get authorization URL - if admin_consent=true, use the admin consent version
        const useAdminConsent = admin_consent === 'true';
        const authUrl = await exchangeService.getAuthorizationUrl(
          stateString,
          useAdminConsent
        );

        logger.info(`Redirecting to auth URL: ${authUrl}`);
        return reply.redirect(authUrl);
      } catch (error) {
        logger.error('Error initiating auth flow:', error);
        return reply.code(500).send(`
          <html>
            <body>
              <h2>Authentication Error</h2>
              <p>Error initiating authentication: ${
                error instanceof Error ? error.message : 'Unknown error'
              }</p>
              <p><a href="/">Return to dashboard</a></p>
            </body>
          </html>
        `);
      }
    }
  );

  // Special endpoint just for admin consent
  fastify.get(
    '/admin-consent',
    async (
      request: FastifyRequest<{
        Querystring: { return_host?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { return_host } = request.query;
        logger.info(
          'Admin consent initiated, capturing return host:',
          return_host
        );

        // Generate a state that includes return information if needed
        const stateObj = {
          flow: 'admin_consent',
          timestamp: Date.now(),
          return_host: return_host || null,
        };
        const stateParam = Buffer.from(JSON.stringify(stateObj)).toString(
          'base64'
        );

        // Get admin consent URL using new parameter
        const adminConsentUrl = await exchangeService.getAuthorizationUrl(
          stateParam,
          true
        );

        logger.info(
          `Admin consent requested. Redirecting to: ${adminConsentUrl}`
        );
        return reply.redirect(adminConsentUrl);
      } catch (error) {
        logger.error('Error initiating admin consent flow:', error);
        return reply.code(500).send(`
          <html>
            <body>
              <h2>Error Requesting Admin Consent</h2>
              <p>There was a problem initiating the admin consent flow: ${
                error instanceof Error ? error.message : 'Unknown error'
              }</p>
              <p>Please ensure you are using an account with administrative privileges for your Azure AD tenant.</p>
              <p><a href="/">Return to dashboard</a></p>
            </body>
          </html>
        `);
      }
    }
  );

  // Callback endpoint for OAuth response
  fastify.get(
    '/callback',
    async (
      request: FastifyRequest<{
        Querystring: {
          code?: string;
          state?: string;
          error?: string;
          error_description?: string;
          admin_consent?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const query = request.query;
        logger.info(`Received callback with query: ${JSON.stringify(query)}`);

        // Handle admin consent response
        if (query.admin_consent === 'true') {
          logger.info('Admin consent was granted');
          return reply.code(200).type('text/html').send(`
            <html>
              <body>
                <h2>Admin Consent Granted</h2>
                <p>Your administrator has granted consent for the application to access Microsoft Graph API.</p>
                <p>You can now return to the application and try authentication again.</p>
                <p><a href="/">Return to dashboard</a></p>
              </body>
            </html>
          `);
        }

        // Parse state parameter if possible to extract return_host
        let returnHost: string | undefined;
        if (query.state) {
          try {
            const stateBuffer = Buffer.from(query.state, 'base64');
            const stateData = JSON.parse(stateBuffer.toString());

            // Extract return_host from state if present
            if (stateData && stateData.return_host) {
              returnHost = stateData.return_host;
              logger.info(`Extracted return_host from state: ${returnHost}`);
            }

            // Check if this was an admin consent flow
            if (stateData && stateData.flow === 'admin_consent') {
              logger.info('This was an admin consent flow');
              // If we got here without an admin_consent=true parameter, it means the user didn't complete admin consent
              if (query.error) {
                logger.error(
                  `Admin consent error: ${query.error} - ${
                    query.error_description || 'No description'
                  }`
                );
                return reply.code(400).type('text/html').send(`
                  <html>
                    <body>
                      <h2>Admin Consent Was Not Granted</h2>
                      <p>Error: ${query.error}</p>
                      <p>Description: ${
                        query.error_description || 'No description provided'
                      }</p>
                      <p>The administrator didn't grant consent for the application.</p>
                      <p>Please ensure you're signed in with an administrator account for your organization.</p>
                      <p><a href="/">Return to dashboard</a></p>
                    </body>
                  </html>
                `);
              }

              return reply.code(200).type('text/html').send(`
                <html>
                  <body>
                    <h2>Admin Consent Process Complete</h2>
                    <p>The admin consent process has been completed.</p>
                    <p>You can now return to the application and continue.</p>
                    <p><a href="/">Return to dashboard</a></p>
                  </body>
                </html>
              `);
            }
          } catch (err) {
            logger.error('Failed to parse state parameter:', err);
            // Continue with normal flow if state parsing fails
          }
        }

        // Check for error in the OAuth response
        if (query.error) {
          const errorDesc = query.error_description || 'Unknown error';
          logger.error(`Authentication error: ${query.error} - ${errorDesc}`);

          // Provide a user-friendly error response
          return reply.code(400).type('text/html').send(`
              <html>
                <body>
                  <h2>Authentication Failed</h2>
                  <p>Error: ${query.error}</p>
                  <p>Description: ${errorDesc}</p>
                  <p>Please contact your administrator to ensure proper permissions are granted.</p>
                  <p><a href="/">Return to dashboard</a></p>
                </body>
              </html>
            `);
        }

        // Check for authorization code
        if (!query.code) {
          logger.error('No authorization code received in callback');
          return reply.redirect('/?error=no_code');
        }

        logger.info('Authorization code received, exchanging for tokens');

        // Get the return host from query parameters or state
        const success = await exchangeService.exchangeCodeForToken(query.code);

        if (success) {
          logger.info('Token exchange successful, redirecting to dashboard');

          // Redirect to the appropriate host (either localhost or the original host)
          if (returnHost) {
            return reply.redirect(
              `http://${returnHost}:5173/exchange/dashboard`
            );
          } else {
            return reply.redirect('/exchange/dashboard');
          }
        } else {
          logger.error('Token exchange failed, redirecting to error page');

          // Redirect with error
          if (returnHost) {
            return reply.redirect(
              `http://${returnHost}:5173/exchange/dashboard?error=token_exchange_failed`
            );
          } else {
            return reply.redirect(
              '/exchange/dashboard?error=token_exchange_failed'
            );
          }
        }
      } catch (error) {
        logger.error(`Error in callback handler: ${error}`);
        return reply.redirect('/?error=callback_error');
      }
    }
  );

  // Endpoint to check auth status
  fastify.get(
    '/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const isAuthenticated = await exchangeService.hasValidCredentials();
        logger.info(
          `Auth status check: ${
            isAuthenticated ? 'Authenticated' : 'Not authenticated'
          }`
        );
        return reply.send({ authenticated: isAuthenticated });
      } catch (error) {
        logger.error('Error checking auth status:', error);
        return reply
          .code(500)
          .send({ authenticated: false, error: 'Error checking status' });
      }
    }
  );

  // Endpoint to get all rooms
  fastify.get(
    '/rooms',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        logger.info('Fetching all rooms');
        const rooms = await exchangeService.getAllRooms();
        logger.info(`Retrieved ${rooms?.length || 0} rooms`);

        // Check if rooms is undefined, null, or empty array
        if (!rooms || (Array.isArray(rooms) && rooms.length === 0)) {
          logger.warn('No rooms found or empty rooms array returned');
          return reply.send({ rooms: [], message: 'No rooms available' });
        }

        return reply.send({ rooms });
      } catch (error) {
        logger.error('Error fetching rooms:', error);
        return reply.code(500).send({
          error: 'Failed to fetch rooms',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Endpoint to get room info
  fastify.get(
    '/rooms/:roomId',
    async (
      request: FastifyRequest<{
        Params: { roomId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { roomId } = request.params;

        if (!roomId) {
          return reply.code(400).send({ error: 'Room ID is required' });
        }

        const roomInfo = await exchangeService.getRoomInfo(roomId);

        if (!roomInfo) {
          return reply.code(404).send({ error: 'Room not found' });
        }

        return reply.send(roomInfo);
      } catch (error) {
        logger.error('Error fetching room info:', error);
        return reply.code(500).send({ error: 'Failed to fetch room info' });
      }
    }
  );

  // Endpoint to book a room
  fastify.post(
    '/rooms/:roomId/book',
    {
      schema: {
        body: {
          type: 'object',
          required: ['duration'],
          properties: {
            duration: { type: 'number' },
            title: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { roomId: string };
        Body: BookingRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { roomId } = request.params;
        const bookingRequest = request.body;

        if (!roomId) {
          return reply.code(400).send({ error: 'Room ID is required' });
        }

        const result = await exchangeService.bookRoom(roomId, bookingRequest);

        if (!result.success) {
          return reply.code(500).send({ error: 'Failed to book room' });
        }

        return reply.send(result);
      } catch (error) {
        logger.error('Error booking room:', error);
        return reply.code(500).send({ error: 'Failed to book room' });
      }
    }
  );
}

export async function getRoomInfo(
  request: FastifyRequest<{
    Params: { roomId: string };
  }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const roomId = request.params.roomId;

  try {
    logger.info(`[CONTROLLER] Getting room info for room ID: ${roomId}`);

    if (!exchangeService) {
      logger.error('[CONTROLLER] Exchange service not initialized');
      return reply.code(500).send({
        success: false,
        error: 'Exchange service not initialized',
      });
    }

    logger.info(
      `[CONTROLLER] Auth validated, fetching room info for ${roomId}`
    );
    console.log(`[CONTROLLER] Fetching room info for room ID: ${roomId}`);

    const roomInfo = await exchangeService.getRoomInfo(roomId);

    if (!roomInfo) {
      logger.error(
        `[CONTROLLER] Room not found or error retrieving room info for ${roomId}`
      );
      return reply.code(404).send({
        success: false,
        error: 'Room not found or error retrieving room info',
      });
    }

    logger.info(`[CONTROLLER] Successfully retrieved room info for ${roomId}`);
    console.log(`[CONTROLLER] Room info: ${JSON.stringify(roomInfo, null, 2)}`);

    // Log specifically if we have any meetings
    if (roomInfo.upcomingMeetings && roomInfo.upcomingMeetings.length > 0) {
      logger.info(
        `[CONTROLLER] Room has ${roomInfo.upcomingMeetings.length} upcoming meetings`
      );
      console.log(
        `[CONTROLLER] Upcoming meetings: ${JSON.stringify(
          roomInfo.upcomingMeetings,
          null,
          2
        )}`
      );
    } else {
      logger.warn(`[CONTROLLER] No upcoming meetings found for room ${roomId}`);
      console.log(`[CONTROLLER] No upcoming meetings found for room ${roomId}`);
    }

    return reply.send(roomInfo);
  } catch (error) {
    logger.error(`[CONTROLLER] Error getting room info: ${error}`);
    console.error(`[CONTROLLER] Error getting room info:`, error);

    // Check for specific error types and return appropriate responses
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'AuthError'
    ) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication error',
        details: error instanceof Error ? error.message : String(error),
      });
    }

    return reply.code(500).send({
      success: false,
      error: `Failed to get room info: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}
