-- Links an anonymous storefront visitor to the customer they turn out to be.
--
-- The Live View (see storefront_events, 0020/0021) is deliberately anonymous: a
-- rotating session id, a per-browser visitor id, and a coarse city — never a
-- name, an email, or an IP. That is the right default.
--
-- This table is the ONE legitimate bridge back to a person: when a shopper
-- *identifies themselves* by signing in, the storefront's /api/identify route
-- records "this visitor_id is this auth user". Nothing is written for signed-out
-- visitors, and the customer's own JWT is verified server-side before the link
-- is made — a browser cannot claim to be someone it isn't.
--
-- With that link, the Admin can join a live session to the customer's existing
-- profile / address book (0007) to show who is on the site — data the customer
-- themselves gave ÉLORIS. It does NOT de-anonymise strangers.
--
-- Written by the storefront and read by the Admin, both with the service-role
-- key, so RLS is enabled with NO policies (see storefront_events for the same
-- pattern): the public anon key can neither read the link nor forge one.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.visitor_identities (
  -- Same per-browser id the beacon stamps on every storefront_events row.
  visitor_id     text primary key check (char_length(visitor_id) <= 64),
  user_id        uuid not null references auth.users (id) on delete cascade,
  -- Snapshotted from the auth user at link time so the Admin needn't touch
  -- auth.users; the live profile/address lookup stays authoritative for the rest.
  email          text check (char_length(email) <= 320),
  full_name      text check (char_length(full_name) <= 200),
  identified_at  timestamptz not null default now()
);

-- "Who are these visitors?" looks up by visitor_id (the primary key already
-- covers that); this index serves the reverse — a customer's linked browsers.
create index if not exists visitor_identities_user_idx
  on public.visitor_identities (user_id);

alter table public.visitor_identities enable row level security;

-- No policies, on purpose — identical reasoning to storefront_events: RLS with
-- zero policies denies anon/authenticated entirely, and both the writer
-- (/api/identify) and the reader (Admin Live View) use the service-role key,
-- which bypasses RLS. So this visitor→customer link cannot be read or forged
-- with the public anon key.
