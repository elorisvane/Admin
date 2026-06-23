-- Home page media: the full-screen campaign sections and the bottom gallery
-- strip on the storefront home page. Each row is a single image OR video so the
-- atelier can swap the home page artwork without a redeploy.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.home_media (
  id          uuid primary key default gen_random_uuid(),
  -- Where on the home page this item appears.
  placement   text not null default 'campaign'
                check (placement in ('campaign', 'gallery')),
  -- Whether `src` points at an image or a video file.
  media_type  text not null default 'image'
                check (media_type in ('image', 'video')),
  -- Path relative to the storefront /public (e.g. "/assets/1 (1).png") or a
  -- full URL.
  src         text not null,
  -- Optional still frame shown before a video plays.
  poster      text,
  -- Campaign sections show a title + subtitle caption over the artwork.
  title       text,
  subtitle    text,
  -- Accessibility / alt text (used for gallery items, optional elsewhere).
  alt         text,
  -- Lower numbers appear first within their placement.
  sort_order  bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists home_media_placement_order_idx
  on public.home_media (placement, sort_order);

-- The storefront reads this table with the anon key, so allow public SELECT
-- (mirrors the products / posts tables). Writes go through the Admin app's
-- service-role key, which bypasses RLS.
alter table public.home_media enable row level security;

drop policy if exists "Public can read home_media" on public.home_media;
create policy "Public can read home_media"
  on public.home_media
  for select
  using (true);
