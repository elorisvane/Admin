import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export interface CartLine {
  slug: string;
  name: string | null;
  image: string | null;
  price: string | null;
  material: string;
  quantity: number;
}

export interface CustomerCart {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  items: CartLine[];
  /** Sum of quantities across the bag. */
  pieceCount: number;
  /** Pre-formatted display total. */
  total: string;
  /** Most recent line update in the bag. */
  updatedAt: string;
}

interface CartRow {
  user_id: string;
  product_slug: string;
  material: string | null;
  name: string | null;
  image: string | null;
  price: string | null;
  quantity: number | null;
  updated_at: string;
}

function parsePrice(price: string | null): number | null {
  if (!price) return null;
  const digits = price.replace(/[^0-9.]/g, "");
  if (!digits) return null;
  const value = Number.parseFloat(digits);
  return Number.isFinite(value) ? value : null;
}

function formatTotal(items: CartLine[]): string {
  let total = 0;
  let hasNumeric = false;
  for (const it of items) {
    const unit = parsePrice(it.price);
    if (unit !== null) {
      total += unit * it.quantity;
      hasNumeric = true;
    }
  }
  if (!hasNumeric) return "Price on request";
  const symbol =
    items.find((i) => i.price)?.price?.match(/^[^\d\s]+/)?.[0] ?? "$";
  return `${symbol}${total.toLocaleString("en-US")}`;
}

/**
 * Every signed-in shopper's live bag, grouped per customer, most recently
 * active first. Read with the service-role client so it bypasses the per-user
 * RLS on `carts`, then resolve each customer's email/name via the Auth admin API.
 */
export async function getCustomerCarts(): Promise<CustomerCart[]> {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("carts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CartRow[];

  const { data: usersData, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(usersError.message);
  const userMap = new Map<string, { email: string | null; name: string | null }>();
  for (const u of usersData?.users ?? []) {
    const meta = u.user_metadata as { full_name?: string } | undefined;
    userMap.set(u.id, { email: u.email ?? null, name: meta?.full_name ?? null });
  }

  // Group rows by customer, preserving the most-recent-first row order.
  const order: string[] = [];
  const groups = new Map<string, CartRow[]>();
  for (const r of rows) {
    if (!groups.has(r.user_id)) {
      groups.set(r.user_id, []);
      order.push(r.user_id);
    }
    groups.get(r.user_id)!.push(r);
  }

  return order.map((uid) => {
    const rs = groups.get(uid)!;
    const items: CartLine[] = rs.map((r) => ({
      slug: r.product_slug,
      name: r.name,
      image: r.image,
      price: r.price,
      material: r.material ?? "",
      quantity: r.quantity ?? 1,
    }));
    const u = userMap.get(uid);
    const updatedAt = rs.reduce(
      (max, r) => (r.updated_at > max ? r.updated_at : max),
      rs[0].updated_at,
    );
    return {
      userId: uid,
      userEmail: u?.email ?? null,
      userName: u?.name ?? null,
      items,
      pieceCount: items.reduce((n, i) => n + i.quantity, 0),
      total: formatTotal(items),
      updatedAt,
    };
  });
}
