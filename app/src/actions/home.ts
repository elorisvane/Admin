"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import type { HomeMedia } from "../data/home";

function toRow(m: HomeMedia) {
  return {
    placement: m.placement,
    media_type: m.mediaType,
    src: m.src,
    poster: m.poster || null,
    title: m.title || null,
    subtitle: m.subtitle || null,
    alt: m.alt || null,
    link_url: m.linkUrl || null,
    sort_order: m.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function saveHomeMedia(media: HomeMedia, originalId?: string) {
  const row = toRow(media);
  if (originalId) {
    // Editing — update in place.
    const { error } = await supabaseAdmin
      .from("home_media")
      .update(row)
      .eq("id", originalId);
    if (error) throw new Error(error.message);
  } else {
    // New item — append to the end of its placement.
    const { error } = await supabaseAdmin.from("home_media").insert(row);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/home-media");
}

export async function deleteHomeMedia(id: string) {
  const { error } = await supabaseAdmin
    .from("home_media")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/home-media");
}
