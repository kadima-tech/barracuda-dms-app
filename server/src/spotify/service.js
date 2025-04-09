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
exports.SpotifyService = void 0;
const config_1 = require("../config");
const micro_service_base_1 = require("@kadima-tech/micro-service-base");
// In-memory storage for credentials (in a real app, use a database)
let spotifyCredentials = null;
class SpotifyService {
    constructor() {
        this.baseUrl = "https://api.spotify.com/v1";
        this.lastApiCall = {};
        this.cache = {};
        this.CACHE_TTL = 5000; // 5 seconds cache
        this.API_RATE_LIMIT = 1000; // 1 second between calls to same endpoint
        // Private constructor for singleton pattern
    }
    shouldThrottle(endpoint) {
        const now = Date.now();
        const lastCall = this.lastApiCall[endpoint] || 0;
        return now - lastCall < this.API_RATE_LIMIT;
    }
    updateLastApiCall(endpoint) {
        this.lastApiCall[endpoint] = Date.now();
    }
    getCachedData(key) {
        const cached = this.cache[key];
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }
    setCachedData(key, data) {
        this.cache[key] = {
            data,
            timestamp: Date.now(),
        };
    }
    initializeCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({
                    grant_type: "client_credentials",
                });
                const authHeader = `Basic ${Buffer.from(`${config_1.config.SPOTIFY_CLIENT_ID}:${config_1.config.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
                const response = yield fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: authHeader,
                    },
                    body: params,
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                spotifyCredentials = {
                    accessToken: data.access_token,
                    refreshToken: "", // Client credentials flow doesn't provide refresh token
                    expiresAt: Date.now() + data.expires_in * 1000,
                };
                return true;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error initializing Spotify credentials:", error);
                return false;
            }
        });
    }
    static getInstance() {
        if (!SpotifyService.instance) {
            SpotifyService.instance = new SpotifyService();
        }
        return SpotifyService.instance;
    }
    getCurrentlyPlaying() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    micro_service_base_1.logger.info("No user authorization token available");
                    return null;
                }
                const endpoint = "/me/player/currently-playing";
                // Check cache first
                const cached = this.getCachedData(endpoint);
                if (cached) {
                    return this.formatTrackResponse(cached);
                }
                // Respect rate limiting
                if (this.shouldThrottle(endpoint)) {
                    const lastKnownState = this.getCachedData(endpoint);
                    if (lastKnownState) {
                        return this.formatTrackResponse(lastKnownState);
                    }
                    return null;
                }
                this.updateLastApiCall(endpoint);
                const response = yield fetch(`${this.baseUrl}${endpoint}`, {
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                micro_service_base_1.logger.info(`Spotify API response status: ${response.status}`);
                if (response.status === 401) {
                    micro_service_base_1.logger.info("Received 401, attempting token refresh...");
                    if (yield this.refreshAccessToken()) {
                        micro_service_base_1.logger.info("Token refreshed, retrying request...");
                        return this.getCurrentlyPlaying();
                    }
                    return null;
                }
                if (response.status === 204) {
                    micro_service_base_1.logger.info("No track currently playing");
                    return null;
                }
                if (response.status === 429) {
                    // If rate limited, use cached data
                    const lastKnownState = this.getCachedData(endpoint);
                    if (lastKnownState) {
                        return this.formatTrackResponse(lastKnownState);
                    }
                    return null;
                }
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                this.setCachedData(endpoint, data);
                return this.formatTrackResponse(data);
            }
            catch (error) {
                micro_service_base_1.logger.error("Error fetching currently playing track:", error);
                return null;
            }
        });
    }
    refreshAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.refreshToken)) {
                    // If no refresh token, try client credentials
                    return this.initializeCredentials();
                }
                const params = new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: spotifyCredentials.refreshToken,
                });
                const authHeader = `Basic ${Buffer.from(`${config_1.config.SPOTIFY_CLIENT_ID}:${config_1.config.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`;
                const response = yield fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: authHeader,
                    },
                    body: params,
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                spotifyCredentials = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token || spotifyCredentials.refreshToken,
                    expiresAt: Date.now() + data.expires_in * 1000,
                };
                return true;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error refreshing access token:", error);
                return false;
            }
        });
    }
    setCredentials(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            spotifyCredentials = credentials;
        });
    }
    getAuthorizationUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            const scopes = [
                "user-read-currently-playing",
                "user-read-playback-state",
                "user-modify-playback-state",
                "streaming",
                "user-read-email",
                "user-read-private",
                "app-remote-control",
                "user-read-playback-position",
                "user-modify-playback-state",
                "user-read-playback-state",
                "user-read-currently-playing",
                "playlist-modify-public",
                "playlist-modify-private",
                "playlist-read-private",
                "playlist-read-collaborative",
                "user-library-modify",
                "user-library-read",
                "user-follow-modify",
                "user-follow-read",
                "user-read-recently-played",
                "user-top-read",
            ];
            const state = this.generateRandomString(16);
            const params = new URLSearchParams({
                response_type: "code",
                client_id: config_1.config.SPOTIFY_CLIENT_ID,
                scope: scopes.join(" "),
                redirect_uri: config_1.config.SPOTIFY_REDIRECT_URI,
                state: state,
            });
            micro_service_base_1.logger.info(`Using redirect URI: ${config_1.config.SPOTIFY_REDIRECT_URI}`);
            return `https://accounts.spotify.com/authorize?${params.toString()}`;
        });
    }
    exchangeCodeForToken(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = new URLSearchParams({
                    code: code,
                    redirect_uri: config_1.config.SPOTIFY_REDIRECT_URI,
                    grant_type: "authorization_code",
                });
                const response = yield fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${Buffer.from(`${config_1.config.SPOTIFY_CLIENT_ID}:${config_1.config.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                    },
                    body: params.toString(),
                });
                const data = yield response.json();
                if (!response.ok) {
                    micro_service_base_1.logger.error("Token exchange failed:", data);
                    return false;
                }
                spotifyCredentials = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: Date.now() + data.expires_in * 1000,
                };
                return true;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error exchanging code for token:", error);
                return false;
            }
        });
    }
    static ensureValidToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!spotifyCredentials) {
                return false;
            }
            if (Date.now() >= spotifyCredentials.expiresAt - 60000) {
                return yield SpotifyService.instance.refreshAccessToken();
            }
            return true;
        });
    }
    generateRandomString(length) {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    formatTrackResponse(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            // Get next track from cache if available
            let nextTrack = undefined;
            const queueData = this.getCachedData("/me/player/queue");
            if (!queueData && !this.shouldThrottle("/me/player/queue")) {
                try {
                    this.updateLastApiCall("/me/player/queue");
                    const queueResponse = yield fetch(`${this.baseUrl}/me/player/queue`, {
                        headers: {
                            Authorization: `Bearer ${spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken}`,
                        },
                    });
                    if (queueResponse.ok) {
                        const freshQueueData = yield queueResponse.json();
                        this.setCachedData("/me/player/queue", freshQueueData);
                        if (freshQueueData.queue && freshQueueData.queue.length > 0) {
                            const next = freshQueueData.queue[0];
                            nextTrack = {
                                name: next.name,
                                artist: next.artists.map((a) => a.name).join(", "),
                                albumCover: ((_a = next.album.images[0]) === null || _a === void 0 ? void 0 : _a.url) || "",
                            };
                        }
                    }
                }
                catch (queueError) {
                    micro_service_base_1.logger.error("Error fetching queue:", queueError);
                }
            }
            else if ((_b = queueData === null || queueData === void 0 ? void 0 : queueData.queue) === null || _b === void 0 ? void 0 : _b[0]) {
                const next = queueData.queue[0];
                nextTrack = {
                    name: next.name,
                    artist: next.artists.map((a) => a.name).join(", "),
                    albumCover: ((_c = next.album.images[0]) === null || _c === void 0 ? void 0 : _c.url) || "",
                };
            }
            return {
                name: data.item.name,
                artist: data.item.artists.map((artist) => artist.name).join(", "),
                album: data.item.album.name,
                albumCover: ((_d = data.item.album.images[0]) === null || _d === void 0 ? void 0 : _d.url) || "",
                duration: data.item.duration_ms,
                progress: data.progress_ms,
                isPlaying: data.is_playing,
                nextTrack: nextTrack,
            };
        });
    }
    hasValidCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            return SpotifyService.ensureValidToken();
        });
    }
    getActiveDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    return null;
                }
                const response = yield fetch(`${this.baseUrl}/me/player/devices`, {
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        if (yield this.refreshAccessToken()) {
                            return this.getActiveDevice();
                        }
                    }
                    return null;
                }
                const data = yield response.json();
                const activeDevice = data.devices.find((device) => device.is_active);
                return (activeDevice === null || activeDevice === void 0 ? void 0 : activeDevice.id) || ((_a = data.devices[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error getting active device:", error);
                return null;
            }
        });
    }
    transferPlayback(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    return false;
                }
                const response = yield fetch(`${this.baseUrl}/me/player`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        device_ids: [deviceId],
                    }),
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        if (yield this.refreshAccessToken()) {
                            return this.transferPlayback(deviceId);
                        }
                    }
                    return false;
                }
                return true;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error transferring playback:", error);
                return false;
            }
        });
    }
    playTrack() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    micro_service_base_1.logger.info("No user authorization token available");
                    return false;
                }
                const deviceId = yield this.getActiveDevice();
                if (!deviceId) {
                    micro_service_base_1.logger.info("No active device found");
                    return false;
                }
                // Get current playback state
                const stateResponse = yield fetch(`${this.baseUrl}/me/player`, {
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (!stateResponse.ok) {
                    if (stateResponse.status === 401) {
                        if (yield this.refreshAccessToken()) {
                            return this.playTrack();
                        }
                    }
                    return false;
                }
                const state = yield stateResponse.json();
                // Only transfer if the device is not active
                if (((_a = state.device) === null || _a === void 0 ? void 0 : _a.id) !== deviceId) {
                    yield this.transferPlayback(deviceId);
                }
                const response = yield fetch(`${this.baseUrl}/me/player/play?device_id=${deviceId}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (response.status === 401) {
                    micro_service_base_1.logger.info("Received 401, attempting token refresh...");
                    if (yield this.refreshAccessToken()) {
                        micro_service_base_1.logger.info("Token refreshed, retrying request...");
                        return this.playTrack();
                    }
                    return false;
                }
                return response.ok;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error playing track:", error);
                return false;
            }
        });
    }
    pauseTrack() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    micro_service_base_1.logger.info("No user authorization token available");
                    return false;
                }
                const deviceId = yield this.getActiveDevice();
                if (!deviceId) {
                    micro_service_base_1.logger.info("No active device found");
                    return false;
                }
                // Get current playback state
                const stateResponse = yield fetch(`${this.baseUrl}/me/player`, {
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (!stateResponse.ok) {
                    if (stateResponse.status === 401) {
                        if (yield this.refreshAccessToken()) {
                            return this.pauseTrack();
                        }
                    }
                    return false;
                }
                const state = yield stateResponse.json();
                // Only transfer if the device is not active
                if (((_a = state.device) === null || _a === void 0 ? void 0 : _a.id) !== deviceId) {
                    yield this.transferPlayback(deviceId);
                }
                const response = yield fetch(`${this.baseUrl}/me/player/pause?device_id=${deviceId}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (response.status === 401) {
                    micro_service_base_1.logger.info("Received 401, attempting token refresh...");
                    if (yield this.refreshAccessToken()) {
                        micro_service_base_1.logger.info("Token refreshed, retrying request...");
                        return this.pauseTrack();
                    }
                    return false;
                }
                return response.ok;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error pausing track:", error);
                return false;
            }
        });
    }
    skipToNext() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    micro_service_base_1.logger.info("No user authorization token available");
                    return false;
                }
                const deviceId = yield this.getActiveDevice();
                if (!deviceId) {
                    micro_service_base_1.logger.info("No active device found");
                    return false;
                }
                const response = yield fetch(`${this.baseUrl}/me/player/next?device_id=${deviceId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (response.status === 401) {
                    micro_service_base_1.logger.info("Received 401, attempting token refresh...");
                    if (yield this.refreshAccessToken()) {
                        micro_service_base_1.logger.info("Token refreshed, retrying request...");
                        return this.skipToNext();
                    }
                    return false;
                }
                return response.ok;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error skipping to next track:", error);
                return false;
            }
        });
    }
    skipToPrevious() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(spotifyCredentials === null || spotifyCredentials === void 0 ? void 0 : spotifyCredentials.accessToken)) {
                    micro_service_base_1.logger.info("No user authorization token available");
                    return false;
                }
                const deviceId = yield this.getActiveDevice();
                if (!deviceId) {
                    micro_service_base_1.logger.info("No active device found");
                    return false;
                }
                const response = yield fetch(`${this.baseUrl}/me/player/previous?device_id=${deviceId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${spotifyCredentials.accessToken}`,
                    },
                });
                if (response.status === 401) {
                    micro_service_base_1.logger.info("Received 401, attempting token refresh...");
                    if (yield this.refreshAccessToken()) {
                        micro_service_base_1.logger.info("Token refreshed, retrying request...");
                        return this.skipToPrevious();
                    }
                    return false;
                }
                return response.ok;
            }
            catch (error) {
                micro_service_base_1.logger.error("Error skipping to previous track:", error);
                return false;
            }
        });
    }
}
exports.SpotifyService = SpotifyService;
