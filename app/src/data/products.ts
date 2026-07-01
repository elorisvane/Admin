import { supabase } from "../lib/supabase";

export interface Product {
  slug: string;
  name: string;
  /** Top-level menu group, e.g. "HIGH JEWELLERY" (from the Menu & Categories taxonomy). */
  category: string;
  /** Sub-item of the chosen category, e.g. "NECKLACE" (blank if the group has none). */
  subcategory: string;
  /** Display price, pre-formatted (these are made-to-order pieces). */
  price: string;
  /** Short line shown under the name in listings. */
  tagline: string;
  /** Hero / card image (kept in sync with images[0]). */
  image: string;
  /** Jewelry-only gallery (photos + videos); the first entry is the cover. */
  images: string[];
  /** Jewelry-with-model (lifestyle) gallery — photos + videos. Fills the
   *  storefront lifestyle row. */
  modelMedia: string[];
  /** Full-width banner gallery — photos + videos shown as banners on the page. */
  bannerMedia: string[];
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
  subcategory: string | null;
  price: string;
  tagline: string;
  image: string;
  images: string[] | null;
  model_media: string[] | null;
  banner_media: string[] | null;
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
    subcategory: row.subcategory ?? "",
    price: row.price,
    tagline: row.tagline,
    image: row.image,
    images,
    modelMedia: row.model_media ?? [],
    bannerMedia: row.banner_media ?? [],
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
