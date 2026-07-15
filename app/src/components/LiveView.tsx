"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { LiveSnapshot } from "@/app/src/data/live";
import { refreshLiveSnapshot } from "@/app/src/actions/live";
import { Card } from "@/app/src/components/ui";

// WebGL — there is nothing to render on the server, and cobe touches `document`
// at import time, so keep it out of the SSR pass entirely.
const Globe = dynamic(() => import("@/app/src/components/Globe"), {
  ssr: false,
  loading: () => <div className="aspect-square w-full max-w-2xl" />,
});

const POLL_MS = 10_000;

/** "now" / "12s ago" / "3m ago" — how long since a visitor's last page view. */
function relTime(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

/** "Just now" / "12s ago" — how stale the numbers on screen are. */
function useAge(takenAt: string) {
  const [age, setAge] = useState(0);
  useEffect(() => {
    const tick = () =>
      setAge(Math.max(0, Math.round((Date.now() - Date.parse(takenAt)) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [takenAt]);
  return age;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1.5 font-serif text-3xl text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted/70">{hint}</p>}
    </Card>
  );
}

/** Sessions per hour across the window. Flat line when there's no traffic yet. */
function Sparkline({ data }: { data: number[] }) {
  const peak = Math.max(1, ...data);
  return (
    <div className="flex h-12 items-end gap-[3px]">
      {data.map((n, i) => (
        <div
          key={i}
          title={`${n} session${n === 1 ? "" : "s"}`}
          style={{ height: `${Math.max(3, (n / peak) * 100)}%` }}
          className={`flex-1 rounded-sm ${n > 0 ? "bg-gold-400" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default function LiveView({ initial }: { initial: LiveSnapshot }) {
  const [snap, setSnap] = useState(initial);
  const [stale, setStale] = useState(false);
  const age = useAge(snap.takenAt);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const next = await refreshLiveSnapshot();
        if (!cancelled) {
          setSnap(next);
          setStale(false);
        }
      } catch {
        // A dropped poll is not worth an error screen — the numbers simply age,
        // and the header says so until the next poll succeeds.
        if (!cancelled) setStale(true);
      }
    };

    // Each poll is a server round-trip (auth check + several queries), so don't
    // spend one on a tab nobody is looking at — a backgrounded Live View would
    // otherwise bill an invocation every 10s indefinitely. Catch up the moment
    // it comes back to the foreground instead.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const totalVisitors = snap.newVisitors + snap.returningVisitors;
  const newPct = totalVisitors
    ? Math.round((snap.newVisitors / totalVisitors) * 100)
    : 0;
  const peakLocation = snap.byLocation[0]?.sessions || 1;

  return (
    // Desktop: fixed-height two-pane, only the left column scrolls. Mobile: a
    // normal stacked page with the globe on top.
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="order-2 w-full shrink-0 space-y-4 px-5 py-6 lg:order-1 lg:w-[430px] lg:overflow-y-auto lg:border-r lg:border-border">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-serif text-3xl text-foreground">Live View</h1>
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  stale ? "bg-neutral-300" : "animate-pulse bg-gold-500"
                }`}
              />
              {stale ? "Reconnecting…" : age < 5 ? "Just now" : `${age}s ago`}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Who is on the ÉLORIS storefront right now.
          </p>
        </div>

        {!snap.eventsReady && (
          <Card className="border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm text-amber-800">
              Visitor tracking isn&apos;t live yet. Run migrations{" "}
              <span className="font-medium">0020</span> and{" "}
              <span className="font-medium">0021</span> in the Supabase SQL
              editor and deploy the storefront. Orders, sales and bags below are
              already real.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Visitors now"
            value={snap.visitorsNow}
            hint="Last 5 minutes"
          />
          <Stat label="Total sales" value={snap.totalSales} hint="Last 24h" />
          <Stat label="Sessions" value={snap.sessions} hint="Last 24h" />
          <Stat label="Orders" value={snap.orders} hint="Last 24h" />
        </div>

        <Panel title="Customer behaviour">
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: "Active bags", value: snap.activeBags },
              { label: "Checking out", value: snap.checkingOut },
              { label: "Purchased", value: snap.purchased },
            ].map((s, i) => (
              <div key={s.label} className={i === 0 ? "pr-3" : "px-3"}>
                <p className="text-[11px] text-muted">{s.label}</p>
                <p className="mt-1 font-serif text-2xl text-foreground">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Sessions by hour">
          <Sparkline data={snap.sessionsByHour} />
          <p className="mt-2 text-[11px] text-muted/70">24 hours ago → now</p>
        </Panel>

        <Panel title="Sessions by location">
          <ul className="space-y-3">
            {snap.byLocation.map((l) => (
              <li key={l.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{l.label}</span>
                  <span className="ml-3 shrink-0 text-muted">{l.sessions}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-border">
                  <div
                    className="h-1 rounded-full bg-gold-400"
                    style={{ width: `${(l.sessions / peakLocation) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {snap.byLocation.length === 0 && (
              <li className="text-sm text-muted">No sessions yet.</li>
            )}
          </ul>
        </Panel>

        <Panel title="New vs returning">
          {totalVisitors > 0 ? (
            <>
              <div className="flex h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="bg-gold-500"
                  style={{ width: `${newPct}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-foreground">
                  New{" "}
                  <span className="text-muted">· {snap.newVisitors}</span>
                </span>
                <span className="text-foreground">
                  Returning{" "}
                  <span className="text-muted">· {snap.returningVisitors}</span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No visitors yet.</p>
          )}
        </Panel>

        <Panel title="Live activity">
          {/* One card per visitor — who they are, then the path they walked,
              oldest step first — rather than a flat feed of everyone's views. */}
          <ul className="space-y-3">
            {snap.liveSessions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-border bg-surface/40 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          s.live
                            ? "animate-pulse bg-gold-500"
                            : "bg-neutral-300"
                        }`}
                      />
                      <span className="truncate text-sm text-foreground">
                        {s.location ?? "Unknown location"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {s.isNew ? "New visitor" : "Returning visitor"} ·{" "}
                      {s.views} {s.views === 1 ? "page" : "pages"}
                    </p>
                  </div>
                  {/* Relative time is timezone-agnostic, so it can render on the
                      server and hydrate on the client without a mismatch. */}
                  <span className="shrink-0 text-[11px] text-muted">
                    {relTime(s.lastAt)}
                  </span>
                </div>

                <ol className="mt-3 space-y-1.5 border-l border-border pl-3">
                  {s.journey.map((v, i) => (
                    <li
                      key={`${v.at}-${i}`}
                      className="flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="truncate text-foreground">{v.path}</span>
                      {/* Server renders this in its timezone, the browser in the
                          viewer's — which is the intent, so let them differ. */}
                      <span
                        suppressHydrationWarning
                        className="shrink-0 text-[11px] text-muted"
                      >
                        {new Date(v.at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
            {snap.liveSessions.length === 0 && (
              <li className="py-2 text-sm text-muted">No page views yet.</li>
            )}
          </ul>
        </Panel>
      </aside>

      {/* Globe */}
      <div className="relative order-1 flex min-h-[360px] flex-1 items-center justify-center bg-gradient-to-b from-gold-50 to-background p-6 lg:order-2 lg:min-h-0">
        <Globe points={snap.points} />

        <div className="absolute bottom-5 right-5 flex flex-wrap justify-end gap-2">
          {[
            { label: "Visitors right now", dot: "bg-gold-500" },
            { label: "Sessions · 24h", dot: "bg-neutral-400" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-2 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-[11px] text-muted backdrop-blur"
            >
              <span className={`h-2 w-2 rounded-full ${l.dot}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
