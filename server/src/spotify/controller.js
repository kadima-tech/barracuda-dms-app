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
exports.SpotifyController = void 0;
const service_1 = require("./service");
class SpotifyController {
    constructor() {
        this.spotifyService = service_1.SpotifyService.getInstance();
    }
    getCurrentlyPlaying(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const track = yield this.spotifyService.getCurrentlyPlaying();
                if (!track) {
                    res.status(204).send();
                    return;
                }
                res.status(200).json(track);
            }
            catch (error) {
                console.error("Error in getCurrentlyPlaying controller:", error);
                res
                    .status(500)
                    .json({ error: "Failed to fetch currently playing track" });
            }
        });
    }
    authorize(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authUrl = yield this.spotifyService.getAuthorizationUrl();
                res.redirect(authUrl);
            }
            catch (error) {
                console.error("Error in authorize controller:", error);
                res.status(500).json({ error: "Failed to generate authorization URL" });
            }
        });
    }
    callback(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { code } = req.query;
                if (!code || typeof code !== "string") {
                    res.status(400).json({ error: "Authorization code is required" });
                    return;
                }
                const success = yield this.spotifyService.exchangeCodeForToken(code);
                if (!success) {
                    res.status(500).json({ error: "Failed to exchange code for token" });
                    return;
                }
                res.redirect("/spotify/dashboard");
            }
            catch (error) {
                console.error("Error in callback controller:", error);
                res.status(500).json({ error: "Failed to process Spotify callback" });
            }
        });
    }
    joinSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sessionId } = req.params;
                // In a real app, you would validate the session ID and handle joining logic
                // For now, we'll just redirect to the dashboard
                res.redirect(`/spotify/dashboard?session=${sessionId}`);
            }
            catch (error) {
                console.error("Error in joinSession controller:", error);
                res.status(500).json({ error: "Failed to join session" });
            }
        });
    }
}
exports.SpotifyController = SpotifyController;
