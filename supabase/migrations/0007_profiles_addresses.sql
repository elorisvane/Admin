-- Customer profiles + address book for the storefront account.
--
-- A "profile" holds the personal details a signed-in shopper saves about
-- themselves (name, phone, salutation, date of birth, newsletter opt-in). The
-- "addresses" table is their address book: 0..n saved addresses, each of which
-- can be flagged as the default for shipping and/or billing. At checkout the
-- chosen addresses are snapshotted onto the order (see the orders columns
-- added at the bottom of this file), so order history is preserved even if the
-- shopper later edits or deletes the address.
--
-- Storefront shoppers use the anon key together with their own JWT, so RLS
-- scopes every row to its owner (auth.uid()). The Admin app reads with the
-- service-role key, which bypasses RLS to see everything.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  -- Salutation, e.g. 'Mr', 'Mrs', 'Ms', 'Mx', 'Dr'.
  title           text,
  first_name      text,
  last_name       text,
  phone           text,
  date_of_birth   date,
  marketing_opt_in boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Addresses (address book)
-- ---------------------------------------------------------------------------

create table if not exists public.addresses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  -- Optional nickname, e.g. 'Home', 'Office'.
  label               text,
  recipient_name      text,
  phone               text,
  line1               text,
  line2               text,
  city                text,
  -- State / province / region.
  state               text,
  -- ZIP / PIN / postcode — label adapts to the country in the UI.
  postal_code         text,
  -- ISO-3166 alpha-2 country code, e.g. 'US', 'IN', 'FR'.
  country             text,
  is_default_shipping boolean not null default false,
  is_default_billing  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);

alter table public.addresses enable row level security;

-- Full CRUD, every row scoped to its owner. (Mutual exclusivity of the default
-- flags is enforced app-side: marking one default clears it on the user's other
-- rows in the same write.)
drop policy if exists "Users can read own addresses" on public.addresses;
create policy "Users can read own addresses"
  on public.addresses for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses" on public.addresses;
create policy "Users can insert own addresses"
  on public.addresses for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses" on public.addresses;
create policy "Users can update own addresses"
  on public.addresses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses" on public.addresses;
create policy "Users can delete own addresses"
  on public.addresses for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Order snapshots
--   Capture the shipping / billing address and contact phone at order time so
--   the atelier can fulfil the order, independent of later address-book edits.
-- ---------------------------------------------------------------------------

alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists billing_address  jsonb;
alter table public.orders add column if not exists phone            text;
