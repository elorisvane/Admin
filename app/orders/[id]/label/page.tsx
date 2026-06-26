import { notFound } from "next/navigation";
import { getOrderById } from "@/app/src/data/orders";
import type { OrderAddress } from "@/app/src/data/orders";
import PrintToolbar from "@/app/src/components/PrintToolbar";

export const dynamic = "force-dynamic";

// Sender / return address printed on the label. Edit to match your atelier.
const ATELIER = {
  name: "ÉLORIS",
  lines: ["Atelier ÉLORIS", "1 Place Vendôme", "75001 Paris, France"],
  phone: "+33 1 00 00 00 00",
};

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
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country,
  ].filter((v): v is string => Boolean(v));
}

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const ship = order.shippingAddress;
  const recipient =
    ship?.recipientName || order.fullName || "Recipient to be confirmed";
  const toLines = addressLines(ship);
  const phone = ship?.phone || order.phone;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 print:bg-white">
      <PrintToolbar title="Delivery label" />

      <div className="flex justify-center px-4 py-8 print:p-0">
        {/* ~4×6in shipping label */}
        <div className="w-[384px] border-2 border-neutral-900 bg-white p-6 print:w-[101.6mm] print:border">
          {/* Brand bar */}
          <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-3">
            <span className="font-serif text-xl tracking-[0.3em]">
              {ATELIER.name}
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-500">
              Handle with care
            </span>
          </div>

          {/* From */}
          <div className="mt-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
              From
            </p>
            <div className="mt-1 text-[11px] leading-snug text-neutral-600">
              {ATELIER.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
              <p>{ATELIER.phone}</p>
            </div>
          </div>

          {/* To */}
          <div className="mt-5 border-t border-neutral-300 pt-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
              Deliver to
            </p>
            <p className="mt-2 text-lg font-semibold leading-tight text-neutral-900">
              {recipient}
            </p>
            <div className="mt-1 space-y-0.5 text-sm leading-snug text-neutral-700">
              {toLines.length > 0 ? (
                toLines.map((l, i) => <p key={i}>{l}</p>)
              ) : (
                <p className="text-neutral-400">Address to be confirmed</p>
              )}
              {phone && <p className="mt-1 text-neutral-600">{phone}</p>}
            </div>
          </div>

          {/* Order ref */}
          <div className="mt-5 flex items-end justify-between border-t-2 border-neutral-900 pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                Order
              </p>
              <p className="font-mono text-sm text-neutral-900">
                {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <p className="text-[10px] text-neutral-500">
              {fullDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
