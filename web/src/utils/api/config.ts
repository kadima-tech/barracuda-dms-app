import { getCurrentConfig } from '../../config/environments';

// Get API base URL from environment configuration
export const API_BASE_URL = getCurrentConfig().apiBaseUrl;

// Common fetch options
export const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  credentials: 'include',
};
