import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack has issues with non-ASCII chars in path; use Webpack
  turbopack: undefined,
};

export default nextConfig;
