import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export interface AppUser {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  /** Whether the email has been confirmed. */
  confirmed: boolean;
  /** Sign-in methods linked to the account, e.g. ["email"], ["google"], or both. */
  providers: string[];
}

/**
 * Registered storefront customers, from Supabase Auth. Requires the service-role
 * admin API (`auth.admin.listUsers`), so this runs server-side only.
 */
export async function getUsers(): Promise<AppUser[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error(error.message);

  return data.users
    .map((u) => {
      const meta = u.user_metadata as { full_name?: string } | undefined;
      // Collect every linked sign-in method from app_metadata + identities.
      const appMeta = u.app_metadata as
        | { provider?: string; providers?: string[] }
        | undefined;
      const providerSet = new Set<string>();
      (appMeta?.providers ?? []).forEach((p) => p && providerSet.add(p));
      if (appMeta?.provider) providerSet.add(appMeta.provider);
      (u.identities ?? []).forEach(
        (i) => i.provider && providerSet.add(i.provider),
      );
      return {
        id: u.id,
        email: u.email ?? null,
        fullName: meta?.full_name ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
        providers: [...providerSet],
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
