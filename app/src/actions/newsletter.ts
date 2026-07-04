"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import { SUBSCRIBER_STATUSES, type SubscriberStatus } from "../data/newsletter";

export async function updateSubscriberStatus(
  id: string,
  status: SubscriberStatus,
) {
  await requireAdmin();
  if (!SUBSCRIBER_STATUSES.includes(status)) {
    throw new Error(`Unknown subscriber status: ${status}`);
  }
  const { error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/newsletter");
  revalidatePath("/");
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/newsletter");
  revalidatePath("/");
}
