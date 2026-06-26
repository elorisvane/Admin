import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "fulfilled",
  "cancelled",
];

export interface OrderItem {
  slug: string;
  name: string;
  image?: string;
  price: string;
  material: string;
  quantity: number;
}

/** Address snapshot captured at order time (see storefront checkout). */
export interface OrderAddress {
  recipientName: string | null;
  phone: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

interface OrderAddressRow {
  recipientName?: string | null;
  phone?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface Order {
  id: string;
  userId: string;
  /** Buyer contact snapshot taken at order time. */
  email: string | null;
  fullName: string | null;
  phone: string | null;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  items: OrderItem[];
  total: string | null;
  note: string | null;
  status: OrderStatus;
  createdAt: string;
}

interface OrderRow {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  shipping_address: OrderAddressRow | null;
  billing_address: OrderAddressRow | null;
  items: OrderItem[] | null;
  total: string | null;
  note: string | null;
  status: OrderStatus;
  created_at: string;
}

function mapAddress(row: OrderAddressRow | null): OrderAddress | null {
  if (!row) return null;
  return {
    recipientName: row.recipientName ?? null,
    phone: row.phone ?? null,
    line1: row.line1 ?? null,
    line2: row.line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    postalCode: row.postalCode ?? null,
    country: row.country ?? null,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    shippingAddress: mapAddress(row.shipping_address),
    billingAddress: mapAddress(row.billing_address),
    items: row.items ?? [],
    total: row.total,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Every customer order, newest first. Read with the service-role client so it
 * bypasses the per-user RLS on `orders` (shoppers can only see their own; the
 * atelier needs to see all of them).
 */
export async function getOrders(): Promise<Order[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOrder);
}
