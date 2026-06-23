"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { ORDER_STATUSES, type OrderStatus } from "../data/orders";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Unknown order status: ${status}`);
  }
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/orders");
  revalidatePath("/");
}
