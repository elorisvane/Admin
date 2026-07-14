import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAdmin } from "../lib/auth/requireAdmin";

/**
 * The Live View snapshot: what is happening on the storefront right now.
 *
 * Traffic comes from `storefront_events` (written by the storefront's /api/track
 * beacon), commerce from `orders` and `carts`. Everything is derived from a
 * rolling window rather than a calendar day, so the numbers never depend on
 * which timezone the server happens to be in.
 */

/** A visitor counts as "here now" if they've loaded a page this recently. */
const NOW_MINUTES = 5;
/** Window behind the session / order / sales totals. */
const WINDOW_HOURS = 24;
/** How recently a session must have been on the bag to count as checking out. */
const CHECKOUT_MINUTES = 15;
/** Paths that mean "this shopper is in the bag / checkout flow". */
const CHECKOUT_PATHS = ["/bag", "/checkout"];

export interface LocationCount {
  label: string;
  sessions: number;
}

export interface RecentView {
  path: string;
  location: string | null;
  at: string;
}

/** One dot on the Live View globe. */
export interface GlobePoint {
  lat: number;
  lng: number;
  sessions: number;
  /** True when a session at this spot is active right now (drives dot colour). */
  live: boolean;
}

export interface LiveSnapshot {
  visitorsNow: number;
  sessions: number;
  orders: number;
  totalSales: string;
  activeBags: number;
  checkingOut: number;
  purchased: number;
  /** Sessions per hour across the window, oldest bucket first. */
  sessionsByHour: number[];
  byLocation: LocationCount[];
  points: GlobePoint[];
  newVisitors: number;
  returningVisitors: number;
  recent: RecentView[];
  /** When this snapshot was taken (ISO), so the client can age it. */
  takenAt: string;
  /**
   * False until migrations 0020 + 0021 have been run. Traffic is then simply
   * unknown, so the screen says so instead of 500-ing on schema that isn't
   * there yet.
   */
  eventsReady: boolean;
}

/**
 * "The events schema isn't there yet" — a missing table (0020 not run) or a
 * missing column (0021 not run). Either way the answer is the same: show the
 * set-up banner rather than crash the page.
 */
function isSchemaMissing(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42P01" || // undefined_table
    error.code === "42703" || // undefined_column
    error.code === "PGRST205" || // unknown table in schema cache
    error.code === "PGRST204" || // unknown column in schema cache
    /storefront_events|latitude|longitude/.test(error.message ?? "")
  );
}

