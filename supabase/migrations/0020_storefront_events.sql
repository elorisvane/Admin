-- Storefront visitor events — the data behind the Admin "Live View" screen.
-- One row per page view.
--
-- This table exists because the storefront's third-party analytics (Google
-- Analytics / Cloudflare, see Frontend Analytics.tsx) report into *their*
-- dashboards and never reach this database, so the Admin had no way to show
-- live traffic. This is the first-party equivalent.
--
-- Deliberately privacy-light: a rotating per-visit session id, a per-browser
-- visitor id, the path, the referrer, and a coarse country/city taken from
-- Vercel's geo headers. No IP address is ever stored.
--
-- The storefront writes through its own /api/track route using the service-role
-- key, and the Admin reads with the service-role key. RLS is therefore enabled
-- with NO policies at all — see the note at the bottom.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.storefront_events (
  id          uuid primary key default gen_random_uuid(),
  -- Per-visit id (sessionStorage on the storefront). One "session" in Live View.
  session_id  text not null check (char_length(session_id) <= 64),
  -- Stable per-browser id (localStorage). Distinguishes new vs returning.
  visitor_id  text not null check (char_length(visitor_id) <= 64),
  path        text not null default '/' check (char_length(path) <= 500),
  -- External referrer only; same-origin navigations are sent as null.
  referrer    text check (char_length(referrer) <= 500),
  -- ISO-3166 alpha-2, from the x-vercel-ip-country header.
  country     text check (char_length(country) <= 2),
  city        text check (char_length(city) <= 120),
  created_at  timestamptz not null default now()
);

-- Every Live View query is "events in a recent window", so lead with created_at.
create index if not exists storefront_events_created_idx
  on public.storefront_events (created_at desc);

-- "Visitors right now" / "Sessions" scan a created_at window and group by session.
create index if not exists storefront_events_session_idx
  on public.storefront_events (created_at desc, session_id);

-- New-vs-returning asks "when was this visitor first seen?".
create index if not exists storefront_events_visitor_idx
  on public.storefront_events (visitor_id, created_at);

alter table public.storefront_events enable row level security;

-- No policies, on purpose. RLS with zero policies denies everything to `anon`
-- and `authenticated`. Both writers and readers use the service-role key, which
-- bypasses RLS — so the traffic log cannot be read (it is a business metric) or
-- forged (rows cannot be injected) with the public anon key.
