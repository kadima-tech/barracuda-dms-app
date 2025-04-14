/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for SPA mode
  output: 'standalone',
  distDir: './dist',
  // Preserve React Router's client-side routing
  trailingSlash: true,
  // Other configurations
  reactStrictMode: true,
  // Allow importing image files
  images: {
    unoptimized: true,
  },
  // Add rewrites for API routes to proxy to external API
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const isLocal = process.env.NEXT_PUBLIC_APP_ENV === 'local';

    // Determine the target API URL based on environment
    let targetUrl = 'https://server-564151515476.europe-west1.run.app';

    // if (isDev || isLocal) {
    //   targetUrl = process.env.NEXT_PUBLIC_LOCAL_API_URL;
    // } else if (process.env.NEXT_PUBLIC_DEV_API_URL) {
    //   targetUrl = process.env.NEXT_PUBLIC_DEV_API_URL;
    // } else if (process.env.NEXT_PUBLIC_PROD_API_URL) {
    //   targetUrl = process.env.NEXT_PUBLIC_PROD_API_URL;
    // }
    console.log('targetUrl', {
      source: '/api/:path*',
      destination: `${targetUrl}/:path*`,
    });
    return [
      {
        source: '/api/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
  // Add middleware configuration for CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
