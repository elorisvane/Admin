/**
 * Shared media-upload rules. Imported by both the browser (the uploaders) and
 * the signing Route Handler, so it must stay free of server-only imports.
 */

export const BUCKET = "media";

// Ceiling for a single upload. Supabase enforces this at the bucket level too
// (see the sign route), but the project's global storage "Upload file size
// limit" (default ~50MB) still caps everything — raise that in the Supabase
// dashboard to actually land 200MB videos.
export const MAX_MB = 200;
export const MAX_BYTES = MAX_MB * 1024 * 1024;

// Photos are downscaled + re-encoded to WebP before upload so the storefront
// serves far fewer bytes (cuts Supabase "egress"). Uploads are immutable (random
// UUID names), so they can be cached effectively forever.
export const MAX_DIMENSION = 2400; // px — cap the longest side
export const WEBP_QUALITY = 0.82;
export const ONE_YEAR = "31536000";

// Only real media is accepted. The bucket is public, so allowing HTML/SVG/JS
// would turn storage into a host for stored-XSS / phishing pages served from a
// trusted domain. Map each allowed type to the extension we store it as (we
// never trust the uploaded filename's extension).
export const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

// Raster stills worth re-encoding. GIF (often animated) and AVIF (already
// efficient) are left alone, as is video.
export const COMPRESSIBLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
