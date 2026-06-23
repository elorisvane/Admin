-- Contact form submissions from the storefront "Contact Us" page. Anyone —
-- signed in or not — can send an enquiry, so RLS allows a public (anon) INSERT
-- but no public SELECT: the messages are only readable by the Admin app's
-- service-role key. The atelier triages them on the Admin "Messages" screen.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (char_length(first_name) <= 200),
  last_name   text not null check (char_length(last_name) <= 200),
  email       text not null check (char_length(email) <= 320),
  phone       text check (char_length(phone) <= 60),
  message     text not null check (char_length(message) between 1 and 5000),
  -- Triage state in the Admin inbox.
  status      text not null default 'new'
                check (status in ('new', 'read', 'archived')),
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Public submission: the storefront uses the anon key (visitors are usually not
-- signed in), so allow INSERT for anon + authenticated. The length checks above
-- bound the payload; there is deliberately NO select policy, so the public
-- cannot read other people's messages.
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);
