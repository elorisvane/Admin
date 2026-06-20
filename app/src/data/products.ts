import { supabase } from "../lib/supabase";

export interface Product {
  slug: string;
  name: string;
  category: string;
  /** Display price, pre-formatted (these are made-to-order pieces). */
  price: string;
  /** Short line shown under the name in listings. */
  tagline: string;
  /** Hero / card image. */
  image: string;
  /** Longer descriptive paragraphs for the product page. */
  description: string[];
  /** Key specifications shown as a detail list. */
  details: { label: string; value: string }[];
  /** Available material / metal options. */
  materials: string[];
}

interface ProductRow {
  slug: string;
  name: string;
  category: string;
  price: string;
  tagline: string;
  image: string;
  description: string[] | null;
  details: { label: string; value: string }[] | null;
  materials: string[] | null;
}

export function mapProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    tagline: row.tagline,
    image: row.image,
    description: row.description ?? [],
    details: row.details ?? [],
    materials: row.materials ?? [],
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : undefined;
}
