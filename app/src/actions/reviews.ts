"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import { REVIEW_STATUSES, type ReviewStatus } from "../data/reviews";

export async function setReviewStatus(id: string, status: ReviewStatus) {
  await requireAdmin();
  if (!REVIEW_STATUSES.includes(status)) {
    throw new Error(`Unknown review status: ${status}`);
  }
  const { error } = await supabaseAdmin
    .from("reviews")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reviews");
}

export async function deleteReview(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reviews");
}
