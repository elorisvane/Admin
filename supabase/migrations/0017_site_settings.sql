-- Global storefront settings — a single row the atelier can edit without a
-- redeploy. Currently drives "Coming Soon" mode: when `coming_soon` is true the
-- entire storefront is locked behind a Coming Soon page (the Admin toggles it
-- from the Site Availability screen).
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi BEFORE deploying the Admin/storefront changes.

create table if not exists public.site_settings (
  -- Enforce a single settings row: the id is always 1.
  id           smallint primary key default 1 check (id = 1),
  -- When true, the storefront shows only the Coming Soon page.
  coming_soon  boolean not null default false,
  -- Optional Coming Soon copy; blank falls back to the storefront defaults.
  heading      text,
  message      text,
  updated_at   timestamptz not null default now()
);

-- The storefront reads this with the anon key, so allow public SELECT (mirrors
-- products / home_media / nav_categories). Writes go through the Admin app's
-- service-role key, which bypasses RLS.
alter table public.site_settings enable row level security;

drop policy if exists "Public can read site_settings" on public.site_settings;
create policy "Public can read site_settings"
  on public.site_settings
  for select
  using (true);

-- Seed the single settings row (only when the table is empty) so both apps have
-- a row to read/upsert. Ships live (coming_soon = false).
insert into public.site_settings (id, coming_soon)
select 1, false
where not exists (select 1 from public.site_settings);
