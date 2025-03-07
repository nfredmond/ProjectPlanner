/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
  },
  // Disable static export
  output: 'standalone',
  // Force dynamic rendering for pages with external data
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr']
  },
  // Increase timeout for static generation
  staticPageGenerationTimeout: 120,
  // Disable telemetry for portable mode
  telemetry: {
    disabled: process.env.PORTABLE_MODE === 'true',
  },
  // Allow port configuration via env variable to avoid conflicts
  port: process.env.PORT || 3000,
  // Graceful shutdown on errors
  onDemandEntries: {
    // Keep pages in memory for 1 minute
    maxInactiveAge: 60 * 1000,
    // Maximum of 25 pages in memory
    pagesBufferLength: 25,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Handle Leaflet and other libraries that use the window object
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
