import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

export type ReviewStatus = "published" | "hidden";

export const REVIEW_STATUSES: ReviewStatus[] = ["published", "hidden"];

export interface AdminReview {
  id: string;
  productSlug: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string | null;
  userEmail: string | null;
  status: ReviewStatus;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  product_slug: string;
  user_id: string;
  author_name: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  created_at: string;
}

/**
 * Every review, newest first. Read with the service-role client so it bypasses
 * RLS (sees hidden reviews too), then resolve each author's email via the Auth
 * admin API.
 */
export async function getReviews(): Promise<AdminReview[]> {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ReviewRow[];

  const { data: usersData, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) throw new Error(usersError.message);
  const emailById = new Map<string, string | null>();
  for (const u of usersData?.users ?? []) emailById.set(u.id, u.email ?? null);

  return rows.map((r) => ({
    id: r.id,
    productSlug: r.product_slug,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.author_name,
    userEmail: emailById.get(r.user_id) ?? null,
    status: r.status,
    createdAt: r.created_at,
  }));
}
