"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import { MESSAGE_STATUSES, type MessageStatus } from "../data/messages";

export async function updateMessageStatus(id: string, status: MessageStatus) {
  await requireAdmin();
  if (!MESSAGE_STATUSES.includes(status)) {
    throw new Error(`Unknown message status: ${status}`);
  }
  const { error } = await supabaseAdmin
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
  revalidatePath("/");
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("contact_messages")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/messages");
  revalidatePath("/");
}
