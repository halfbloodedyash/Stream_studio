import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
