"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";
import type { Product } from "../data/products";

function toRow(p: Product) {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    tagline: p.tagline,
    image: p.image,
    images: p.images,
    description: p.description,
    details: p.details,
    materials: p.materials,
    updated_at: new Date().toISOString(),
  };
}

export async function saveProduct(product: Product, originalSlug?: string) {
  await requireAdmin();
  const row = toRow(product);
  if (originalSlug) {
    // Editing — update in place (also handles a slug rename).
    const { error } = await supabaseAdmin
      .from("products")
      .update(row)
      .eq("slug", originalSlug);
    if (error) throw new Error(error.message);
  } else {
    // New piece — append to the end of the catalogue.
    const { error } = await supabaseAdmin
      .from("products")
      .insert({ ...row, sort_order: Date.now() });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/products");
}

export async function deleteProduct(slug: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("products").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/products");
}
