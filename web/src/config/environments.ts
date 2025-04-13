// Environment types
export type Environment = 'local' | 'development' | 'production';

// Environment configuration interface
export interface EnvironmentConfig {
  apiBaseUrl: string;
  // Add other environment-specific configuration properties here
}

// Helper function to safely get environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  // Check if the environment variable exists
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return defaultValue;
};

// Environment configurations
const environments: Record<Environment, EnvironmentConfig> = {
  local: {
    apiBaseUrl: 'http://localhost:8080',
    // Add other local environment configurations
  },
  development: {
    apiBaseUrl: getEnvVar('VITE_DEV_API_URL', 'http://192.168.2.128:8080'),
    // Add other development environment configurations
  },
  production: {
    apiBaseUrl: getEnvVar(
      'VITE_PROD_API_URL',
      'https://barracuda-dms-server-xxxxx-uc.a.run.app'
    ),
    // Add other production environment configurations
  },
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  const env = getEnvVar('VITE_APP_ENV', '');

  if (env === 'local' || env === 'development' || env === 'production') {
    return env;
  }

  // Default to local if running on localhost
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'local';
  }

  // Default to production for all other cases
  return 'production';
};

// Get current environment configuration
export const getCurrentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment();
  return environments[env];
};
