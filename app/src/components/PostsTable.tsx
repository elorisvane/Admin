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
              className="flex items-center justify-between gap-6 px-5 py-4 hover:bg-gold-50 transition-colors"
            >
              <Link href={`/blog/edit/${p.slug}`} className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{p.excerpt}</p>
              </Link>

              <div className="shrink-0 text-right">
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
