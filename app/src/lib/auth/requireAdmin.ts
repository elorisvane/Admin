import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import { isAdminEmail } from "./adminAllowlist";

/**
 * Resolve the signed-in admin from the request cookies, or `null` when the
 * caller is not a signed-in admin.
 *
 * `getUser()` validates the JWT against the Supabase Auth server (it does not
 * trust the cookie blindly), and we additionally require a confirmed email and
 * membership in the ADMIN_EMAILS allowlist. Confirmation matters because a
 * shopper cannot adopt an admin's email without first confirming it.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!user.email_confirmed_at) return null;
  if (!isAdminEmail(user.email)) return null;
  return user;
}

/**
 * Guard for Server Actions and Route Handlers. Throws if the caller is not a
 * signed-in admin.
 *
 * The proxy already gates whole-page navigations, but Next's docs warn that a
 * matcher change or a moved Server Function can silently drop that coverage, so
 * every privileged server entry point must re-check here rather than trust the
 * proxy alone.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw new Error("Not authorized.");
  return user;
}
