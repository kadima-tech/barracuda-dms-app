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
const config = {
    APP_URL: "http://192.168.2.128:5173", // Updated IP
};
const spotifyRouter = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    const spotifyService = service_1.SpotifyService.getInstance();
    // Move this to the top of the router function
    fastify.get("/", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield spotifyService.hasValidCredentials())) {
                // Redirect to authorization if no valid credentials
                const authUrl = yield spotifyService.getAuthorizationUrl();
                return reply.redirect(authUrl);
            }
            return reply.redirect(`${config.APP_URL}/spotify/music-dashboard`);
        }
        catch (error) {
            micro_service_base_1.logger.error("Error in root spotify route:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    }));
    // Get currently playing track
    fastify.get("/currently-playing", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            micro_service_base_1.logger.info("Fetching currently playing track");
            const track = yield spotifyService.getCurrentlyPlaying();
            if (!track) {
                // If no track and no credentials, redirect to auth
                if (!(yield spotifyService.hasValidCredentials())) {
                    const authUrl = yield spotifyService.getAuthorizationUrl();
                    return reply.redirect(authUrl);
                }
                // If we have credentials but no track playing
                micro_service_base_1.logger.info("No track currently playing");
                return reply.status(204).send();
            }
            micro_service_base_1.logger.info("Returning track:", track);
            return reply.send(track);
        }
        catch (error) {
            micro_service_base_1.logger.error("Error fetching currently playing track:", error);
            return reply.status(500).send({ error: "Failed to fetch current track" });
        }
    }));
    // Spotify authorization endpoint
    fastify.get("/authorize", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const authUrl = yield spotifyService.getAuthorizationUrl();
            micro_service_base_1.logger.info(`Redirecting to Spotify auth: ${authUrl}`);
            return reply.redirect(authUrl);
        }
        catch (error) {
            micro_service_base_1.logger.error("Error during Spotify authorization:", error);
            return reply.status(500).send({ error: "Authorization failed" });
        }
    }));
    // Spotify callback endpoint
    fastify.get("/callback", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { code, error } = request.query;
            if (error) {
                micro_service_base_1.logger.error("Spotify auth error:", error);
                return reply.redirect(`${config.APP_URL}/spotify/music-dashboard?error=${error}`);
            }
            if (!code) {
                micro_service_base_1.logger.error("No authorization code received");
                return reply.redirect(`${config.APP_URL}/spotify/music-dashboard?error=no_code`);
            }
            const success = yield spotifyService.exchangeCodeForToken(code);
            if (!success) {
                return reply.redirect(`${config.APP_URL}/spotify/music-dashboard?error=token_exchange_failed`);
            }
            // Successfully authenticated, redirect to dashboard
            return reply.redirect(`${config.APP_URL}/spotify/music-dashboard`);
        }
        catch (error) {
            micro_service_base_1.logger.error("Error in callback:", error);
            return reply.redirect(`${config.APP_URL}/spotify/music-dashboard?error=callback_failed`);
        }
    }));
    // Play endpoint
    fastify.put("/player/play", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield spotifyService.hasValidCredentials())) {
                return reply.status(401).send({ error: "Unauthorized" });
            }
            const success = yield spotifyService.playTrack();
            if (!success) {
                return reply.status(500).send({ error: "Failed to play track" });
            }
            return reply.status(204).send();
        }
        catch (error) {
            micro_service_base_1.logger.error("Error playing track:", error);
            return reply.status(500).send({ error: "Failed to play track" });
        }
    }));
    // Pause endpoint
    fastify.put("/player/pause", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield spotifyService.hasValidCredentials())) {
                return reply.status(401).send({ error: "Unauthorized" });
            }
            const success = yield spotifyService.pauseTrack();
            if (!success) {
                return reply.status(500).send({ error: "Failed to pause track" });
            }
            return reply.status(204).send();
        }
        catch (error) {
            micro_service_base_1.logger.error("Error pausing track:", error);
            return reply.status(500).send({ error: "Failed to pause track" });
        }
    }));
    // Next track endpoint
    fastify.post("/player/next", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield spotifyService.hasValidCredentials())) {
                return reply.status(401).send({ error: "Unauthorized" });
            }
            const success = yield spotifyService.skipToNext();
            if (!success) {
                return reply
                    .status(500)
                    .send({ error: "Failed to skip to next track" });
            }
            return reply.status(204).send();
        }
        catch (error) {
            micro_service_base_1.logger.error("Error skipping to next track:", error);
            return reply.status(500).send({ error: "Failed to skip to next track" });
        }
    }));
    // Previous track endpoint
    fastify.post("/player/previous", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if we have valid credentials
            if (!(yield spotifyService.hasValidCredentials())) {
                return reply.status(401).send({ error: "Unauthorized" });
            }
            const success = yield spotifyService.skipToPrevious();
            if (!success) {
                return reply
                    .status(500)
                    .send({ error: "Failed to skip to previous track" });
            }
            return reply.status(204).send();
        }
        catch (error) {
            micro_service_base_1.logger.error("Error skipping to previous track:", error);
            return reply
                .status(500)
                .send({ error: "Failed to skip to previous track" });
        }
    }));
});
exports.default = (fastify, opts, done) => {
    fastify.register(spotifyRouter);
    done();
};
