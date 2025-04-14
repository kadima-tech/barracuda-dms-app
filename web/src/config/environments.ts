/// <reference types="node" />

// Environment types
export type Environment = 'local' | 'development' | 'production';

// Environment configuration interface
export interface EnvironmentConfig {
  apiBaseUrl: string;
  // Add other environment-specific configuration properties here
}

// Environment configurations
export const environments: Record<Environment, EnvironmentConfig> = {
  local: {
    apiBaseUrl: '/api',
    // Add other local environment configurations
  },
  development: {
    apiBaseUrl: '/api',
    // Add other development environment configurations
  },
  production: {
    apiBaseUrl: '/api',
    // Add other production environment configurations
  },
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_APP_ENV;

  if (env === 'local' || env === 'development' || env === 'production') {
    return env;
  }

  // Default to local if running on localhost
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
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
