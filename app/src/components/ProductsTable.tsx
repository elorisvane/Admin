"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/app/src/data/products";
import { Card, Input } from "@/app/src/components/ui";

export default function ProductsTable({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) =>
    `${p.name} ${p.category} ${p.tagline}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search creations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.slug} className="hover:bg-gold-50 transition-colors">
                <td className="px-5 py-4">
                  <Link
                    href={`/products/${p.slug}`}
                    className="font-medium text-foreground hover:text-gold-600"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted">{p.tagline}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {p.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-foreground">{p.price}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/products/${p.slug}`}
                    className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  {products.length === 0
                    ? "No creations yet."
                    : `No creations match “${query}”.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
