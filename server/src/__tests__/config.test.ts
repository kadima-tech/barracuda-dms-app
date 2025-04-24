// Mock environment variables before importing the config
process.env.EXCHANGE_TENANT_ID = 'test-tenant-id';
process.env.EXCHANGE_CLIENT_ID = 'test-client-id';
process.env.EXCHANGE_CLIENT_SECRET = 'test-client-secret';
process.env.EXCHANGE_REDIRECT_URI = 'http://localhost:8080/exchange/callback';
process.env.APP_URL = 'http://localhost:5173';
process.env.SPOTIFY_CLIENT_ID = 'test-spotify-id';
process.env.SPOTIFY_CLIENT_SECRET = 'test-spotify-secret';
process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:8080/spotify/callback';

// Now import the config after mocking env vars
import { config } from '../config';

describe('Config module', () => {
  // Simple test to check that config is an object
  test('config should be an object', () => {
    expect(typeof config).toBe('object');
  });

  // Simple test to ensure config has SCOPES property
  test('config should have SCOPES property', () => {
    expect(config).toHaveProperty('SCOPES');
    expect(Array.isArray(config.SCOPES)).toBe(true);
  });
});
