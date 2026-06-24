-- Multiple photos per product. Adds an `images` array (jsonb, like the other
-- list columns) holding the full gallery; the existing `image` column stays as
-- the cover/hero (kept in sync with images[0] by the Admin form) so the
-- storefront cards and anything reading `image` keep working unchanged.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

alter table public.products
  add column if not exists images jsonb not null default '[]'::jsonb;

-- Backfill the gallery from the current single cover image so existing pieces
-- already have a one-photo gallery (the storefront gallery + Admin editor then
-- reflect them immediately).
update public.products
  set images = jsonb_build_array(image)
  where images = '[]'::jsonb
    and image is not null
    and image <> '';
