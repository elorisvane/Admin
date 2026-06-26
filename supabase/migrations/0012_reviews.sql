-- Customer product reviews. A signed-in shopper can leave one review per piece
-- (a 1–5 star rating + optional title and body). Published reviews are public
-- to read; the atelier can hide or remove them from the Admin "Reviews" screen.
--
-- The storefront writes with the anon key + the shopper's JWT (RLS scopes each
-- row to its author) and reads published reviews publicly. The Admin app
-- reads/moderates with the service-role key (bypasses RLS).
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_slug text not null check (char_length(product_slug) <= 200),
  user_id      uuid not null references auth.users (id) on delete cascade,
  -- Snapshot of the reviewer's display name at submit time.
  author_name  text check (char_length(author_name) <= 200),
  rating       int not null check (rating between 1 and 5),
  title        text check (char_length(title) <= 200),
  body         text not null check (char_length(body) between 1 and 5000),
  status       text not null default 'published'
                 check (status in ('published', 'hidden')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- One review per shopper per piece (editable via upsert).
  unique (user_id, product_slug)
);

create index if not exists reviews_product_idx
  on public.reviews (product_slug, created_at desc);

alter table public.reviews enable row level security;

-- Anyone may read published reviews (storefront product pages).
drop policy if exists "Public can read published reviews" on public.reviews;
create policy "Public can read published reviews"
  on public.reviews for select
  to anon, authenticated
  using (status = 'published');

-- A signed-in shopper can always read their own review (even if hidden) so the
-- product page can pre-fill their edit form.
drop policy if exists "Users can read own reviews" on public.reviews;
create policy "Users can read own reviews"
  on public.reviews for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own reviews" on public.reviews;
create policy "Users can create own reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);
