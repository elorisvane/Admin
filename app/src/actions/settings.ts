"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import type { SiteSettings } from "../data/settings";

/**
 * Upsert the single site_settings row (id = 1). Used both by the Coming Soon
 * on/off switch and the copy fields — each save persists the full current state.
 * The storefront reads this row fresh on every request, so changes go live
 * within a page load.
 */
export async function saveSiteSettings(input: SiteSettings) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("site_settings").upsert({
    id: 1,
    coming_soon: input.comingSoon,
    heading: input.heading.trim() || null,
    message: input.message.trim() || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/coming-soon");
}
