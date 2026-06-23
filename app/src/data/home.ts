import { supabase } from "../lib/supabase";

export type Placement = "campaign" | "gallery";
export type MediaType = "image" | "video";

export interface HomeMedia {
  id: string;
  /** Where on the home page this item appears. */
  placement: Placement;
  /** Whether `src` points at an image or a video file. */
  mediaType: MediaType;
  /** Path relative to the storefront /public, or a full URL. */
  src: string;
  /** Optional still frame shown before a video plays. */
  poster: string;
  /** Caption title (campaign sections). */
  title: string;
  /** Caption subtitle (campaign sections). */
  subtitle: string;
  /** Accessibility / alt text. */
  alt: string;
  /** Lower numbers appear first within their placement. */
  sortOrder: number;
}

interface HomeMediaRow {
  id: string;
  placement: Placement | null;
  media_type: MediaType | null;
  src: string;
  poster: string | null;
  title: string | null;
  subtitle: string | null;
  alt: string | null;
  sort_order: number | null;
}

export function mapHomeMedia(row: HomeMediaRow): HomeMedia {
  return {
    id: row.id,
    placement: row.placement ?? "campaign",
    mediaType: row.media_type ?? "image",
    src: row.src,
    poster: row.poster ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    alt: row.alt ?? "",
    sortOrder: row.sort_order ?? 0,
  };
}

export async function getHomeMedia(): Promise<HomeMedia[]> {
  const { data, error } = await supabase
    .from("home_media")
    .select("*")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapHomeMedia);
}

export async function getHomeMediaItem(
  id: string
): Promise<HomeMedia | undefined> {
  const { data, error } = await supabase
    .from("home_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapHomeMedia(data) : undefined;
}
