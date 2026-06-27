-- Let the home_media table also drive the two media slots on the products
-- ("Creations") page: the top hero banner ('products_hero') and the in-grid
-- lifestyle banner ('products_grid'). Each supports an image OR a video, exactly
-- like the home page campaign media. The home page ignores these placements, so
-- nothing there changes.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

alter table public.home_media
  drop constraint if exists home_media_placement_check;

alter table public.home_media
  add constraint home_media_placement_check
  check (placement in ('campaign', 'gallery', 'products_hero', 'products_grid'));
