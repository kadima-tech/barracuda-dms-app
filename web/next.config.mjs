/** @type {import('next').NextConfig} */
const nextConfig = {
  // Initially set output to export for SPA mode to minimize changes
  // output: 'export',
  distDir: './dist',
  // Preserve React Router's client-side routing
  trailingSlash: true,
  // Other configurations
  reactStrictMode: true,
  // Allow importing image files
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
