-- Harden the orders table against malformed / abusive / spoofed inserts.
--
-- Background: orders are inserted by signed-in shoppers with the anon key, so
-- the only gate is RLS (auth.uid() = user_id). That stops one user writing rows
-- as another, but it does NOT bound the payload or stop the client lying about
-- the contact snapshot (email / full_name) or stuffing a giant items/note blob.
-- The storefront's createOrder() sets those from the session, but a raw API
-- call can send anything. This migration adds (1) size CHECK constraints, like
-- contact_messages already has, and (2) a BEFORE INSERT trigger that overwrites
-- the owner + contact snapshot from auth.users, so they cannot be forged.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

-- ---------------------------------------------------------------------------
-- 1. Bound the free-form / client-supplied columns.
--    (drop-then-add keeps this re-runnable; CHECKs validate existing rows, so
--     run on a clean table or widen the limits if you have outsized legacy rows)
-- ---------------------------------------------------------------------------

alter table public.orders drop constraint if exists orders_note_len;
alter table public.orders add constraint orders_note_len
  check (note is null or char_length(note) <= 2000);

alter table public.orders drop constraint if exists orders_total_len;
alter table public.orders add constraint orders_total_len
  check (total is null or char_length(total) <= 40);

alter table public.orders drop constraint if exists orders_email_len;
alter table public.orders add constraint orders_email_len
  check (email is null or char_length(email) <= 320);

alter table public.orders drop constraint if exists orders_full_name_len;
alter table public.orders add constraint orders_full_name_len
  check (full_name is null or char_length(full_name) <= 200);

alter table public.orders drop constraint if exists orders_phone_len;
alter table public.orders add constraint orders_phone_len
  check (phone is null or char_length(phone) <= 60);

-- Bound the line-item array: at most 50 lines, and a hard ceiling on the raw
-- JSON size so a single line can't carry a multi-MB string.
alter table public.orders drop constraint if exists orders_items_bounds;
alter table public.orders add constraint orders_items_bounds
  check (
    jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) <= 50
    and char_length(items::text) <= 100000
  );

-- Bound the snapshotted address blobs.
alter table public.orders drop constraint if exists orders_shipping_addr_len;
alter table public.orders add constraint orders_shipping_addr_len
  check (shipping_address is null or char_length(shipping_address::text) <= 4000);

alter table public.orders drop constraint if exists orders_billing_addr_len;
alter table public.orders add constraint orders_billing_addr_len
  check (billing_address is null or char_length(billing_address::text) <= 4000);

-- ---------------------------------------------------------------------------
-- 2. Force the owner + buyer contact snapshot from the authenticated user.
--    The client cannot override user_id / email / full_name: whatever it sends
--    is replaced with the truth from auth.users for the current auth.uid().
-- ---------------------------------------------------------------------------

create or replace function public.orders_set_buyer()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  u_email text;
  u_name  text;
begin
  -- auth.uid() is the JWT subject of the signed-in shopper; ignore any client
  -- value. (RLS WITH CHECK still requires user_id = auth.uid(), which this
  -- guarantees.)
  new.user_id := auth.uid();

  select au.email, au.raw_user_meta_data ->> 'full_name'
    into u_email, u_name
    from auth.users au
   where au.id = auth.uid();

  new.email := u_email;
  new.full_name := u_name;
  return new;
end;
$$;

drop trigger if exists orders_set_buyer_before_insert on public.orders;
create trigger orders_set_buyer_before_insert
  before insert on public.orders
  for each row execute function public.orders_set_buyer();
