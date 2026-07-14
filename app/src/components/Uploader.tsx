"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/app/src/lib/uploadMedia";

/**
 * File-upload field for images (and videos). Sends the chosen file straight from
 * the browser to Supabase Storage (see `uploadMedia`) and reports back the
 * stored public URL through `onChange`. Replaces the old "paste a URL" inputs.
 */
export function Uploader({
  value,
  onChange,
  kind = "image",
  accept,
  label,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "video";
  accept?: string;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadMedia(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
          {label}
        </span>
      )}
      <div className="flex items-start gap-4">
        {/* Preview thumbnail */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
          {value ? (
            kind === "video" ? (
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-muted/50">
              No {kind}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept ?? (kind === "video" ? "video/*" : "image/*")}
            onChange={onFile}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-xs font-medium uppercase tracking-widest text-foreground transition-colors hover:border-gold-400 hover:text-gold-600 disabled:opacity-50"
            >
              {uploading
                ? "Uploading…"
                : value
                  ? `Replace ${kind}`
                  : `Upload ${kind}`}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
          {hint && <span className="text-xs text-muted/70">{hint}</span>}
          {value && (
            <span className="max-w-xs truncate text-[11px] text-muted/60">
              {value}
            </span>
          )}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}
