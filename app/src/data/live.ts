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

/** One page in a visitor's journey. */
export interface LiveVisit {
  path: string;
  at: string;
}

/**
 * One visitor's session: who they are and the ordered path they walked through
 * the storefront. This is the "one card per person" the Live activity feed shows
 * instead of a flat, interleaved list of everyone's page views.
 */
export interface LiveSession {
  /** Opaque per-visit id — used only as a stable React key, never shown. */
  id: string;
  location: string | null;
  /** True when this visitor is a first-time visitor (not seen before the window). */
  isNew: boolean;
  /** True when their last page view was within the "here now" window. */
  live: boolean;
  firstAt: string;
  lastAt: string;
  /** Total page views in the window (may exceed the journey shown). */
  views: number;
  /** Pages in the order visited, oldest first, most recent last. */
  journey: LiveVisit[];
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
  /** One entry per visitor, most recently active first, each with its journey. */
  liveSessions: LiveSession[];
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
  // One entry per session id, so the Live activity feed can show a visitor and
  // their whole path rather than a flat, interleaved list of page views.
  const sessionAgg = new Map<
    string,
    {
      visitorId: string;
      location: string | null;
      firstAt: number;
      lastAt: number;
      // Pushed newest-first because `events` is ordered created_at desc.
      views: { path: string; at: string }[];
    }
  >();

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

    const agg = sessionAgg.get(e.session_id);
    if (agg) {
      agg.firstAt = Math.min(agg.firstAt, at);
      agg.lastAt = Math.max(agg.lastAt, at);
      // Events arrive newest-first, so keep the first non-null location we see.
      if (!agg.location && label) agg.location = label;
      agg.views.push({ path: e.path, at: e.created_at });
    } else {
      sessionAgg.set(e.session_id, {
        visitorId: e.visitor_id,
        location: label,
        firstAt: at,
        lastAt: at,
        views: [{ path: e.path, at: e.created_at }],
      });
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
  let returningSet = new Set<string>();
  if (eventsReady && visitors.size > 0) {
    const { data, error } = await supabaseAdmin
      .from("storefront_events")
      .select("visitor_id")
      .in("visitor_id", [...visitors])
      .lt("created_at", windowStart.toISOString());
    if (error) throw new Error(error.message);
    returningSet = new Set(
      (data ?? []).map((r) => (r as { visitor_id: string }).visitor_id),
    );
  }
  const returningVisitors = returningSet.size;

  const byLocation = [...locations.entries()]
    .map(([label, s]) => ({ label, sessions: s.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  // Most recently active visitor first; each with the last stretch of their
  // journey in the order they walked it (oldest → newest).
  const MAX_SESSIONS = 12;
  const MAX_JOURNEY = 20;
  const liveSessions: LiveSession[] = [...sessionAgg.entries()]
    .sort(([, a], [, b]) => b.lastAt - a.lastAt)
    .slice(0, MAX_SESSIONS)
    .map(([id, s]) => ({
      id,
      location: s.location,
      isNew: !returningSet.has(s.visitorId),
      live: s.lastAt >= nowCutoff,
      firstAt: new Date(s.firstAt).toISOString(),
      lastAt: new Date(s.lastAt).toISOString(),
      views: s.views.length,
      // `views` was collected newest-first; reverse to oldest-first, then keep
      // the most recent stretch so a marathon session stays a short card.
      journey: s.views.slice().reverse().slice(-MAX_JOURNEY),
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
    liveSessions,
    takenAt: new Date(now).toISOString(),
    eventsReady,
  };
}
