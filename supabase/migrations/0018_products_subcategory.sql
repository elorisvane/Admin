-- Two-level product classification. The existing `category` column now holds a
-- top-level menu group (e.g. "HIGH JEWELLERY") and `subcategory` holds the
-- group's sub-item (e.g. "NECKLACE"). Both are chosen in the Admin product form
-- from the live "Menu & Categories" taxonomy (the `nav_categories` table), so
-- they always match the storefront menu.
--
-- The storefront routes and filters by `category` (e.g. /products/high-jewellery
-- /<slug>), so re-save existing pieces to pick their new top-level group.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi BEFORE deploying — the product save writes to it.

alter table public.products
  add column if not exists subcategory text not null default '';
