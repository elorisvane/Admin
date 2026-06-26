import { notFound } from "next/navigation";
import { getOrderById } from "@/app/src/data/orders";
import type { OrderAddress } from "@/app/src/data/orders";
import PrintToolbar from "@/app/src/components/PrintToolbar";

export const dynamic = "force-dynamic";

// Atelier return / billing details shown as the invoice issuer. Edit to match
// your registered business address.
const ATELIER = {
  name: "ÉLORIS",
  lines: ["Atelier ÉLORIS", "1 Place Vendôme", "75001 Paris, France"],
  email: "contact@eloris.com",
  phone: "+33 1 00 00 00 00",
};

function parsePrice(price: string | null): number | null {
  if (!price) return null;
  const digits = price.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) ? value : null;
}

function symbolOf(price: string | null | undefined): string {
  return price?.match(/^[^\d\s]+/)?.[0] ?? "$";
}

function money(n: number, symbol: string): string {
  return `${symbol}${n.toLocaleString("en-US")}`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addressLines(a: OrderAddress | null): string[] {
  if (!a) return [];
  return [
    a.recipientName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country,
    a.phone,
  ].filter((v): v is string => Boolean(v));
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const symbol = symbolOf(order.total ?? order.items.find((i) => i.price)?.price);
  const lines = order.items.map((it) => {
    const unit = parsePrice(it.price);
    return { ...it, unit, amount: unit != null ? unit * it.quantity : null };
  });
  const hasNumeric = lines.some((l) => l.amount != null);
  const subtotal = lines.reduce((s, l) => s + (l.amount ?? 0), 0);
  const totalDisplay =
    order.total || (hasNumeric ? money(subtotal, symbol) : "—");

  const billTo = addressLines(order.billingAddress);
  const shipTo = addressLines(order.shippingAddress);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 print:bg-white">
      <PrintToolbar title="Invoice" />

      <div className="mx-auto my-8 max-w-3xl bg-white p-10 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-serif text-3xl tracking-[0.3em] text-neutral-900">
              {ATELIER.name}
            </p>
            <div className="mt-3 space-y-0.5 text-xs leading-relaxed text-neutral-500">
              {ATELIER.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
              <p>{ATELIER.email}</p>
              <p>{ATELIER.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-sans text-sm uppercase tracking-[0.35em] text-neutral-400">
              Invoice
            </p>
            <p className="mt-2 font-mono text-sm text-neutral-700">
              INV-{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              {fullDate(order.createdAt)}
            </p>
            <span className="mt-3 inline-block rounded-full bg-neutral-100 px-3 py-1 text-[10px] uppercase tracking-widest text-neutral-600">
              {order.status}
            </span>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-neutral-200 pt-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              Billed to
            </p>
            <p className="mt-3 font-medium text-neutral-900">
              {order.fullName || "—"}
            </p>
            <p className="text-sm text-neutral-500">{order.email}</p>
            {order.phone && (
              <p className="text-sm text-neutral-500">{order.phone}</p>
            )}
            {billTo.map((l, i) => (
              <p key={i} className="text-sm text-neutral-500">
                {l}
              </p>
            ))}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              Ship to
            </p>
            {shipTo.length > 0 ? (
              shipTo.map((l, i) => (
                <p
                  key={i}
                  className={`text-sm ${i === 0 ? "mt-3 font-medium text-neutral-900" : "text-neutral-500"}`}
                >
                  {l}
                </p>
              ))
            ) : (
              <p className="mt-3 text-sm text-neutral-400">
                Same as billing / to be confirmed
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-[10px] uppercase tracking-[0.2em] text-neutral-400">
              <th className="py-3 font-medium">Piece</th>
              <th className="py-3 text-center font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Unit</th>
              <th className="py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lines.map((l, i) => (
              <tr key={`${l.slug}-${l.material}-${i}`}>
                <td className="py-3">
                  <span className="text-neutral-900">{l.name}</span>
                  {l.material && (
                    <span className="text-neutral-400"> · {l.material}</span>
                  )}
                </td>
                <td className="py-3 text-center text-neutral-600">
                  {l.quantity}
                </td>
                <td className="py-3 text-right text-neutral-600">
                  {l.price || "—"}
                </td>
                <td className="py-3 text-right text-neutral-900">
                  {l.amount != null ? money(l.amount, symbol) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 border-t border-neutral-300 pt-4">
            <div className="flex justify-between font-sans text-sm">
              <span className="uppercase tracking-[0.2em] text-neutral-500">
                Total
              </span>
              <span className="font-serif text-lg text-neutral-900">
                {totalDisplay}
              </span>
            </div>
          </div>
        </div>

        {order.note && (
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
              Note from the client
            </p>
            <p className="mt-2 text-sm italic text-neutral-600">
              “{order.note}”
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-neutral-200 pt-6 text-center text-[11px] leading-relaxed text-neutral-400">
          <p>
            ÉLORIS pieces are made to order. This invoice confirms your request;
            final pricing, secure payment and delivery are arranged by your
            client advisor.
          </p>
          <p className="mt-2 tracking-[0.3em]">THANK YOU</p>
        </div>
      </div>
    </div>
  );
}
