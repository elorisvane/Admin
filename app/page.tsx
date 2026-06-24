import Link from "next/link";
import { getProducts } from "@/app/src/data/products";
import { getPosts } from "@/app/src/data/posts";
import { getOrders } from "@/app/src/data/orders";
import { getUsers } from "@/app/src/data/users";
import { getMessages } from "@/app/src/data/messages";
import { Card, PageHeader } from "@/app/src/components/ui";
import SeedButton from "@/app/src/components/SeedButton";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  cancelled: "bg-neutral-200 text-neutral-500",
};

export default async function Dashboard() {
  const [products, posts, orders, users, messages] = await Promise.all([
    getProducts(),
    getPosts(),
    getOrders(),
    getUsers(),
    getMessages(),
  ]);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const newMessages = messages.filter((m) => m.status === "new").length;

  const stats = [
    { label: "Creations", value: products.length, href: "/products" },
    {
      label: "Orders",
      value: orders.length,
      href: "/orders",
      hint: pendingOrders ? `${pendingOrders} pending` : undefined,
    },
    { label: "Customers", value: users.length, href: "/users" },
    {
      label: "Messages",
      value: messages.length,
      href: "/messages",
      hint: newMessages ? `${newMessages} new` : undefined,
    },
    { label: "Journal entries", value: posts.length, href: "/blog" },
  ];

  return (
    <div>
      <PageHeader
        title="Atelier"
        subtitle="An overview of everything on display in the ÉLORIS storefront."
        action={<SeedButton />}
      />

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="px-6 py-7 transition-colors hover:border-gold-300">
              <p className="font-serif text-5xl text-foreground">{s.value}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted">
                {s.label}
              </p>
              {s.hint && (
                <p className="mt-1 text-xs text-gold-600">{s.hint}</p>
              )}
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

      {/* Recent orders + enquiries */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent orders</h2>
            <Link
              href="/orders"
              className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
            >
              All →
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => {
                const qty = o.items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {o.fullName || o.email || "Customer"}
                        <span className="text-muted">
                          {" · "}
                          {qty} item{qty === 1 ? "" : "s"}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted">
                        {o.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-foreground">{o.total}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${
                          STATUS_STYLES[o.status] ??
                          "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </li>
                );
              })}
              {orders.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No orders yet.</li>
              )}
            </ul>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent enquiries</h2>
            <Link
              href="/messages"
              className="text-xs uppercase tracking-widest text-gold-500 hover:text-gold-600"
            >
              All →
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-border">
              {messages.slice(0, 5).map((m) => (
                <li key={m.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-foreground">
                      {m.firstName} {m.lastName}
                    </p>
                    {m.status === "new" && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-amber-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">{m.message}</p>
                </li>
              ))}
              {messages.length === 0 && (
                <li className="px-5 py-4 text-sm text-muted">No messages yet.</li>
              )}
            </ul>
          </Card>
        </section>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    href={`/products/edit/${p.slug}`}
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
                    href={`/blog/edit/${p.slug}`}
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
