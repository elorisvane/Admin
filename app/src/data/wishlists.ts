import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export interface SavedCreation {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  productSlug: string;
  productName: string | null;
  productImage: string | null;
  productPrice: string | null;
  productCategory: string | null;
  createdAt: string;
}

interface WishlistRow {
  user_id: string;
  product_slug: string;
  name: string | null;
  image: string | null;
  price: string | null;
  category: string | null;
  created_at: string;
}

/**
 * Every saved-creation row (who saved which piece), newest first. Read with the
 * service-role client so it bypasses the per-user RLS on `wishlists`, then
 * resolve each row's customer email/name via the Auth admin API.
 */
export async function getSavedCreations(): Promise<SavedCreation[]> {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("wishlists")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as WishlistRow[];

  // Map auth user id -> contact details for display.
  const { data: usersData, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(usersError.message);

  const userMap = new Map<string, { email: string | null; name: string | null }>();
  for (const u of usersData?.users ?? []) {
    const meta = u.user_metadata as { full_name?: string } | undefined;
    userMap.set(u.id, { email: u.email ?? null, name: meta?.full_name ?? null });
  }

  return rows.map((r) => {
    const u = userMap.get(r.user_id);
    return {
      userId: r.user_id,
      userEmail: u?.email ?? null,
      userName: u?.name ?? null,
      productSlug: r.product_slug,
      productName: r.name,
      productImage: r.image,
      productPrice: r.price,
      productCategory: r.category,
      createdAt: r.created_at,
    };
  });
}
