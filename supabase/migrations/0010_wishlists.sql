-- Wishlist / "Saved Creations": the pieces a signed-in shopper has saved to
-- revisit. Each row is one (customer, product) pair. The storefront writes with
-- the anon key + the shopper's JWT, so RLS scopes every row to its owner. The
-- Admin app reads with the service-role key (bypasses RLS) to show, per piece,
-- which customers have saved it.
--
-- A snapshot of the piece (name / image / price / category) is stored at save
-- time so the Admin "Saved Creations" view is self-contained and still renders
-- if the product is later edited or removed.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.wishlists (
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_slug text not null check (char_length(product_slug) <= 200),
  -- Snapshot at save time.
  name         text check (char_length(name) <= 300),
  image        text check (char_length(image) <= 1000),
  price        text check (char_length(price) <= 40),
  category     text check (char_length(category) <= 120),
  created_at   timestamptz not null default now(),
  -- A shopper can save a given piece once.
  primary key (user_id, product_slug)
);

create index if not exists wishlists_user_idx on public.wishlists (user_id);
create index if not exists wishlists_product_idx on public.wishlists (product_slug);

alter table public.wishlists enable row level security;

drop policy if exists "Users can read own wishlist" on public.wishlists;
create policy "Users can read own wishlist"
  on public.wishlists for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add to own wishlist" on public.wishlists;
create policy "Users can add to own wishlist"
  on public.wishlists for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove from own wishlist" on public.wishlists;
create policy "Users can remove from own wishlist"
  on public.wishlists for delete
  to authenticated
  using (auth.uid() = user_id);
