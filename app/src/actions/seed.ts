"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import { seedProducts, seedPosts } from "../data/seed";

/** Upserts the original sample catalogue. Safe to run more than once. */
export async function seedDatabase() {
  await requireAdmin();
  const productRows = seedProducts.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    tagline: p.tagline,
    image: p.image,
    description: p.description,
    details: p.details,
    materials: p.materials,
    sort_order: i,
  }));
  const { error: pe } = await supabaseAdmin
    .from("products")
    .upsert(productRows, { onConflict: "slug" });
  if (pe) throw new Error(pe.message);

  const postRows = seedPosts.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    read_time: p.readTime,
    image: p.image,
    body: p.body,
    sort_order: i,
  }));
  const { error: oe } = await supabaseAdmin
    .from("posts")
    .upsert(postRows, { onConflict: "slug" });
  if (oe) throw new Error(oe.message);

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/blog");
}
