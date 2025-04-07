import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { logger } from "@kadima-tech/micro-service-base";
import { ExchangeService } from "./service";
import { BookingRequestSchema } from "./schema";
import { config } from "./service";

const exchangeRouter = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  const exchangeService = ExchangeService.getInstance();

  // Root route - redirects to auth if needed
  fastify.get("/", async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await exchangeService.hasValidCredentials())) {
        // Redirect to authorization if no valid credentials
        const authUrl = await exchangeService.getAuthorizationUrl();
        return reply.redirect(authUrl);
      }
      return reply.redirect(`${config.APP_URL}/room-booking/booking-dashboard`);
    } catch (error) {
      logger.error("Error in root exchange route:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  // Get all rooms
  fastify.get("/rooms", async (request, reply) => {
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
      logger.error("Error fetching rooms:", error);
      return reply.status(500).send({ error: "Failed to fetch rooms" });
    }
  });

  // Get room info
  fastify.get("/rooms/:roomId", async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string };
      // Get query parameters but ALWAYS include all day meetings
      const { showAllDay } = request.query as { showAllDay?: string };

      // Always include all meetings by default
      const includeAllMeetings = true;

      logger.info(
        `Fetching room info for room ID: ${roomId} (including all day meetings by default)`
      );

      // Check if we have valid credentials
      const hasValidCreds = await exchangeService.hasValidCredentials();
      logger.info(`Has valid credentials: ${hasValidCreds}`);

      if (!hasValidCreds) {
        logger.info("No valid credentials, redirecting to auth");
        const authUrl = await exchangeService.getAuthorizationUrl();
        return reply.redirect(authUrl);
      }

      console.log(
        `ENHANCED: Starting room fetch for ${roomId}, explicitly for UI dashboard (with all day meetings)`
      );
      logger.info(
        `ENHANCED: Starting room fetch for ${roomId}, explicitly for UI dashboard (with all day meetings)`
      );

      // Get room info with enhanced logging
      const roomInfo = await exchangeService.getRoomInfo(roomId, {
        forceRefresh: false,
        retryCount: 1,
        expandCalendarView: true,
        includeAllDayMeetings: includeAllMeetings, // Always true
      });

      if (roomInfo) {
        const meetingCount = roomInfo.upcomingMeetings?.length || 0;
        console.log(
          `ENHANCED: Room "${roomInfo.roomName}" has ${meetingCount} upcoming meetings`
        );
        logger.info(
          `ENHANCED: Room "${roomInfo.roomName}" has ${meetingCount} upcoming meetings`
        );

        // Log meeting details for debugging
        if (meetingCount > 0) {
          console.log(
            `ENHANCED: Upcoming meetings found:`,
            JSON.stringify(roomInfo.upcomingMeetings, null, 2)
          );
          logger.info(
            `ENHANCED: Upcoming meetings found:`,
            roomInfo.upcomingMeetings
          );
        } else {
          console.log(
            `ENHANCED: No upcoming meetings for room "${roomInfo.roomName}" (${roomId})`
          );
          logger.warn(
            `ENHANCED: No upcoming meetings for room "${roomInfo.roomName}" (${roomId})`
          );

          // Try to force refresh room info to ensure we get the latest data
          console.log(`ENHANCED: Attempting to force refresh room info`);
          logger.info(`ENHANCED: Attempting to force refresh room info`);

          // Try again with extra parameters
          const refreshedRoomInfo = await exchangeService.getRoomInfo(roomId, {
            forceRefresh: true,
            retryCount: 2,
            expandCalendarView: true,
            includeAllDayMeetings: showAllDay === "true",
          });

          if (
            refreshedRoomInfo &&
            refreshedRoomInfo.upcomingMeetings?.length > 0
          ) {
            console.log(
              `ENHANCED: Force refresh successful! Found ${refreshedRoomInfo.upcomingMeetings.length} meetings`
            );
            logger.info(
              `ENHANCED: Force refresh successful! Found ${refreshedRoomInfo.upcomingMeetings.length} meetings`
            );
            return reply.send(refreshedRoomInfo);
          } else {
            console.log(`ENHANCED: Force refresh did not find any meetings`);
            logger.warn(`ENHANCED: Force refresh did not find any meetings`);
          }
        }
      } else {
        logger.info("No room info found");
        return reply.status(404).send({ error: "Room not found" });
      }

      return reply.send(roomInfo);
    } catch (error) {
      logger.error("Error fetching room info:", error);
      if (error instanceof Error) {
        logger.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      return reply.status(500).send({ error: "Failed to fetch room info" });
    }
  });

  // Book a room
  fastify.post(
    "/rooms/:roomId/book",
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
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const result = await exchangeService.bookRoom(roomId, bookingRequest);

        if (!result.success) {
          return reply.status(500).send({ error: "Failed to book room" });
        }

        return reply.send(result);
      } catch (error) {
        logger.error("Error booking room:", error);
        return reply.status(500).send({ error: "Failed to book room" });
      }
    }
  );

  // Cancel a meeting
  fastify.delete(
    "/rooms/:roomId/meetings/:meetingId",
    async (request, reply) => {
      try {
        const { roomId, meetingId } = request.params as {
          roomId: string;
          meetingId: string;
        };

        logger.info(`Cancelling meeting ${meetingId} in room ${roomId}`);

        // Check if we have valid credentials
        if (!(await exchangeService.hasValidCredentials())) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const result = await exchangeService.cancelMeeting(roomId, meetingId);

        if (!result.success) {
          return reply
            .status(500)
            .send({ error: result.error || "Failed to cancel meeting" });
        }

        return reply.send({ success: true });
      } catch (error) {
        logger.error("Error cancelling meeting:", error);
        return reply.status(500).send({ error: "Failed to cancel meeting" });
      }
    }
  );

  // Alternative route to cancel a meeting (using POST instead of DELETE)
  fastify.post("/rooms/:roomId/meetings/cancel", async (request, reply) => {
    try {
      const { roomId } = request.params as { roomId: string };
      const { meetingId } = request.body as { meetingId: string };

      if (!meetingId) {
        return reply
          .status(400)
          .send({ error: "Missing meetingId in request body" });
      }

      logger.info(
        `[Alternative] Cancelling meeting ${meetingId} in room ${roomId}`
      );

      // Check if we have valid credentials
      if (!(await exchangeService.hasValidCredentials())) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const result = await exchangeService.cancelMeeting(roomId, meetingId);

      if (!result.success) {
        return reply
          .status(500)
          .send({ error: result.error || "Failed to cancel meeting" });
      }

      return reply.send({ success: true });
    } catch (error) {
      logger.error("Error cancelling meeting:", error);
      return reply.status(500).send({ error: "Failed to cancel meeting" });
    }
  });

  // Microsoft authorization endpoint
  fastify.get("/authorize", async (request, reply) => {
    try {
      const authUrl = await exchangeService.getAuthorizationUrl();
      logger.info(`Redirecting to Microsoft auth: ${authUrl}`);
      return reply.redirect(authUrl);
    } catch (error) {
      logger.error("Error during Microsoft authorization:", error);
      return reply.status(500).send({ error: "Authorization failed" });
    }
  });

  // Microsoft callback endpoint
  fastify.get("/callback", async (request, reply) => {
    try {
      const { code, error } = request.query as {
        code?: string;
        error?: string;
      };

      if (error) {
        logger.error("Microsoft auth error:", error);
        return reply.redirect(
          `${config.APP_URL}/room-booking/booking-dashboard?error=${error}`
        );
      }

      if (!code) {
        logger.error("No authorization code received");
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
      logger.error("Error in callback:", error);
      return reply.redirect(
        `${config.APP_URL}/room-booking/booking-dashboard?error=callback_failed`
      );
    }
  });

  // Add this route for initial auth
  fastify.get("/auth", async (request, reply) => {
    try {
      const authUrl = `https://login.microsoftonline.com/${config.TENANT_ID}/oauth2/v2.0/authorize`;
      const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        response_type: "code",
        redirect_uri: config.REDIRECT_URI,
        response_mode: "query",
        scope: [
          "https://graph.microsoft.com/Calendars.ReadWrite",
          "https://graph.microsoft.com/Place.Read.All",
          "https://graph.microsoft.com/User.Read",
          "offline_access",
        ].join(" "),
        prompt: "consent",
        state: request.id,
      });

      return reply.redirect(`${authUrl}?${params.toString()}`);
    } catch (error) {
      logger.error("Error initiating auth flow:", error);
      return reply.status(500).send("Error initiating authentication");
    }
  });

  // Add this route for admin consent
  fastify.get("/admin-consent", async (request, reply) => {
    try {
      const adminConsentUrl = `https://login.microsoftonline.com/${config.TENANT_ID}/adminconsent`;
      const params = new URLSearchParams({
        client_id: config.CLIENT_ID,
        redirect_uri: config.REDIRECT_URI,
        scope: "https://graph.microsoft.com/.default",
        state: request.id,
      });

      return reply.redirect(`${adminConsentUrl}?${params.toString()}`);
    } catch (error) {
      logger.error("Error initiating admin consent flow:", error);
      return reply.status(500).send("Error initiating admin consent");
    }
  });

  // Add this route to check auth status
  fastify.get("/status", async (request, reply) => {
    try {
      const isAuthenticated = await exchangeService.hasValidCredentials();
      return reply.send({ authenticated: isAuthenticated });
    } catch (error) {
      logger.error("Error checking auth status:", error);
      return reply.status(500).send({
        error: "Failed to check authentication status",
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
