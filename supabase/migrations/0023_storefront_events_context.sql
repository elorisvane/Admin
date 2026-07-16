-- Session context for the Admin Live View: what device a visitor is on, and
-- which campaign sent them.
--
-- Additive to 0020/0021, which stored only path + referrer + coarse geo. That is
-- enough for "where" but not "on what" or "from where", so a Live Activity card
-- couldn't answer the questions the atelier actually asks about a session.
--
-- Device/browser/OS are parsed from the User-Agent SERVER-SIDE in /api/track and
-- stored ONLY as these coarse buckets — the raw UA string is never written. A
-- full UA is a strong fingerprint; "mobile / Safari / iOS" is not. Same spirit as
-- 0020's "no IP address is ever stored".
--
-- UTM tags are campaign attribution the visitor's own inbound link carries
-- (?utm_source=google&...). They describe the ad/campaign, not the person.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

alter table public.storefront_events
  -- Coarse form factor only. Constrained so a bad write can't invent a bucket.
  add column if not exists device_type  text,
  add column if not exists browser      text,
  add column if not exists os           text,
  -- Campaign attribution from the landing URL's query string.
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text;

alter table public.storefront_events
  drop constraint if exists storefront_events_device_type_check;
alter table public.storefront_events
  add constraint storefront_events_device_type_check
  check (device_type is null or device_type in ('mobile', 'tablet', 'desktop'));

alter table public.storefront_events
  drop constraint if exists storefront_events_browser_check;
alter table public.storefront_events
  add constraint storefront_events_browser_check
  check (browser is null or char_length(browser) <= 40);

alter table public.storefront_events
  drop constraint if exists storefront_events_os_check;
alter table public.storefront_events
  add constraint storefront_events_os_check
  check (os is null or char_length(os) <= 40);

alter table public.storefront_events
  drop constraint if exists storefront_events_utm_source_check;
alter table public.storefront_events
  add constraint storefront_events_utm_source_check
  check (utm_source is null or char_length(utm_source) <= 100);

alter table public.storefront_events
  drop constraint if exists storefront_events_utm_medium_check;
alter table public.storefront_events
  add constraint storefront_events_utm_medium_check
  check (utm_medium is null or char_length(utm_medium) <= 100);

alter table public.storefront_events
  drop constraint if exists storefront_events_utm_campaign_check;
alter table public.storefront_events
  add constraint storefront_events_utm_campaign_check
  check (utm_campaign is null or char_length(utm_campaign) <= 100);
