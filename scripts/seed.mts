/**
 * Seeds the sample catalogue into Supabase from the command line — the CLI
 * equivalent of the Admin dashboard's "Seed sample data" button
 * (`app/src/actions/seed.ts`). Uses the service-role key, so run it locally only.
 *
 *   node --env-file=.env.local scripts/seed.mts
 *
 * Upserts on `slug`, so it is safe to run more than once.
 */
import { createClient } from "@supabase/supabase-js";
import { seedProducts, seedPosts } from "../app/src/data/seed.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Run with: node --env-file=.env.local scripts/seed.mts",
  );
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const productRows = seedProducts.map((p, i) => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  price: p.price,
  tagline: p.tagline,
  image: p.image,
  description: p.description,
  details: p.details,
  materials: p.materials,
  sort_order: i,
}));

const postRows = seedPosts.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  date: p.date,
  read_time: p.readTime,
  image: p.image,
  body: p.body,
  sort_order: i,
}));

const { error: pe } = await sb
  .from("products")
  .upsert(productRows, { onConflict: "slug" });
if (pe) {
  console.error("products upsert failed:", pe.message);
  process.exit(1);
}

const { error: oe } = await sb
  .from("posts")
  .upsert(postRows, { onConflict: "slug" });
if (oe) {
  console.error("posts upsert failed:", oe.message);
  process.exit(1);
}

const [{ count: pc }, { count: oc }] = await Promise.all([
  sb.from("products").select("*", { count: "exact", head: true }),
  sb.from("posts").select("*", { count: "exact", head: true }),
]);

console.log(`Seeded ✔  products=${pc}  posts=${oc}`);
