"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { HomeMedia, Placement } from "@/app/src/data/home";
import { deleteHomeMedia } from "@/app/src/actions/home";
import { Card } from "@/app/src/components/ui";

const GROUPS: { placement: Placement; label: string; blurb: string }[] = [
  {
    placement: "campaign",
    label: "Campaign sections",
    blurb: "Full-screen scroll-reveal artwork at the top of the home page.",
  },
  {
    placement: "gallery",
    label: "Gallery strip",
    blurb: "The horizontal image strip near the bottom of the home page.",
  },
];

export default function HomeMediaTable({ items }: { items: HomeMedia[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (m: HomeMedia) => {
    const name = m.title || m.alt || m.src;
    if (!confirm(`Remove “${name}” from the home page?`)) return;
    setError(null);
    setDeletingId(m.id);
    startTransition(async () => {
      try {
        await deleteHomeMedia(m.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-10">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {GROUPS.map((group) => {
        const rows = items.filter((m) => m.placement === group.placement);
        return (
          <section key={group.placement}>
            <div className="mb-4">
              <h2 className="font-serif text-2xl text-foreground">
                {group.label}
              </h2>
              <p className="mt-1 text-sm text-muted">{group.blurb}</p>
            </div>

            <Card className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">
                      {group.placement === "campaign" ? "Title / source" : "Source"}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((m) => (
                    <tr key={m.id} className="hover:bg-gold-50 transition-colors">
                      <td className="px-5 py-4 text-muted">{m.sortOrder}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs uppercase tracking-wider text-muted">
                          {m.mediaType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <MediaThumb item={m} />
                          <div className="min-w-0">
                            <Link
                              href={`/home-media/edit/${m.id}`}
                              className="font-medium text-foreground hover:text-gold-600"
                            >
                              {m.title || m.alt || "Untitled"}
                            </Link>
                            <p className="break-all text-xs text-muted">
                              {m.src}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/home-media/edit/${m.id}`}
                            className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(m)}
                            disabled={pending}
                            className="text-xs uppercase tracking-widest text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {deletingId === m.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-muted"
                      >
                        Nothing here yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </section>
        );
      })}
    </div>
  );
}

/** Small square preview of a home-media item — image, or a video's poster. */
function MediaThumb({ item }: { item: HomeMedia }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {item.mediaType === "video" ? (
        item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster} alt="" className="h-full w-full object-cover" />
        ) : (
          <video src={item.src} muted className="h-full w-full object-cover" />
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.alt || ""}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
