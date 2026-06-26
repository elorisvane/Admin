"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import type { Post } from "../data/posts";

function toRow(p: Post) {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    read_time: p.readTime,
    image: p.image,
    body: p.body,
    updated_at: new Date().toISOString(),
  };
}

export async function savePost(post: Post, originalSlug?: string) {
  await requireAdmin();
  const row = toRow(post);
  if (originalSlug) {
    const { error } = await supabaseAdmin
      .from("posts")
      .update(row)
      .eq("slug", originalSlug);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from("posts")
      .insert({ ...row, sort_order: Date.now() });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/blog");
}

export async function deletePost(slug: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("posts").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/blog");
}
