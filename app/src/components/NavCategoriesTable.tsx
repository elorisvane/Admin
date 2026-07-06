"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NavCategory } from "@/app/src/data/nav";
import { deleteNavCategory } from "@/app/src/actions/nav";
import { Card } from "@/app/src/components/ui";

export default function NavCategoriesTable({
  items,
}: {
  items: NavCategory[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (c: NavCategory) => {
    if (!confirm(`Remove “${c.label}” from the menu?`)) return;
    setError(null);
    setDeletingId(c.id);
    startTransition(async () => {
      try {
        await deleteNavCategory(c.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Sub-categories</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-gold-50">
                <td className="px-5 py-4 text-muted">{c.sortOrder}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/nav-menu/edit/${c.id}`}
                    className="font-medium tracking-wide text-foreground hover:text-gold-600"
                  >
                    {c.label}
                  </Link>
                  {c.linkUrl && (
                    <p className="text-xs text-muted">{c.linkUrl}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  {c.subcategories.length === 0 ? (
                    <span className="text-xs text-muted">—</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.subcategories.map((s, i) => (
                        <span
                          key={`${s.label}-${i}`}
                          className="rounded-full border border-border px-2.5 py-0.5 text-[11px] tracking-wider text-muted"
                        >
                          {s.label || "Untitled"}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/nav-menu/edit/${c.id}`}
                      className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      disabled={pending}
                      className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                    >
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
