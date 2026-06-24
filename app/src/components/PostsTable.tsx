"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Post } from "@/app/src/data/posts";
import { deletePost } from "@/app/src/actions/posts";
import { Card, Input } from "@/app/src/components/ui";

export default function PostsTable({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = posts.filter((p) =>
    `${p.title} ${p.category} ${p.excerpt}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const remove = (p: Post) => {
    if (!confirm(`Remove the journal entry “${p.title}”?`)) return;
    setError(null);
    setDeletingSlug(p.slug);
    startTransition(async () => {
      try {
        await deletePost(p.slug);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete");
      } finally {
        setDeletingSlug(null);
      }
    });
  };

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search entries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card>
        <ul className="divide-y divide-border">
          {filtered.map((p) => (
            <li
              key={p.slug}
              className="flex flex-col gap-3 px-5 py-4 hover:bg-gold-50 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <Link
                href={`/blog/edit/${p.slug}`}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <PostThumb src={p.image} alt={p.title} />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {p.excerpt}
                  </p>
                </div>
              </Link>

              <div className="shrink-0 sm:text-right">
                <p className="text-xs uppercase tracking-wider text-muted">
                  {p.category}
                </p>
                <p className="mt-0.5 text-xs text-muted/70">{p.date}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={`/blog/edit/${p.slug}`}
                  className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  disabled={pending}
                  className="text-xs uppercase tracking-widest text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  {deletingSlug === p.slug ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-5 py-10 text-center text-muted">
              {posts.length === 0
                ? "No journal entries yet."
                : `No entries match “${query}”.`}
            </li>
          )}
        </ul>
      </Card>
    </>
  );
}

/** Small preview of a journal entry's hero image. */
function PostThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
