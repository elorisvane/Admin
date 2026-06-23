import { supabaseAdmin } from "../lib/supabaseAdmin";

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

export interface Order {
  id: string;
  userId: string;
  /** Buyer contact snapshot taken at order time. */
  email: string | null;
  fullName: string | null;
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
  items: OrderItem[] | null;
  total: string | null;
  note: string | null;
  status: OrderStatus;
  created_at: string;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
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
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOrder);
}
