import { API_BASE_URL } from "../config";

interface AuthCheckResult {
  isAuthenticated: boolean;
  error?: string;
}

/**
 * Checks if the user is authenticated with the Exchange API
 * and redirects to authentication if needed
 */
export const checkAuthAndRedirect = async (): Promise<AuthCheckResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exchange/status`);
    const data = await response.json();

    return {
      isAuthenticated: data.authenticated,
      error: data.error,
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check authentication status",
    };
  }
};

/**
 * Get the URL for requesting admin consent
 */
export const getAdminConsentUrl = (redirectUrl: string): string => {
  const encodedRedirect = encodeURIComponent(redirectUrl);
  return `${API_BASE_URL}/exchange/auth?admin_consent=true&redirect_url=${encodedRedirect}`;
};
