import type { NextConfig } from "next";

// Media uploads go browser → Supabase Storage directly (see `uploadMedia`), so
// no large body ever reaches this app. That removed the two settings that used
// to live here: a raised proxy body limit (pointless — Vercel caps a function's
// request body at 4.5MB regardless) and `serverExternalPackages: ["sharp"]`
// (nothing imports sharp on the server any more).
const nextConfig: NextConfig = {};

export default nextConfig;
