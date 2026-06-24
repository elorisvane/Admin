import { supabase } from "../lib/supabase";

export interface Product {
  slug: string;
  name: string;
  category: string;
  /** Display price, pre-formatted (these are made-to-order pieces). */
  price: string;
  /** Short line shown under the name in listings. */
  tagline: string;
  /** Hero / card image (kept in sync with images[0]). */
  image: string;
  /** Full photo gallery; the first entry is the cover. */
  images: string[];
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
  images: string[] | null;
  description: string[] | null;
  details: { label: string; value: string }[] | null;
  materials: string[] | null;
}

export function mapProduct(row: ProductRow): Product {
  // Fall back to the single cover image for rows predating the gallery column.
  const images = row.images?.length
    ? row.images
    : row.image
      ? [row.image]
      : [];
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    tagline: row.tagline,
    image: row.image,
    images,
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

/** Distinct product categories in the catalogue, alphabetically sorted. */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase.from("products").select("category");
  if (error) throw error;
  const seen = new Set(
    (data ?? []).map((r) => (r.category ?? "").trim()).filter(Boolean)
  );
  return [...seen].sort((a, b) => a.localeCompare(b));
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
