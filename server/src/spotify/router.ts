import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { logger } from '@kadima-tech/micro-service-base';
import { SpotifyService } from './service';
import { parseString } from 'xml2js';

const config = {
  APP_URL: 'http://192.168.3.1:5173', // Updated IP
};

const spotifyRouter = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  const spotifyService = SpotifyService.getInstance();

  // Move this to the top of the router function
  fastify.get('/', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await spotifyService.hasValidCredentials())) {
        // Redirect to authorization if no valid credentials
        const authUrl = await spotifyService.getAuthorizationUrl();
        return reply.redirect(authUrl);
      }
      return reply.redirect(`${config.APP_URL}/spotify/music-dashboard`);
    } catch (error) {
      logger.error('Error in root spotify route:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  // Get currently playing track
  fastify.get('/currently-playing', async (request, reply) => {
    try {
      logger.info('Fetching currently playing track');
      const track = await spotifyService.getCurrentlyPlaying();

      if (!track) {
        // If no track and no credentials, redirect to auth
        if (!(await spotifyService.hasValidCredentials())) {
          const authUrl = await spotifyService.getAuthorizationUrl();
          return reply.redirect(authUrl);
        }
        // If we have credentials but no track playing
        logger.info('No track currently playing');
        return reply.status(204).send();
      }

      logger.info('Returning track:', track);
      return reply.send(track);
    } catch (error) {
      logger.error('Error fetching currently playing track:', error);
      return reply.status(500).send({ error: 'Failed to fetch current track' });
    }
  });

  // Spotify authorization endpoint
  fastify.get('/authorize', async (request, reply) => {
    try {
      const authUrl = await spotifyService.getAuthorizationUrl();
      logger.info(`Redirecting to Spotify auth: ${authUrl}`);
      return reply.redirect(authUrl);
    } catch (error) {
      logger.error('Error during Spotify authorization:', error);
      return reply.status(500).send({ error: 'Authorization failed' });
    }
  });

  // Spotify callback endpoint
  fastify.get('/callback', async (request, reply) => {
    try {
      const { code, error } = request.query as {
        code?: string;
        error?: string;
      };

      if (error) {
        logger.error('Spotify auth error:', error);
        return reply.redirect(
          `${config.APP_URL}/spotify/music-dashboard?error=${error}`
        );
      }

      if (!code) {
        logger.error('No authorization code received');
        return reply.redirect(
          `${config.APP_URL}/spotify/music-dashboard?error=no_code`
        );
      }

      const success = await spotifyService.exchangeCodeForToken(code);
      if (!success) {
        return reply.redirect(
          `${config.APP_URL}/spotify/music-dashboard?error=token_exchange_failed`
        );
      }

      // Successfully authenticated, redirect to dashboard
      return reply.redirect(`${config.APP_URL}/spotify/music-dashboard`);
    } catch (error) {
      logger.error('Error in callback:', error);
      return reply.redirect(
        `${config.APP_URL}/spotify/music-dashboard?error=callback_failed`
      );
    }
  });

  // Play endpoint
  fastify.put('/player/play', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await spotifyService.hasValidCredentials())) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const success = await spotifyService.playTrack();

      if (!success) {
        return reply.status(500).send({ error: 'Failed to play track' });
      }

      return reply.status(204).send();
    } catch (error) {
      logger.error('Error playing track:', error);
      return reply.status(500).send({ error: 'Failed to play track' });
    }
  });

  // Pause endpoint
  fastify.put('/player/pause', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await spotifyService.hasValidCredentials())) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const success = await spotifyService.pauseTrack();

      if (!success) {
        return reply.status(500).send({ error: 'Failed to pause track' });
      }

      return reply.status(204).send();
    } catch (error) {
      logger.error('Error pausing track:', error);
      return reply.status(500).send({ error: 'Failed to pause track' });
    }
  });

  // Next track endpoint
  fastify.post('/player/next', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await spotifyService.hasValidCredentials())) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const success = await spotifyService.skipToNext();

      if (!success) {
        return reply
          .status(500)
          .send({ error: 'Failed to skip to next track' });
      }

      return reply.status(204).send();
    } catch (error) {
      logger.error('Error skipping to next track:', error);
      return reply.status(500).send({ error: 'Failed to skip to next track' });
    }
  });

  // Previous track endpoint
  fastify.post('/player/previous', async (request, reply) => {
    try {
      // Check if we have valid credentials
      if (!(await spotifyService.hasValidCredentials())) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const success = await spotifyService.skipToPrevious();

      if (!success) {
        return reply
          .status(500)
          .send({ error: 'Failed to skip to previous track' });
      }

      return reply.status(204).send();
    } catch (error) {
      logger.error('Error skipping to previous track:', error);
      return reply
        .status(500)
        .send({ error: 'Failed to skip to previous track' });
    }
  });
};

export default (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.register(spotifyRouter);
  done();
};
