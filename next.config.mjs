/**
 * Next.js Configuration
 *
 * Configuration for Next.js 15+ with App Router.
 *
 * @MX:NOTE: Next.js config for App Router with React 19
 * @MX:SPEC: SPEC-UI-001
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable App Router (default in Next.js 13+)
  reactStrictMode: true,

  // Experimental features for React 19
  experimental: {
    // Enable React Compiler if available
    reactCompiler: false,
  },

  // Image optimization
  images: {
    domains: [],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config
  },

  // Environment variables exposed to the browser
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },

  // Output configuration
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    // WARNING: This is not recommended for production
    // Set to true only for development
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // WARNING: This is not recommended for production
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
