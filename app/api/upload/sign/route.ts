import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/src/lib/supabaseAdmin";
import { requireAdmin } from "@/app/src/lib/auth/requireAdmin";
import { ALLOWED_TYPES, BUCKET, MAX_BYTES, MAX_MB } from "@/app/src/lib/media";

/**
 * Mints a one-shot signed upload token so the browser can send the file straight
 * to Supabase Storage.
 *
 * The bytes deliberately never pass through this app. Vercel caps a serverless
 * function's request body at 4.5MB and that limit cannot be raised, so posting
 * the file to a Route Handler rejected every real campaign photo or video with
 * an opaque 413 before our code ever ran. Only this small JSON handshake goes
 * through Vercel; the file goes browser → Supabase.
 *
 * Authorization stays here (requireAdmin): the bucket is public, so handing an
 * upload token to a non-admin would let anyone host arbitrary content on the
 * project's storage domain.
 *
 * Because the browser now writes to storage directly we can no longer sniff the
 * file's magic bytes server-side; the bucket's own `allowedMimeTypes` enforces
 * the type instead. What matters for the stored-XSS risk is the Content-Type the
 * file is *served* with, and HTML/SVG are not on the allowlist — so bytes
 * smuggled in under, say, `image/webp` come back as an image and can never
 * execute as a page.
 */

export const runtime = "nodejs";

type SignRequest = { contentType?: unknown; size?: unknown };

/**
 * Create the public bucket on first use and keep its guards in sync — these
 * bucket-level rules are the real enforcement now that the client uploads
 * directly.
 */
async function ensureBucket() {
  const options = {
    public: true,
    allowedMimeTypes: [...ALLOWED_TYPES.keys()],
    fileSizeLimit: MAX_BYTES,
  };

  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, options);
    if (error && !/exist/i.test(error.message)) throw new Error(error.message);
    return;
  }

  // Only write when the bucket has drifted, so the common path stays one read.
  const mimes = data.allowed_mime_types;
  const inSync =
    data.public &&
    data.file_size_limit === MAX_BYTES &&
    Array.isArray(mimes) &&
    mimes.length === options.allowedMimeTypes.length &&
    options.allowedMimeTypes.every((t) => mimes.includes(t));
  if (inSync) return;

  const { error } = await supabaseAdmin.storage.updateBucket(BUCKET, options);
  if (!error) return;

  // Supabase rejects a bucket limit above the project's global "Upload file size
  // limit" (default ~50MB), and updateBucket applies all-or-nothing — which would
  // take the MIME allowlist down with it. That allowlist is the security control
  // for a public bucket, so re-apply it on its own and leave the size cap to the
  // dashboard setting.
  const { error: retry } = await supabaseAdmin.storage.updateBucket(BUCKET, {
    public: true,
    allowedMimeTypes: options.allowedMimeTypes,
  });
  if (retry) {
    console.warn("[upload/sign] could not sync bucket rules:", retry.message);
    return;
  }
  console.warn(
    `[upload/sign] bucket file-size limit not set to ${MAX_MB}MB (${error.message}). ` +
      "Raise the project's global storage upload limit in the Supabase dashboard to allow large videos.",
  );
}

export async function POST(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as SignRequest;
    const contentType =
      typeof body.contentType === "string" ? body.contentType : "";
    const size = typeof body.size === "number" ? body.size : NaN;

    const ext = ALLOWED_TYPES.get(contentType);
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Upload an image (JPEG, PNG, WebP, AVIF, GIF) or video (MP4, WebM, MOV).",
        },
        { status: 415 },
      );
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "No file selected." }, { status: 400 });
    }
    if (size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${MAX_MB}MB).` },
        { status: 413 },
      );
    }

    await ensureBucket();

    // We choose the stored name, so a hostile filename or extension can't leak
    // in, and every upload is immutable.
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not start upload." },
        { status: 500 },
      );
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl: pub.publicUrl,
    });
  } catch (err) {
    console.error("[upload/sign] failed:", err);
    const message =
      err instanceof Error ? err.message : "Could not start upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
