-- Shopping bags: the live contents of each signed-in shopper's bag, so the
-- atelier can see what customers are considering before they place an order.
-- One row per bag line — a (customer, product, material) tuple with a quantity.
-- The storefront writes with the anon key + the shopper's JWT, so RLS scopes
-- every row to its owner; the Admin app reads with the service-role key.
--
-- A snapshot of the piece (name / image / price) is stored at add time so the
-- Admin "Shopping Bags" view is self-contained even if the product changes.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.carts (
  user_id      uuid not null references auth.users (id) on delete cascade,
  product_slug text not null check (char_length(product_slug) <= 200),
  -- Selected material/metal; '' when the piece has none. Part of the key so the
  -- same piece in two materials is two lines (matches the storefront bag).
  material     text not null default '' check (char_length(material) <= 120),
  name         text check (char_length(name) <= 300),
  image        text check (char_length(image) <= 1000),
  price        text check (char_length(price) <= 40),
  quantity     integer not null default 1 check (quantity between 1 and 999),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, product_slug, material)
);

create index if not exists carts_user_idx on public.carts (user_id);

alter table public.carts enable row level security;

drop policy if exists "Users can read own cart" on public.carts;
create policy "Users can read own cart"
  on public.carts for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add to own cart" on public.carts;
create policy "Users can add to own cart"
  on public.carts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart" on public.carts;
create policy "Users can update own cart"
  on public.carts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove from own cart" on public.carts;
create policy "Users can remove from own cart"
  on public.carts for delete
  to authenticated
  using (auth.uid() = user_id);
