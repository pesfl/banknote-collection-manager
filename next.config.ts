import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  turbopack: {},
  allowedDevOrigins: ['192.168.1.2', '192.168.*.*', '10.*.*.*', 'localhost:3000'],
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: false,
  disable: process.env.NODE_ENV === 'development',
  publicExclusions: ['!noprecache/**/*'],
  buildExclusions: [/middleware-manifest.json$/],
});

export default withPWAConfig(nextConfig);
