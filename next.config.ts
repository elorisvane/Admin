import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `sharp` ships native binaries — keep it out of the server bundle so it's
  // loaded from node_modules at runtime (used by /api/upload to compress images).
  serverExternalPackages: ["sharp"],
  experimental: {
    // The auth proxy (proxy.ts) buffers every request body and truncates it at
    // 10MB by default — which corrupted large media uploads to /api/upload
    // ("Failed to parse body as FormData"). Raise it to match the upload
    // route's 200MB cap so big videos/photos pass through intact.
    proxyClientMaxBodySize: "200mb",
  },
};

export default nextConfig;
