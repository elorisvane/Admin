"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import type { NavCategory } from "../data/nav";

function toRow(c: NavCategory) {
  return {
    label: c.label,
    link_url: c.linkUrl || null,
    sort_order: c.sortOrder,
    // Persist sub-categories as snake_cased jsonb to match the storefront read.
    subcategories: c.subcategories.map((s) => ({
      label: s.label,
      image: s.image,
      link_url: s.linkUrl,
    })),
    updated_at: new Date().toISOString(),
  };
}

export async function saveNavCategory(
  category: NavCategory,
  originalId?: string
) {
  await requireAdmin();
  const row = toRow(category);
  if (originalId) {
    // Editing — update in place.
    const { error } = await supabaseAdmin
      .from("nav_categories")
      .update(row)
      .eq("id", originalId);
    if (error) throw new Error(error.message);
  } else {
    // New category — append to the menu.
    const { error } = await supabaseAdmin.from("nav_categories").insert(row);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/nav-menu");
}

export async function deleteNavCategory(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin
    .from("nav_categories")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/nav-menu");
}
