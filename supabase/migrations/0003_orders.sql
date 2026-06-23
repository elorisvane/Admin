-- Customer orders placed from the storefront. Each row is one order request
-- created by a signed-in shopper (Supabase Auth user). ÉLORIS pieces are
-- made-to-order, so an "order" here is a purchase request the atelier follows
-- up on — not a settled payment.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  -- The Supabase Auth user who placed the order.
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Snapshot of the buyer's contact details at order time.
  email       text,
  full_name   text,
  -- Line items as captured from the bag, e.g.
  -- [{ "slug": "...", "name": "...", "material": "...", "price": "$48,500",
  --    "image": "...", "quantity": 1 }]
  items       jsonb not null default '[]'::jsonb,
  -- Pre-formatted order total for display (prices are stored as strings).
  total       text,
  -- Optional note from the client to their advisor.
  note        text,
  -- Atelier workflow state.
  status      text not null default 'pending'
                check (status in ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Shoppers use the anon key with their own JWT, so RLS scopes every row to its
-- owner: a signed-in user may create and read only their own orders. The Admin
-- app reads with the service-role key, which bypasses RLS to view all orders.
alter table public.orders enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = user_id);
