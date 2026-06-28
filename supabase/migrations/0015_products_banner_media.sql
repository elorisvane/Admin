-- A dedicated "banners" gallery for the product page, separate from the
-- jewelry gallery (`images`) and the with-model lifestyle row (`model_media`).
--
-- `banner_media` holds full-width banner photos and videos (jsonb array of
-- public Storage URLs; image vs video inferred from the file extension). Each
-- entry renders as a full-width banner on the storefront product page.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi BEFORE deploying — the product save writes to it.

alter table public.products
  add column if not exists banner_media jsonb not null default '[]'::jsonb;
