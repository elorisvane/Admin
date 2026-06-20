import Link from "next/link";
import { getProducts } from "@/app/src/data/products";
import { getPosts } from "@/app/src/data/posts";
import { Card, PageHeader } from "@/app/src/components/ui";
import SeedButton from "@/app/src/components/SeedButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);
  const categories = new Set(products.map((p) => p.category)).size;

  const stats = [
    { label: "Creations", value: products.length, href: "/products" },
    { label: "Journal entries", value: posts.length, href: "/blog" },
    { label: "Categories", value: categories, href: "/products" },
  ];

  return (
    <div>
      <PageHeader
        title="Atelier"
        subtitle="An overview of everything on display in the ÉLORIS storefront."
        action={<SeedButton />}
      />

      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="px-6 py-7 transition-colors hover:border-gold-300">
              <p className="font-serif text-5xl text-foreground">{s.value}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted">
                {s.label}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {products.length === 0 && posts.length === 0 && (
        <Card className="mt-8 px-6 py-5">
          <p className="text-sm text-muted">
            The database is empty. Use{" "}
            <span className="text-gold-600">Seed sample data</span> above to load
            the original ÉLORIS catalogue, or add a piece manually.
          </p>
        </Card>
      )}

      <div className="mt-12 grid grid-cols-2 gap-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent creations</h2>
            <Link
              href="/products"
              className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
            >
              All →
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {products.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gold-50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{p.name}</span>
                    <span className="text-xs text-muted">{p.price}</span>
                  </Link>
                </li>
              ))}
              {products.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No creations yet.</li>
              )}
            </ul>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent journal</h2>
            <Link
              href="/blog"
              className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
            >
              All →
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {posts.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gold-50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{p.title}</span>
                    <span className="text-xs text-muted">{p.date}</span>
                  </Link>
                </li>
              ))}
              {posts.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No journal entries yet.</li>
              )}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
