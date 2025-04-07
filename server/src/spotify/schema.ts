import { Static, Type } from "@sinclair/typebox";

// Schema for the currently playing track
export const CurrentlyPlayingTrackSchema = Type.Object({
  name: Type.String(),
  artist: Type.String(),
  album: Type.String(),
  albumCover: Type.String({ format: "uri" }),
  duration: Type.Number(),
  progress: Type.Number(),
  isPlaying: Type.Boolean(),
  nextTrack: Type.Optional(
    Type.Object({
      name: Type.String(),
      artist: Type.String(),
      albumCover: Type.String({ format: "uri" }),
    })
  ),
});

export type CurrentlyPlayingTrack = Static<typeof CurrentlyPlayingTrackSchema>;

// Schema for Spotify API credentials
export const SpotifyCredentialsSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
  expiresAt: Type.Number(),
});

export type SpotifyCredentials = Static<typeof SpotifyCredentialsSchema>;

// Schema for Spotify API responses
export const SpotifyApiResponseSchema = Type.Object({
  is_playing: Type.Boolean(),
  item: Type.Object({
    name: Type.String(),
    artists: Type.Array(Type.Object({ name: Type.String() })),
    album: Type.Object({
      name: Type.String(),
      images: Type.Array(Type.Object({ url: Type.String({ format: "uri" }) })),
    }),
    duration_ms: Type.Number(),
  }),
  progress_ms: Type.Number(),
});

export type SpotifyApiResponse = Static<typeof SpotifyApiResponseSchema>;
