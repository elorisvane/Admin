import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "../auth/adminAllowlist";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Paths that an unauthenticated visitor is allowed to reach. */
const PUBLIC_PATHS = ["/login"];

/**
 * Refreshes the Supabase auth session on every request and gates access:
 * unauthenticated visitors are sent to /login, and signed-in users who hit
 * /login are bounced back to the dashboard.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not run any code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // Authentication is not enough: storefront shoppers share this Supabase
  // project, so they hold valid sessions here too. Only allowlisted admin
  // emails with a confirmed address are authorized — the same test as
  // requireAdmin(), which each Server Action / Route Handler re-runs in case
  // this proxy's matcher ever stops covering a path.
  const isAdmin =
    Boolean(user?.email_confirmed_at) && isAdminEmail(user?.email);

  if (!isAdmin && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    // Signed in, but not an admin: tell the login screen to explain why rather
    // than looking like a failed password.
    if (user) redirectUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdmin && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
