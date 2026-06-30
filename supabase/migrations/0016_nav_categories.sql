-- Storefront top navigation: the category bar shown in the mega-header, and the
-- sub-category tiles that drop down beneath each category. Each row is one
-- top-level category; its `subcategories` jsonb holds the ordered tile list so
-- the atelier can manage the menu without a redeploy.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi BEFORE deploying the Admin/storefront changes.

create table if not exists public.nav_categories (
  id          uuid primary key default gen_random_uuid(),
  -- Top-level label shown in the menu bar (e.g. "HIGH JEWELLERY").
  label       text not null,
  -- Where the menu item links when it has no sub-categories (e.g. "/products").
  link_url    text,
  -- Ordered list of drop-down tiles. Each element is
  --   { "label": text, "image": text (public URL), "link_url": text }
  subcategories jsonb not null default '[]'::jsonb,
  -- Lower numbers appear first in the menu bar.
  sort_order  bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists nav_categories_order_idx
  on public.nav_categories (sort_order);

-- The storefront reads this table with the anon key, so allow public SELECT
-- (mirrors the products / home_media tables). Writes go through the Admin app's
-- service-role key, which bypasses RLS.
alter table public.nav_categories enable row level security;

drop policy if exists "Public can read nav_categories" on public.nav_categories;
create policy "Public can read nav_categories"
  on public.nav_categories
  for select
  using (true);

-- Seed the initial menu (only when the table is empty) so the storefront has
-- the six categories out of the box. HIGH JEWELLERY ships with its tiles.
insert into public.nav_categories (label, link_url, sort_order, subcategories)
select * from (values
  (
    'HIGH JEWELLERY', '/products', 0,
    '[
      {"label":"NECKLACE AND PANDENT","image":"","link_url":"/products"},
      {"label":"RING","image":"","link_url":"/products"},
      {"label":"EARRING","image":"","link_url":"/products"},
      {"label":"BRACELET","image":"","link_url":"/products"},
      {"label":"BRACELET","image":"","link_url":"/products"}
    ]'::jsonb
  ),
  ('FINE JEWELERY', '/products', 1, '[]'::jsonb),
  ('JEWELERY COLLECTION', '/products', 2, '[]'::jsonb),
  ('GIFT IDEA', '/products', 3, '[]'::jsonb),
  ('BESKPOKE', '/products', 4, '[]'::jsonb),
  ('ENGAGEMENT RING', '/products', 5, '[]'::jsonb)
) as seed(label, link_url, sort_order, subcategories)
where not exists (select 1 from public.nav_categories);
