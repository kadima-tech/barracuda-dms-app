"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotifyApiResponseSchema = exports.SpotifyCredentialsSchema = exports.CurrentlyPlayingTrackSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
// Schema for the currently playing track
exports.CurrentlyPlayingTrackSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    artist: typebox_1.Type.String(),
    album: typebox_1.Type.String(),
    albumCover: typebox_1.Type.String({ format: "uri" }),
    duration: typebox_1.Type.Number(),
    progress: typebox_1.Type.Number(),
    isPlaying: typebox_1.Type.Boolean(),
    nextTrack: typebox_1.Type.Optional(typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        artist: typebox_1.Type.String(),
        albumCover: typebox_1.Type.String({ format: "uri" }),
    })),
});
// Schema for Spotify API credentials
exports.SpotifyCredentialsSchema = typebox_1.Type.Object({
    accessToken: typebox_1.Type.String(),
    refreshToken: typebox_1.Type.String(),
    expiresAt: typebox_1.Type.Number(),
});
// Schema for Spotify API responses
exports.SpotifyApiResponseSchema = typebox_1.Type.Object({
    is_playing: typebox_1.Type.Boolean(),
    item: typebox_1.Type.Object({
        name: typebox_1.Type.String(),
        artists: typebox_1.Type.Array(typebox_1.Type.Object({ name: typebox_1.Type.String() })),
        album: typebox_1.Type.Object({
            name: typebox_1.Type.String(),
            images: typebox_1.Type.Array(typebox_1.Type.Object({ url: typebox_1.Type.String({ format: "uri" }) })),
        }),
        duration_ms: typebox_1.Type.Number(),
    }),
    progress_ms: typebox_1.Type.Number(),
});
