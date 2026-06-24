"use client";

import { useMemo, useState, useTransition } from "react";
import type { Order, OrderStatus } from "@/app/src/data/orders";
import { updateOrderStatus } from "@/app/src/actions/orders";
import { Card, Input } from "@/app/src/components/ui";

// Mirrors ORDER_STATUSES in data/orders.ts (kept local so this client bundle
// doesn't import the service-role data module). The server action re-validates.
const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  cancelled: "bg-neutral-200 text-neutral-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Small square preview of an ordered piece. */
function ItemThumb({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!query) return true;
    const haystack = [
      o.email,
      o.fullName,
      ...o.items.map((i) => `${i.name} ${i.material}`),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const changeStatus = (id: string, status: OrderStatus) => {
    setError(null);
    setSavingId(id);
    startTransition(async () => {
      try {
        await updateOrderStatus(id, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update");
      } finally {
        setSavingId(null);
      }
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search by customer or piece…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUS_OPTIONS.map((s) => s.value)] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
                filter === s
                  ? "border-gold-400 bg-gold-50 text-gold-600"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {s} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gold-50 transition-colors">
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {o.fullName || "—"}
                  </p>
                  <p className="text-xs text-muted">{o.email}</p>
                </td>
                <td className="px-5 py-4">
                  <ul className="space-y-2">
                    {o.items.map((i, idx) => (
                      <li
                        key={`${i.slug}-${i.material}-${idx}`}
                        className="flex items-center gap-2.5"
                      >
                        <ItemThumb src={i.image} alt={i.name} />
                        <span className="min-w-0">
                          <span className="text-foreground">{i.name}</span>
                          <span className="text-muted">
                            {i.material ? ` · ${i.material}` : ""} × {i.quantity}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {o.note && (
                    <p className="mt-2 max-w-xs text-xs italic text-muted">
                      “{o.note}”
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-foreground">
                  {o.total || "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLES[o.status]}`}
                  >
                    {o.status}
                  </span>
                  <select
                    value={o.status}
                    disabled={pending && savingId === o.id}
                    onChange={(e) =>
                      changeStatus(o.id, e.target.value as OrderStatus)
                    }
                    className="block w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold-400 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  {orders.length === 0
                    ? "No orders have been placed yet."
                    : "No orders match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
