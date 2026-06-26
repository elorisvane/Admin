/**
 * Admin authorization allowlist.
 *
 * Authentication (a valid Supabase session) is NOT enough to use the Admin app:
 * the storefront and Admin share one Supabase project, so any shopper who signs
 * up on the storefront also holds a valid session here. Authorization is granted
 * only to the emails listed in the server-only ADMIN_EMAILS env var
 * (comma-separated, case-insensitive).
 *
 * Fails closed: an empty or unset ADMIN_EMAILS means *nobody* is an admin, so a
 * misconfiguration locks everyone out rather than letting everyone in.
 *
 * Deliberately has NO `server-only` marker so the Node-runtime proxy can import
 * it too — it holds no secret, it only reads the name of an env var.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
