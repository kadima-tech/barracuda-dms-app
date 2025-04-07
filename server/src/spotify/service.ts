import {
  CurrentlyPlayingTrack,
  SpotifyApiResponse,
  SpotifyCredentials,
} from "./schema";
import { config } from "../config";
import { logger } from "@kadima-tech/micro-service-base";

// In-memory storage for credentials (in a real app, use a database)
let spotifyCredentials: SpotifyCredentials | null = null;



interface SpotifyUserProfile {
  display_name: string;
  images?: Array<{ url: string }>;
  id: string;
  email?: string;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private baseUrl = "https://api.spotify.com/v1";
  private lastApiCall: { [key: string]: number } = {};
  private cache: { [key: string]: { data: any; timestamp: number } } = {};
  private CACHE_TTL = 5000; // 5 seconds cache
  private API_RATE_LIMIT = 1000; // 1 second between calls to same endpoint

  private constructor() {
    // Private constructor for singleton pattern
  }

  private shouldThrottle(endpoint: string): boolean {
    const now = Date.now();
    const lastCall = this.lastApiCall[endpoint] || 0;
    return now - lastCall < this.API_RATE_LIMIT;
  }

  private updateLastApiCall(endpoint: string) {
    this.lastApiCall[endpoint] = Date.now();
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache[key];
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  private async initializeCredentials(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        grant_type: "client_credentials",
      });

