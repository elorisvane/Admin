import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/src/lib/supabaseAdmin";

/**
 * File upload endpoint. A Route Handler (not a Server Action) so it parses the
 * multipart body with `request.formData()` — robust for large files and not
 * subject to the Server Action body-size cap that caused "Unexpected end of
 * form". Auth is still enforced by `proxy.ts` (unauthenticated requests are
 * redirected to /login before they reach here).
 */

const BUCKET = "media";
// App-side cap for uploads (large campaign videos / high-res photos). The real
// ceiling is your Supabase project's global storage "Upload file size limit"
// (default ~50MB) — raise that in the Supabase dashboard to go beyond it.
const MAX_MB = 200;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export const runtime = "nodejs";

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

    await ensureBucket();

    const ext = (file.name.split(".").pop() || "bin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
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
