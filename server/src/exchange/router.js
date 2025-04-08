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
Object.defineProperty(exports, "__esModule", { value: true });
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
const service_1 = require("./service");
const schema_1 = require("./schema");
const config_1 = require("../config");
const controller_1 = require("./controller");
const exchangeRouter = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    const exchangeService = service_1.ExchangeService.getInstance();
    // Root route - redirects to auth if needed
    fastify.get('/', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield exchangeService.hasValidCredentials())) {
                // Redirect to authorization if no valid credentials
                const authUrl = yield exchangeService.getAuthorizationUrl();
                return reply.redirect(authUrl);
            }
            return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard`);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error in root exchange route:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    }));
    // Get all rooms
    fastify.get('/rooms', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield exchangeService.hasValidCredentials())) {
                // Redirect to authorization if no valid credentials
                const authUrl = yield exchangeService.getAuthorizationUrl();
                return reply.redirect(authUrl);
            }
            const rooms = yield exchangeService.getAllRooms();
            return reply.send(rooms);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error fetching rooms:', error);
            return reply.status(500).send({ error: 'Failed to fetch rooms' });
        }
    }));
    // Get room info
    fastify.get('/rooms/:roomId', controller_1.getRoomInfo);
    // Book a room
    fastify.post('/rooms/:roomId/book', {
        schema: {
            body: schema_1.BookingRequestSchema,
        },
    }, (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { roomId } = request.params;
            const bookingRequest = request.body;
            micro_service_base_1.logger.info(`Booking room ${roomId} for ${bookingRequest.duration} minutes`);
            // Check if we have valid credentials
            if (!(yield exchangeService.hasValidCredentials())) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const result = yield exchangeService.bookRoom(roomId, bookingRequest);
            if (!result.success) {
                return reply.status(500).send({ error: 'Failed to book room' });
            }
            return reply.send(result);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error booking room:', error);
            return reply.status(500).send({ error: 'Failed to book room' });
        }
    }));
    // Cancel a meeting
    fastify.delete('/rooms/:roomId/meetings/:meetingId', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { roomId, meetingId } = request.params;
            micro_service_base_1.logger.info(`Cancelling meeting ${meetingId} in room ${roomId}`);
            // Check if we have valid credentials
            if (!(yield exchangeService.hasValidCredentials())) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const result = yield exchangeService.cancelMeeting(roomId, meetingId);
            if (!result.success) {
                return reply
                    .status(500)
                    .send({ error: result.error || 'Failed to cancel meeting' });
            }
            return reply.send({ success: true });
        }
        catch (error) {
            micro_service_base_1.logger.error('Error cancelling meeting:', error);
            return reply.status(500).send({ error: 'Failed to cancel meeting' });
        }
    }));
    // Alternative route to cancel a meeting (using POST instead of DELETE)
    fastify.post('/rooms/:roomId/meetings/cancel', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { roomId } = request.params;
            const { meetingId } = request.body;
            if (!meetingId) {
                return reply
                    .status(400)
                    .send({ error: 'Missing meetingId in request body' });
            }
            micro_service_base_1.logger.info(`[Alternative] Cancelling meeting ${meetingId} in room ${roomId}`);
            // Check if we have valid credentials
            if (!(yield exchangeService.hasValidCredentials())) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }
            const result = yield exchangeService.cancelMeeting(roomId, meetingId);
            if (!result.success) {
                return reply
                    .status(500)
                    .send({ error: result.error || 'Failed to cancel meeting' });
            }
            return reply.send({ success: true });
        }
        catch (error) {
            micro_service_base_1.logger.error('Error cancelling meeting:', error);
            return reply.status(500).send({ error: 'Failed to cancel meeting' });
        }
    }));
    // Microsoft authorization endpoint
    fastify.get('/authorize', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authUrl = yield exchangeService.getAuthorizationUrl();
            micro_service_base_1.logger.info(`Redirecting to Microsoft auth: ${authUrl}`);
            return reply.redirect(authUrl);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error during Microsoft authorization:', error);
            return reply.status(500).send({ error: 'Authorization failed' });
        }
    }));
    // Microsoft callback endpoint
    fastify.get('/callback', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { code, error } = request.query;
            if (error) {
                micro_service_base_1.logger.error('Microsoft auth error:', error);
                return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard?error=${error}`);
            }
            if (!code) {
                micro_service_base_1.logger.error('No authorization code received');
                return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard?error=no_code`);
            }
            const success = yield exchangeService.exchangeCodeForToken(code);
            if (!success) {
                return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard?error=token_exchange_failed`);
            }
            // Successfully authenticated, redirect to dashboard
            return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard`);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error in callback:', error);
            return reply.redirect(`${config_1.config.APP_URL}/room-booking/booking-dashboard?error=callback_failed`);
        }
    }));
    // Add this route for initial auth
    fastify.get('/auth', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authUrl = `https://login.microsoftonline.com/${config_1.config.EXCHANGE_TENANT_ID}/oauth2/v2.0/authorize`;
            const params = new URLSearchParams({
                client_id: config_1.config.EXCHANGE_CLIENT_ID,
                response_type: 'code',
                redirect_uri: config_1.config.EXCHANGE_REDIRECT_URI,
                response_mode: 'query',
                scope: config_1.config.SCOPES.join(' '),
                prompt: 'consent',
                state: request.id,
            });
            return reply.redirect(`${authUrl}?${params.toString()}`);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error initiating auth flow:', error);
            return reply.status(500).send('Error initiating authentication');
        }
    }));
    // Add this route for admin consent
    fastify.get('/admin-consent', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const adminConsentUrl = `https://login.microsoftonline.com/${config_1.config.EXCHANGE_TENANT_ID}/adminconsent`;
            const params = new URLSearchParams({
                client_id: config_1.config.EXCHANGE_CLIENT_ID,
                redirect_uri: config_1.config.EXCHANGE_REDIRECT_URI,
                scope: 'https://graph.microsoft.com/.default',
                state: 'admin_consent',
            });
            return reply.redirect(`${adminConsentUrl}?${params.toString()}`);
        }
        catch (error) {
            micro_service_base_1.logger.error('Error initiating admin consent flow:', error);
            return reply.status(500).send('Error initiating admin consent');
        }
    }));
    // Add this route to check auth status
    fastify.get('/status', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const isAuthenticated = yield exchangeService.hasValidCredentials();
            return reply.send({ authenticated: isAuthenticated });
        }
        catch (error) {
            micro_service_base_1.logger.error('Error checking auth status:', error);
            return reply.status(500).send({
                error: 'Failed to check authentication status',
                authenticated: false,
            });
        }
    }));
});
exports.default = (fastify, opts, done) => {
    fastify.register(exchangeRouter);
    done();
};
