"use client";

import { useState } from "react";
import Link from "next/link";
import type { CustomerCart } from "@/app/src/data/carts";
import { Card, Input } from "@/app/src/components/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Small square preview of a piece in the bag. */
function ItemThumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

export default function CartsTable({ carts }: { carts: CustomerCart[] }) {
  const [query, setQuery] = useState("");

  const filtered = carts.filter((c) =>
    [c.userName, c.userEmail, ...c.items.map((i) => `${i.name} ${i.material}`)]
      .join(" ")
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
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">In the bag</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {filtered.map((c) => (
              <tr key={c.userId} className="hover:bg-gold-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {c.userName || "—"}
                  </p>
                  <p className="text-xs text-muted">{c.userEmail}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.pieceCount} {c.pieceCount === 1 ? "piece" : "pieces"}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <ul className="space-y-2">
                    {c.items.map((i, idx) => (
                      <li
                        key={`${i.slug}-${i.material}-${idx}`}
                        className="flex items-center gap-2.5"
                      >
                        <ItemThumb src={i.image} alt={i.name ?? ""} />
                        <span className="min-w-0">
                          <Link
                            href={`/products/edit/${i.slug}`}
                            className="text-foreground hover:text-gold-600"
                          >
                            {i.name || i.slug}
                          </Link>
                          <span className="text-muted">
                            {i.material ? ` · ${i.material}` : ""} × {i.quantity}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-foreground">
                  {c.total}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(c.updatedAt)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  {carts.length === 0
                    ? "No customer has an active bag yet."
                    : "No bags match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
