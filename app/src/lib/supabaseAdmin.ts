import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || serviceKey === "YOUR-SERVICE-ROLE-KEY") {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing or still the placeholder. " +
      "Paste the real service_role key (Supabase → Settings → API) into Admin/.env.local, then restart the dev server."
  );
}

/**
 * Service-role client — SERVER ONLY. Bypasses row-level security, so it must
 * never be imported into a client component. The `server-only` import above
 * makes the build fail if that ever happens.
 */
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
