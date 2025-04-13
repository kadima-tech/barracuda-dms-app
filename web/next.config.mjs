/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for SPA mode
  output: 'export',
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