      const authHeader = `Basic ${Buffer.from(
        `${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`;

      const response = await fetch("https://accounts.spotify.com/api/token", {
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

      const data = await response.json();

      spotifyCredentials = {
        accessToken: data.access_token,
        refreshToken: "", // Client credentials flow doesn't provide refresh token
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return true;
    } catch (error) {
      logger.error("Error initializing Spotify credentials:", error);
      return false;
    }
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  async getCurrentlyPlaying(): Promise<CurrentlyPlayingTrack | null> {
    try {
      if (!spotifyCredentials?.accessToken) {
        logger.info("No user authorization token available");
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
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${spotifyCredentials.accessToken}`,
        },
      });

      logger.info(`Spotify API response status: ${response.status}`);

      if (response.status === 401) {
        logger.info("Received 401, attempting token refresh...");
        if (await this.refreshAccessToken()) {
          logger.info("Token refreshed, retrying request...");
          return this.getCurrentlyPlaying();
        }
        return null;
      }

      if (response.status === 204) {
        logger.info("No track currently playing");
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

      const data = await response.json();
      this.setCachedData(endpoint, data);

      return this.formatTrackResponse(data);
    } catch (error) {
      logger.error("Error fetching currently playing track:", error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!spotifyCredentials?.refreshToken) {
        // If no refresh token, try client credentials
        return this.initializeCredentials();
      }

      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: spotifyCredentials.refreshToken,
      });

      const authHeader = `Basic ${Buffer.from(
        `${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`;

      const response = await fetch("https://accounts.spotify.com/api/token", {
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

      const data = await response.json();

      spotifyCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || spotifyCredentials.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return true;
    } catch (error) {
      logger.error("Error refreshing access token:", error);
      return false;
    }
  }

  async setCredentials(credentials: SpotifyCredentials): Promise<void> {
    spotifyCredentials = credentials;
  }

  async getAuthorizationUrl(): Promise<string> {
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
      client_id: config.SPOTIFY_CLIENT_ID,
      scope: scopes.join(" "),
      redirect_uri: config.SPOTIFY_REDIRECT_URI,
      state: state,
    });

    logger.info(`Using redirect URI: ${config.SPOTIFY_REDIRECT_URI}`);

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        code: code,
        redirect_uri: config.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${config.SPOTIFY_CLIENT_ID}:${config.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        logger.error("Token exchange failed:", data);
        return false;
      }

      spotifyCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return true;
    } catch (error) {
      logger.error("Error exchanging code for token:", error);
      return false;
    }
  }

  private static async ensureValidToken(): Promise<boolean> {
    if (!spotifyCredentials) {
      return false;
    }

    if (Date.now() >= spotifyCredentials.expiresAt - 60000) {
      return await SpotifyService.instance.refreshAccessToken();
    }

    return true;
  }

  private generateRandomString(length: number): string {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  private async formatTrackResponse(data: any): Promise<CurrentlyPlayingTrack> {
    // Get next track from cache if available
    let nextTrack = undefined;
    const queueData = this.getCachedData("/me/player/queue");

    if (!queueData && !this.shouldThrottle("/me/player/queue")) {
      try {
        this.updateLastApiCall("/me/player/queue");
        const queueResponse = await fetch(`${this.baseUrl}/me/player/queue`, {
          headers: {
            Authorization: `Bearer ${spotifyCredentials?.accessToken}`,
          },
        });

        if (queueResponse.ok) {
          const freshQueueData = await queueResponse.json();
          this.setCachedData("/me/player/queue", freshQueueData);
          if (freshQueueData.queue && freshQueueData.queue.length > 0) {
            const next = freshQueueData.queue[0];
            nextTrack = {
              name: next.name,
              artist: next.artists.map((a: any) => a.name).join(", "),
              albumCover: next.album.images[0]?.url || "",
            };
          }
        }
      } catch (queueError) {
        logger.error("Error fetching queue:", queueError);
      }
    } else if (queueData?.queue?.[0]) {
      const next = queueData.queue[0];
      nextTrack = {
        name: next.name,
        artist: next.artists.map((a: any) => a.name).join(", "),
        albumCover: next.album.images[0]?.url || "",
      };
    }

    return {
      name: data.item.name,
      artist: data.item.artists.map((artist: any) => artist.name).join(", "),
      album: data.item.album.name,
      albumCover: data.item.album.images[0]?.url || "",
      duration: data.item.duration_ms,
      progress: data.progress_ms,
      isPlaying: data.is_playing,
      nextTrack: nextTrack,
    };
  }

  async hasValidCredentials(): Promise<boolean> {
    return SpotifyService.ensureValidToken();
  }

  private async getActiveDevice(): Promise<string | null> {
    try {
      if (!spotifyCredentials?.accessToken) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/me/player/devices`, {
        headers: {
          Authorization: `Bearer ${spotifyCredentials.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          if (await this.refreshAccessToken()) {
            return this.getActiveDevice();
          }
        }
        return null;
      }

      const data = await response.json();
      const activeDevice = data.devices.find((device: any) => device.is_active);
      return activeDevice?.id || data.devices[0]?.id || null;
    } catch (error) {
      logger.error("Error getting active device:", error);
      return null;
    }
  }

  private async transferPlayback(deviceId: string): Promise<boolean> {
    try {
      if (!spotifyCredentials?.accessToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/me/player`, {
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
          if (await this.refreshAccessToken()) {
            return this.transferPlayback(deviceId);
          }
        }
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error transferring playback:", error);
      return false;
    }
  }

  async playTrack(): Promise<boolean> {
    try {
      if (!spotifyCredentials?.accessToken) {
        logger.info("No user authorization token available");
        return false;
      }

      const deviceId = await this.getActiveDevice();
      if (!deviceId) {
        logger.info("No active device found");
        return false;
      }

      // Get current playback state
      const stateResponse = await fetch(`${this.baseUrl}/me/player`, {
        headers: {
          Authorization: `Bearer ${spotifyCredentials.accessToken}`,
        },
      });

      if (!stateResponse.ok) {
        if (stateResponse.status === 401) {
          if (await this.refreshAccessToken()) {
            return this.playTrack();
          }
        }
        return false;
      }

      const state = await stateResponse.json();

      // Only transfer if the device is not active
      if (state.device?.id !== deviceId) {
        await this.transferPlayback(deviceId);
      }

      const response = await fetch(
        `${this.baseUrl}/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyCredentials.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        logger.info("Received 401, attempting token refresh...");
        if (await this.refreshAccessToken()) {
          logger.info("Token refreshed, retrying request...");
          return this.playTrack();
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.error("Error playing track:", error);
      return false;
    }
  }

  async pauseTrack(): Promise<boolean> {
    try {
      if (!spotifyCredentials?.accessToken) {
        logger.info("No user authorization token available");
        return false;
      }

      const deviceId = await this.getActiveDevice();
      if (!deviceId) {
        logger.info("No active device found");
        return false;
      }

      // Get current playback state
      const stateResponse = await fetch(`${this.baseUrl}/me/player`, {
        headers: {
          Authorization: `Bearer ${spotifyCredentials.accessToken}`,
        },
      });

      if (!stateResponse.ok) {
        if (stateResponse.status === 401) {
          if (await this.refreshAccessToken()) {
            return this.pauseTrack();
          }
        }
        return false;
      }

      const state = await stateResponse.json();

      // Only transfer if the device is not active
      if (state.device?.id !== deviceId) {
        await this.transferPlayback(deviceId);
      }

      const response = await fetch(
        `${this.baseUrl}/me/player/pause?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${spotifyCredentials.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        logger.info("Received 401, attempting token refresh...");
        if (await this.refreshAccessToken()) {
          logger.info("Token refreshed, retrying request...");
          return this.pauseTrack();
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.error("Error pausing track:", error);
      return false;
    }
  }

  async skipToNext(): Promise<boolean> {
    try {
      if (!spotifyCredentials?.accessToken) {
        logger.info("No user authorization token available");
        return false;
      }

      const deviceId = await this.getActiveDevice();
      if (!deviceId) {
        logger.info("No active device found");
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/me/player/next?device_id=${deviceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${spotifyCredentials.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        logger.info("Received 401, attempting token refresh...");
        if (await this.refreshAccessToken()) {
          logger.info("Token refreshed, retrying request...");
          return this.skipToNext();
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.error("Error skipping to next track:", error);
      return false;
    }
  }

  async skipToPrevious(): Promise<boolean> {
    try {
      if (!spotifyCredentials?.accessToken) {
        logger.info("No user authorization token available");
        return false;
      }

      const deviceId = await this.getActiveDevice();
      if (!deviceId) {
        logger.info("No active device found");
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/me/player/previous?device_id=${deviceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${spotifyCredentials.accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        logger.info("Received 401, attempting token refresh...");
        if (await this.refreshAccessToken()) {
          logger.info("Token refreshed, retrying request...");
          return this.skipToPrevious();
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.error("Error skipping to previous track:", error);
      return false;
    }
  }
}
