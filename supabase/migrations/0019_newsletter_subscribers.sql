-- Newsletter sign-ups captured from the storefront footer "Subscribe" bar.
-- Anyone — signed in or not — can subscribe, so RLS allows a public (anon)
-- INSERT but no public SELECT: the list is only readable by the Admin app's
-- service-role key. The atelier manages it on the Admin "Newsletter" screen.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  -- Stored lower-cased + trimmed by the app; unique so re-subscribing is a
  -- no-op rather than a duplicate row.
  email       text not null unique check (char_length(email) <= 320),
  -- Where the sign-up came from (e.g. "footer"), for light attribution.
  source      text check (char_length(source) <= 60),
  -- Lets the atelier flag opt-outs without deleting the record.
  status      text not null default 'subscribed'
                check (status in ('subscribed', 'unsubscribed')),
  created_at  timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

-- Public sign-up: the storefront uses the anon key (visitors are usually not
-- signed in), so allow INSERT for anon + authenticated. The checks above bound
-- the payload; there is deliberately NO select policy, so the public cannot
-- read the subscriber list.
drop policy if exists "Anyone can subscribe to the newsletter" on public.newsletter_subscribers;
create policy "Anyone can subscribe to the newsletter"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (true);
