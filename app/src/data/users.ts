import { supabaseAdmin } from "../lib/supabaseAdmin";

export interface AppUser {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  /** Whether the email has been confirmed. */
  confirmed: boolean;
}

/**
 * Registered storefront customers, from Supabase Auth. Requires the service-role
 * admin API (`auth.admin.listUsers`), so this runs server-side only.
 */
export async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error(error.message);

  return data.users
    .map((u) => {
      const meta = u.user_metadata as { full_name?: string } | undefined;
      return {
        id: u.id,
        email: u.email ?? null,
        fullName: meta?.full_name ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
