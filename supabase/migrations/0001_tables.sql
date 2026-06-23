-- ÉLORIS — initial schema for the storefront + admin
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  slug        text primary key,
  name        text not null,
  category    text not null default '',
  price       text not null default '',
  tagline     text not null default '',
  image       text not null default '',
  description jsonb not null default '[]'::jsonb,   -- string[]
  details     jsonb not null default '[]'::jsonb,   -- { label, value }[]
  materials   jsonb not null default '[]'::jsonb,   -- string[]
  sort_order  bigint not null default extract(epoch from now())::bigint,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.posts (
  slug       text primary key,
  title      text not null,
  excerpt    text not null default '',
  category   text not null default '',
  date       text not null default '',
  read_time  text not null default '',
  image      text not null default '',
  body       jsonb not null default '[]'::jsonb,    -- string[]
  sort_order bigint not null default extract(epoch from now())::bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_sort_order_idx on public.products (sort_order);
create index if not exists posts_sort_order_idx on public.posts (sort_order);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * Storefront reads with the anon key  -> public SELECT allowed.
--   * Admin writes with the service_role key -> bypasses RLS entirely,
--     so we deliberately add NO insert/update/delete policies here.
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.posts    enable row level security;

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read posts" on public.posts;
create policy "Public read posts"
  on public.posts for select
  to anon, authenticated
  using (true);
