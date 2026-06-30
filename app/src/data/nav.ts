import { supabase } from "../lib/supabase";

/** A drop-down tile shown beneath a category in the storefront mega-header. */
export interface NavSubcategory {
  label: string;
  /** Public Storage URL of the tile image (empty = neutral placeholder). */
  image: string;
  /** Click-through URL for the tile. */
  linkUrl: string;
}

export interface NavCategory {
  id: string;
  /** Top-level label shown in the menu bar. */
  label: string;
  /** Where the item links when it has no sub-categories. */
  linkUrl: string;
  /** Lower numbers appear first in the menu bar. */
  sortOrder: number;
  /** Ordered drop-down tiles. */
  subcategories: NavSubcategory[];
}

interface NavCategoryRow {
  id: string;
  label: string;
  link_url: string | null;
  sort_order: number | null;
  subcategories: unknown;
}

function mapSubcategory(value: unknown): NavSubcategory {
  const o = (value ?? {}) as Record<string, unknown>;
  return {
    label: typeof o.label === "string" ? o.label : "",
    image: typeof o.image === "string" ? o.image : "",
    linkUrl: typeof o.link_url === "string" ? o.link_url : "",
  };
}

export function mapNavCategory(row: NavCategoryRow): NavCategory {
  return {
    id: row.id,
    label: row.label,
    linkUrl: row.link_url ?? "",
    sortOrder: row.sort_order ?? 0,
    subcategories: Array.isArray(row.subcategories)
      ? row.subcategories.map(mapSubcategory)
      : [],
  };
}

export async function getNavCategories(): Promise<NavCategory[]> {
  const { data, error } = await supabase
    .from("nav_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapNavCategory);
}

export async function getNavCategory(
  id: string
): Promise<NavCategory | undefined> {
  const { data, error } = await supabase
    .from("nav_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapNavCategory(data) : undefined;
}
