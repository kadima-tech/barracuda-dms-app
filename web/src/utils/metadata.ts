import { Metadata } from 'next';

/**
 * Returns metadata for the application
 * Separated to a function to solve Fast Refresh issues
 */
export function getMetadata(): Metadata {
  return {
    title: 'Barracuda DMS App',
    description: 'Barracuda DMS Application',
  };
}
