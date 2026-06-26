-- Enforce "at most one default per kind, per user" at the database level.
--
-- The app clears the old default then sets the new one in two separate writes
-- (see the storefront profile data layer), which can race into two defaults —
-- or, if the second write fails, none. These partial unique indexes make a
-- second default-shipping / default-billing row for the same user impossible,
-- so the invariant holds regardless of client races. (Zero defaults is still
-- allowed and handled gracefully in the UI.)
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create unique index if not exists addresses_one_default_shipping
  on public.addresses (user_id)
  where is_default_shipping;

create unique index if not exists addresses_one_default_billing
  on public.addresses (user_id)
  where is_default_billing;
