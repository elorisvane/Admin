-- Separate "jewelry only" media from "jewelry with model" (lifestyle) media.
--
-- `images` stays as the jewelry-only gallery (photos + videos) shown in the
-- product hero. `model_media` is a new gallery of jewelry-with-model photos and
-- videos: on the storefront the first three fill the lifestyle row and a fourth
-- becomes the full-width banner. Both are jsonb arrays of public Storage URLs
-- (image vs video is inferred from the file extension).
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi BEFORE deploying the Admin/storefront changes — the
-- product save writes to this column.

alter table public.products
  add column if not exists model_media jsonb not null default '[]'::jsonb;