interface EventRow {
  session_id: string;
  visitor_id: string;
  path: string;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

/** Sum order totals, which are stored as pre-formatted display strings. */
function sumTotals(totals: (string | null)[]): string {
  let sum = 0;
  let symbol = "";
  for (const t of totals) {
    if (!t) continue;
    const digits = t.replace(/[^0-9.]/g, "");
    const value = Number.parseFloat(digits);
    if (!Number.isFinite(value)) continue;
    sum += value;
    if (!symbol) symbol = t.match(/^[^\d\s]+/)?.[0] ?? "";
  }
  return `${symbol || "$"}${sum.toLocaleString("en-US")}`;
}

export async function getLiveSnapshot(): Promise<LiveSnapshot> {
  await requireAdmin();

  const now = Date.now();
  const windowStart = new Date(now - WINDOW_HOURS * 3600_000);
  const nowCutoff = now - NOW_MINUTES * 60_000;
  const checkoutCutoff = now - CHECKOUT_MINUTES * 60_000;

  const [eventsRes, ordersRes, cartsRes] = await Promise.all([
    supabaseAdmin
      .from("storefront_events")
      .select(
        "session_id, visitor_id, path, country, city, latitude, longitude, created_at",
      )
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("orders")
      .select("user_id, total, created_at")
      .gte("created_at", windowStart.toISOString()),
    supabaseAdmin.from("carts").select("user_id"),
  ]);

  // Commerce is expected to work; traffic is allowed to be "not set up yet".
  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (cartsRes.error) throw new Error(cartsRes.error.message);
  const eventsReady = !eventsRes.error || !isSchemaMissing(eventsRes.error);
  if (eventsRes.error && eventsReady) throw new Error(eventsRes.error.message);

  const events = (eventsRes.data ?? []) as EventRow[];
  const orders = (ordersRes.data ?? []) as {
    user_id: string | null;
    total: string | null;
  }[];
  const carts = (cartsRes.data ?? []) as { user_id: string }[];

  const visitorsNow = new Set<string>();
  const sessions = new Set<string>();
  const checkingOut = new Set<string>();
  const visitors = new Set<string>();
  const locations = new Map<string, Set<string>>();
  // Coordinates are already rounded to ~11km by the tracker, so events from one
  // city collapse onto a single key — one dot per place, not one per page view.
  const geo = new Map<string, { lat: number; lng: number; sessions: Set<string>; live: boolean }>();
  // Bucket index 0 is the oldest hour in the window, the last is the current one.
  const hourly: Set<string>[] = Array.from(
    { length: WINDOW_HOURS },
    () => new Set<string>(),
  );

  for (const e of events) {
    const at = new Date(e.created_at).getTime();
    sessions.add(e.session_id);
    visitors.add(e.visitor_id);

    if (at >= nowCutoff) visitorsNow.add(e.session_id);

    if (
      at >= checkoutCutoff &&
      CHECKOUT_PATHS.some((p) => e.path === p || e.path.startsWith(`${p}/`))
    ) {
      checkingOut.add(e.session_id);
    }

    const bucket = Math.floor((at - windowStart.getTime()) / 3600_000);
    if (bucket >= 0 && bucket < WINDOW_HOURS) hourly[bucket].add(e.session_id);

    const label = e.city && e.country
      ? `${e.city}, ${e.country}`
      : (e.city ?? e.country);
    if (label) {
      if (!locations.has(label)) locations.set(label, new Set());
      locations.get(label)!.add(e.session_id);
    }

    if (e.latitude !== null && e.longitude !== null) {
      const key = `${e.latitude},${e.longitude}`;
      const spot = geo.get(key) ?? {
        lat: e.latitude,
        lng: e.longitude,
        sessions: new Set<string>(),
        live: false,
      };
      spot.sessions.add(e.session_id);
      if (at >= nowCutoff) spot.live = true;
      geo.set(key, spot);
    }
  }

  // New vs returning: a visitor is "returning" if they were seen before this
  // window opened. One grouped query would be nicer, but PostgREST can't express
  // it, so ask only about the visitors we actually saw.
  let returningVisitors = 0;
  if (eventsReady && visitors.size > 0) {
    const { data, error } = await supabaseAdmin
      .from("storefront_events")
      .select("visitor_id")
      .in("visitor_id", [...visitors])
      .lt("created_at", windowStart.toISOString());
    if (error) throw new Error(error.message);
    returningVisitors = new Set(
      (data ?? []).map((r) => (r as { visitor_id: string }).visitor_id),
    ).size;
  }

  const byLocation = [...locations.entries()]
    .map(([label, s]) => ({ label, sessions: s.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  const recent: RecentView[] = events.slice(0, 12).map((e) => ({
    path: e.path,
    location:
      e.city && e.country ? `${e.city}, ${e.country}` : (e.city ?? e.country),
    at: e.created_at,
  }));

  return {
    visitorsNow: visitorsNow.size,
    sessions: sessions.size,
    orders: orders.length,
    totalSales: sumTotals(orders.map((o) => o.total)),
    activeBags: new Set(carts.map((c) => c.user_id)).size,
    checkingOut: checkingOut.size,
    purchased: new Set(orders.map((o) => o.user_id).filter(Boolean)).size,
    sessionsByHour: hourly.map((s) => s.size),
    byLocation,
    points: [...geo.values()].map((p) => ({
      lat: p.lat,
      lng: p.lng,
      sessions: p.sessions.size,
      live: p.live,
    })),
    newVisitors: visitors.size - returningVisitors,
    returningVisitors,
    recent,
    takenAt: new Date(now).toISOString(),
    eventsReady,
  };
}
