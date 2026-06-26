"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminReview, ReviewStatus } from "@/app/src/data/reviews";
import { setReviewStatus, deleteReview } from "@/app/src/actions/reviews";
import { Card, Input } from "@/app/src/components/ui";

function Stars({ value }: { value: number }) {
  return (
    <span className="whitespace-nowrap tracking-[0.1em]" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "text-gold-500" : "text-neutral-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewsTable({ reviews }: { reviews: AdminReview[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = reviews.filter((r) =>
    `${r.productSlug} ${r.title ?? ""} ${r.body} ${r.authorName ?? ""} ${
      r.userEmail ?? ""
    }`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const toggle = (r: AdminReview) => {
    const next: ReviewStatus = r.status === "published" ? "hidden" : "published";
    setError(null);
    setBusyId(r.id);
    startTransition(async () => {
      try {
        await setReviewStatus(r.id, next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update");
      } finally {
        setBusyId(null);
      }
    });
  };

  const remove = (r: AdminReview) => {
    if (!confirm("Delete this review permanently?")) return;
    setError(null);
    setBusyId(r.id);
    startTransition(async () => {
      try {
        await deleteReview(r.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search reviews…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Piece</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Review</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gold-50 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    href={`/products/edit/${r.productSlug}`}
                    className="font-medium text-foreground hover:text-gold-600"
                  >
                    {r.productSlug}
                  </Link>
                  <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                </td>
                <td className="px-5 py-4">
                  <Stars value={r.rating} />
                </td>
                <td className="px-5 py-4">
                  {r.title && (
                    <p className="font-medium text-foreground">{r.title}</p>
                  )}
                  <p className="max-w-sm text-xs text-muted">{r.body}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-foreground">{r.authorName || "—"}</p>
                  <p className="text-xs text-muted">{r.userEmail}</p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${
                      r.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <button
                      type="button"
                      disabled={pending && busyId === r.id}
                      onClick={() => toggle(r)}
                      className="text-xs uppercase tracking-widest text-gold-500 transition-colors hover:text-gold-600 disabled:opacity-50"
                    >
                      {r.status === "published" ? "Hide" : "Publish"}
                    </button>
                    <button
                      type="button"
                      disabled={pending && busyId === r.id}
                      onClick={() => remove(r)}
                      className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  {reviews.length === 0
                    ? "No reviews yet."
                    : "No reviews match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
