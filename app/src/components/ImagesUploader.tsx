"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/app/src/lib/uploadMedia";

const VIDEO_RE = /\.(mp4|webm|mov)(\?.*)?$/i;
const isVideo = (url: string) => VIDEO_RE.test(url);

/**
 * Multi-media upload field. Sends each chosen file (image or video) straight
 * from the browser to Supabase Storage (see `uploadMedia`) and keeps an ordered
 * gallery in `value`. Items can be reordered to the front or removed. With
 * `showCover` (default) the first item is badged as the cover. Used by the
 * product editor.
 */
export function ImagesUploader({
  value,
  onChange,
  label,
  hint,
  showCover = true,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
  /** Badge the first item as "Cover" and label the reorder action accordingly. */
  showCover?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Reset so picking the same files again still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await uploadMedia(file));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));

  const makeCover = (i: number) => {
    if (i === 0) return;
    const next = [...value];
    const [picked] = next.splice(i, 1);
    onChange([picked, ...next]);
  };

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted">
          {label}
        </span>
      )}

      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100"
          >
            {isVideo(url) ? (
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}

            {showCover && i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-gold-500 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white">
                Cover
              </span>
            )}

            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
            >
              ✕
            </button>

            {i !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-[9px] uppercase tracking-widest text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              >
                {showCover ? "Make cover" : "Move to front"}
              </button>
            )}
          </div>
        ))}

        {/* Add tile */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-gold-400 hover:text-gold-600 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add media"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onFiles}
          className="hidden"
        />
      </div>

      {hint && <span className="mt-2 block text-xs text-muted/70">{hint}</span>}
      {error && <span className="mt-2 block text-xs text-red-500">{error}</span>}
    </div>
  );
}
