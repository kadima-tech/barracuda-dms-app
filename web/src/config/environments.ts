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
    apiBaseUrl: 'http://localhost:8080',
    // Add other local environment configurations
  },
  development: {
    apiBaseUrl:
      process.env.NEXT_PUBLIC_DEV_API_URL || 'http://192.168.2.128:8080',
    // Add other development environment configurations
  },
  production: {
    apiBaseUrl:
      process.env.NEXT_PUBLIC_PROD_API_URL ||
      'https://server-564151515476.europe-west1.run.app',
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
