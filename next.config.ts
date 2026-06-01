import type { NextConfig } from "next";
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    // Frontend type-checks clean; build now fails on type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Lint errors now fail the build; warnings still allowed.
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizePackageImports: ['leaflet', 'react-leaflet', 'zustand'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
