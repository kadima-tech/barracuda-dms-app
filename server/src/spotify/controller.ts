import { Request, Response } from "express";
import { SpotifyService } from "./service";

export class SpotifyController {
  private spotifyService: SpotifyService;

  constructor() {
    this.spotifyService = SpotifyService.getInstance();
  }

  async getCurrentlyPlaying(req: Request, res: Response): Promise<void> {
    try {
      const track = await this.spotifyService.getCurrentlyPlaying();

      if (!track) {
        res.status(204).send();
        return;
      }

      res.status(200).json(track);
    } catch (error) {
      console.error("Error in getCurrentlyPlaying controller:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch currently playing track" });
    }
  }

  async authorize(req: Request, res: Response): Promise<void> {
    try {
      const authUrl = await this.spotifyService.getAuthorizationUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error in authorize controller:", error);
      res.status(500).json({ error: "Failed to generate authorization URL" });
    }
  }

  async callback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "Authorization code is required" });
        return;
      }

      const success = await this.spotifyService.exchangeCodeForToken(code);

      if (!success) {
        res.status(500).json({ error: "Failed to exchange code for token" });
        return;
      }

      res.redirect("/spotify/dashboard");
    } catch (error) {
      console.error("Error in callback controller:", error);
      res.status(500).json({ error: "Failed to process Spotify callback" });
    }
  }

  async joinSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      // In a real app, you would validate the session ID and handle joining logic
      // For now, we'll just redirect to the dashboard

      res.redirect(`/spotify/dashboard?session=${sessionId}`);
    } catch (error) {
      console.error("Error in joinSession controller:", error);
      res.status(500).json({ error: "Failed to join session" });
    }
  }
}
