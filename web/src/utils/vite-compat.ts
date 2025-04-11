'use client';

// This file provides compatibility for Vite's import.meta.env
// to make the migration to Next.js smoother

// Create a mock of Vite's import.meta.env
const mockImportMeta = {
  env: {
    MODE: process.env.NODE_ENV,
    DEV: process.env.NODE_ENV !== 'production',
    PROD: process.env.NODE_ENV === 'production',
    // Map Vite env vars to Next.js env vars
    VITE_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    // Add other environment variables as needed
  },
};

// Expose the mock globally if it doesn't exist
if (typeof window !== 'undefined') {
  // @ts-expect-error - adding import to window which is not in the Window type
  window.import = window.import || { meta: mockImportMeta };
}

export default mockImportMeta;
