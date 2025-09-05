import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Ensure static assets are served properly in Electron
  ...(process.env.ELECTRON_BUILD && {
    output: 'standalone',
    // Ensure public assets are properly handled
    trailingSlash: true,
  }),
  // Vercel deployment optimizations
  experimental: {
    // Enable serverless functions for API routes
    serverComponentsExternalPackages: ['@prisma/client', '@sparticuz/chromium', 'puppeteer-core'],
  },
  // Webpack configuration for external dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // External dependencies that should not be bundled
      config.externals = [...config.externals, '@prisma/client'];
    }
    return config;
  },
};

export default nextConfig;
