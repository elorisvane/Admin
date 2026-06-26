import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export interface CustomerProfile {
  id: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  marketingOptIn: boolean;
}

interface ProfileRow {
  id: string;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  marketing_opt_in: boolean | null;
}

/**
 * Every storefront profile, keyed by auth user id for easy joining against the
 * customer list. Read with the service-role client so it bypasses the per-user
 * RLS on `profiles`.
 */
export async function getProfilesById(): Promise<Map<string, CustomerProfile>> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from("profiles").select("*");
  if (error) throw new Error(error.message);

  const map = new Map<string, CustomerProfile>();
  for (const row of (data ?? []) as ProfileRow[]) {
    map.set(row.id, {
      id: row.id,
      title: row.title,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      marketingOptIn: Boolean(row.marketing_opt_in),
    });
  }
  return map;
}
