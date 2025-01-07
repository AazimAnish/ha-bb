import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your config options here

  // Skip linting during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript checks during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;