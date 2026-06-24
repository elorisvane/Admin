-- Optional click-through link for home page media. Any campaign section or
-- gallery image that has a link_url becomes a clickable link on the storefront
-- (e.g. "/products", "/products/aurora-diamond-necklace", or a full https URL).
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

alter table public.home_media
  add column if not exists link_url text;
