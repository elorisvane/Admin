"use client";

import { useState } from "react";
import Link from "next/link";
import type { SavedCreation } from "@/app/src/data/wishlists";
import { Card, Input } from "@/app/src/components/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WishlistsTable({ rows }: { rows: SavedCreation[] }) {
  const [query, setQuery] = useState("");

  const filtered = rows.filter((r) =>
    `${r.userName ?? ""} ${r.userEmail ?? ""} ${r.productName ?? ""} ${
      r.productSlug
    } ${r.productCategory ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search by customer or piece…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Saved piece</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr
                key={`${r.userId}-${r.productSlug}`}
                className="hover:bg-gold-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {r.userName || "—"}
                  </p>
                  <p className="text-xs text-muted">{r.userEmail}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Thumb src={r.productImage} alt={r.productName ?? ""} />
                    <div className="min-w-0">
                      <Link
                        href={`/products/edit/${r.productSlug}`}
                        className="font-medium text-foreground hover:text-gold-600"
                      >
                        {r.productName || r.productSlug}
                      </Link>
                      <p className="text-xs text-muted">{r.productSlug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {r.productCategory}
                  </span>
                </td>
                <td className="px-5 py-4 text-foreground">{r.productPrice}</td>
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(r.createdAt)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  {rows.length === 0
                    ? "No customers have saved any creations yet."
                    : "No saves match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/** Small square preview of a saved piece's photo. */
function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
