import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/app/src/lib/supabaseAdmin";
import { requireAdmin } from "@/app/src/lib/auth/requireAdmin";

/**
 * File upload endpoint. A Route Handler (not a Server Action) so it parses the
 * multipart body with `request.formData()` — robust for large files and not
 * subject to the Server Action body-size cap that caused "Unexpected end of
 * form".
 *
 * Authorization is enforced here directly (requireAdmin), not delegated to the
 * proxy: Route Handlers are independently reachable, and the file is stored in a
 * PUBLIC bucket, so an unauthorized upload would let anyone host arbitrary
 * content on the project's storage domain.
 */

const BUCKET = "media";
// App-side cap for uploads (large campaign videos / high-res photos). The real
// ceiling is your Supabase project's global storage "Upload file size limit"
// (default ~50MB) — raise that in the Supabase dashboard to go beyond it.
const MAX_MB = 200;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Photos are downscaled + re-encoded to WebP before storage so the storefront
// serves far fewer bytes (cuts Supabase "egress"). Uploaded files are immutable
// (random UUID names), so they can be cached effectively forever.
const MAX_DIMENSION = 2400; // px — cap the longest side
const WEBP_QUALITY = 82;
const ONE_YEAR = "31536000";

/**
 * Downscale + re-encode large raster photos to WebP to shrink what the
 * storefront serves. Video, GIF (often animated) and AVIF (already efficient)
 * pass through untouched, as does anything smaller than the WebP result or that
 * fails to decode.
 */
async function compressImage(
  bytes: Uint8Array,
  type: string,
): Promise<{ bytes: Uint8Array; type: string }> {
  if (type !== "image/jpeg" && type !== "image/png" && type !== "image/webp") {
    return { bytes, type };
  }
  try {
    const out = await sharp(Buffer.from(bytes), { failOn: "none" })
      // Honour EXIF orientation before the metadata is stripped on re-encode.
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    // Never inflate an already-optimised asset.
    return out.length < bytes.length
      ? { bytes: out, type: "image/webp" }
      : { bytes, type };
  } catch {
    return { bytes, type };
  }
}

// Only real media is accepted. The bucket is public, so allowing HTML/SVG/JS
// here would turn storage into a host for stored-XSS / phishing pages served
// from a trusted domain. Map each allowed type to the extension we store it as
// (we never trust the uploaded filename's extension).
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

export const runtime = "nodejs";

/**
 * Identify the media type from the file's leading "magic" bytes, ignoring the
 * client-supplied Content-Type and filename (both are attacker-controlled).
 * Returns null for anything that isn't a recognised media file.
 */
function sniffMediaType(b: Uint8Array): string | null {
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...b.subarray(start, start + len));

  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 3) === "PNG") {
    return "image/png";
  }
  if (b.length >= 6 && ascii(0, 4) === "GIF8") {
    return "image/gif";
  }
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    return "image/webp";
  }
  // Matroska / WebM EBML header.
  if (
    b.length >= 4 &&
    b[0] === 0x1a &&
    b[1] === 0x45 &&
    b[2] === 0xdf &&
    b[3] === 0xa3
  ) {
    return "video/webm";
  }
  // ISO-BMFF (`....ftyp<brand>`) covers MP4, MOV (QuickTime) and AVIF.
  if (b.length >= 12 && ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }
  return null;
}

/** Create the public bucket on first use so there's no manual setup step. */
async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
  });
  if (error && !/exist/i.test(error.message)) throw new Error(error.message);
}

export async function POST(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file selected." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${MAX_MB}MB).` },
        { status: 413 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Validate by content, not by the (spoofable) client Content-Type / name.
    const detected = sniffMediaType(bytes);
    if (!detected || !ALLOWED_TYPES.has(detected)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload an image (JPEG, PNG, WebP, AVIF, GIF) or video (MP4, WebM, MOV).",
        },
        { status: 415 },
      );
    }
    // Shrink large photos before storing (leaves video/GIF/AVIF as-is).
    const media = await compressImage(bytes, detected);
    const ext = ALLOWED_TYPES.get(media.type)!;

    await ensureBucket();

    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, media.bytes, {
        // Store the server-verified type, never the client's claim.
        contentType: media.type,
        // Immutable filenames → cache aggressively to cut repeat egress.
        cacheControl: ONE_YEAR,
        upsert: false,
      });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
