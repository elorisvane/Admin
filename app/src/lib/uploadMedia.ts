import { createClient } from "@/app/src/lib/supabase/client";
import {
  ALLOWED_TYPES,
  BUCKET,
  COMPRESSIBLE_TYPES,
  MAX_DIMENSION,
  ONE_YEAR,
  WEBP_QUALITY,
} from "@/app/src/lib/media";

/**
 * Downscale + re-encode a large photo to WebP before it leaves the browser.
 *
 * This is the same pass the server used to run with sharp — same 2400px cap,
 * same quality — moved client-side because the file no longer travels through
 * the app. It is still a single encode from the original, so what the storefront
 * serves is unchanged. Anything that fails to decode, or that WebP would only
 * make bigger, is uploaded untouched.
 */
async function compress(
  file: File,
): Promise<{ body: Blob; contentType: string }> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) {
    return { body: file, contentType: file.type };
  }
  try {
    // `from-image` honours EXIF orientation, which re-encoding would otherwise
    // drop — the same reason the server pass called sharp's `.rotate()`.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(
      1, // never enlarge
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return { body: file, contentType: file.type };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    // Never inflate an already-optimised asset.
    if (!blob || blob.size >= file.size) {
      return { body: file, contentType: file.type };
    }
    return { body: blob, contentType: "image/webp" };
  } catch {
    return { body: file, contentType: file.type };
  }
}

/**
 * Upload one image or video and resolve to its public URL.
 *
 * The file goes straight from the browser to Supabase Storage with a one-shot
 * token minted by `/api/upload/sign`; it never passes through Vercel, whose
 * 4.5MB serverless request-body cap (which cannot be raised) is what made real
 * campaign photos and videos fail with a 413.
 */
export async function uploadMedia(file: File): Promise<string> {
  const { body, contentType } = await compress(file);

  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error(
      "Unsupported file type. Upload an image (JPEG, PNG, WebP, AVIF, GIF) or video (MP4, WebM, MOV).",
    );
  }

  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: body.size }),
  });
  const signed = await res.json().catch(() => ({}));
  if (!res.ok || !signed.path || !signed.token) {
    throw new Error(signed.error || `Upload failed (${res.status})`);
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path as string, signed.token as string, body, {
      contentType,
      // Immutable filenames → cache aggressively to cut repeat egress.
      cacheControl: ONE_YEAR,
    });
  if (error) throw new Error(error.message);

  return signed.publicUrl as string;
}
