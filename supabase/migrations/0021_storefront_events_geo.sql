-- Coordinates for the Live View globe.
--
-- Additive to 0020: that migration stored only country/city, which is enough for
-- a list but not enough to place a dot on a globe. Vercel resolves the same geo
-- headers into a latitude/longitude, so this costs no extra lookup.
--
-- These are CITY-CENTROID coordinates from the IP geo database, not a device
-- fix, and the /api/track route rounds them to one decimal place (~11 km) before
-- writing — enough to light up the right part of the map, deliberately far too
-- coarse to locate a person. Still no IP address is stored.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) for project
-- ref shrqarenzciqsetfnmpi.

alter table public.storefront_events
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- Guard against a malformed write ever landing off-planet.
alter table public.storefront_events
  drop constraint if exists storefront_events_latitude_range;
alter table public.storefront_events
  add constraint storefront_events_latitude_range
  check (latitude is null or latitude between -90 and 90);

alter table public.storefront_events
  drop constraint if exists storefront_events_longitude_range;
alter table public.storefront_events
  add constraint storefront_events_longitude_range
  check (longitude is null or longitude between -180 and 180);
