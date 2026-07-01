import { supabase } from "../lib/supabase";

export interface SiteSettings {
  /** When true, the storefront is locked behind its Coming Soon page. */
  comingSoon: boolean;
  /** Optional Coming Soon heading; blank means "use the storefront default". */
  heading: string;
  /** Optional Coming Soon body copy; blank means "use the storefront default". */
  message: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  comingSoon: false,
  heading: "",
  message: "",
};

interface SiteSettingsRow {
  coming_soon: boolean | null;
  heading: string | null;
  message: string | null;
}

export function mapSettings(row: SiteSettingsRow): SiteSettings {
  return {
    comingSoon: row.coming_soon ?? false,
    heading: row.heading ?? "",
    message: row.message ?? "",
  };
}

/** The single settings row (id = 1), or the defaults if it doesn't exist yet. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("coming_soon, heading, message")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettings(data) : DEFAULT_SETTINGS;
}
