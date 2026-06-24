"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Product } from "@/app/src/data/products";
import { deleteProduct } from "@/app/src/actions/products";
import { Card, Input } from "@/app/src/components/ui";

export default function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = products.filter((p) =>
    `${p.name} ${p.category} ${p.tagline}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const remove = (p: Product) => {
    if (!confirm(`Remove “${p.name}” from the storefront?`)) return;
    setError(null);
    setDeletingSlug(p.slug);
    startTransition(async () => {
      try {
        await deleteProduct(p.slug);
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
          placeholder="Search creations…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
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
                  <div className="flex items-center gap-3">
                    <ProductThumb src={p.image} alt={p.name} />
                    <div className="min-w-0">
                      <Link
                        href={`/products/edit/${p.slug}`}
                        className="font-medium text-foreground hover:text-gold-600"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted">{p.tagline}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs uppercase tracking-wider text-muted">
                    {p.category}
                  </span>
                </td>
                <td className="px-5 py-4 text-foreground">{p.price}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/products/edit/${p.slug}`}
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

/** Small square preview of a creation's photo. */
function ProductThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
