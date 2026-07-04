"use client";

import { useMemo, useState, useTransition } from "react";
import type { Subscriber, SubscriberStatus } from "@/app/src/data/newsletter";
import {
  updateSubscriberStatus,
  deleteSubscriber,
} from "@/app/src/actions/newsletter";
import { Card, Input } from "@/app/src/components/ui";

// Mirrors SUBSCRIBER_STATUSES in data/newsletter.ts (kept local so this client
// bundle doesn't import the service-role data module). The action re-validates.
const STATUS_OPTIONS: { value: SubscriberStatus; label: string }[] = [
  { value: "subscribed", label: "Subscribed" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

const STATUS_STYLES: Record<SubscriberStatus, string> = {
  subscribed: "bg-green-100 text-green-700",
  unsubscribed: "bg-neutral-200 text-neutral-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubscribersTable({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SubscriberStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: subscribers.length };
    for (const s of subscribers) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [subscribers]);

  const filtered = subscribers.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (!query) return true;
    return s.email.toLowerCase().includes(query.toLowerCase());
  });

  const run = (id: string, fn: () => Promise<void>) => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setBusyId(null);
      }
    });
  };

  const remove = (s: Subscriber) => {
    if (!confirm(`Delete the subscriber ${s.email}?`)) return;
    run(s.id, () => deleteSubscriber(s.id));
  };

  const copyEmails = async () => {
    const emails = filtered.map((s) => s.email).join(", ");
    if (!emails) return;
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search by email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUS_OPTIONS.map((s) => s.value)] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
                filter === s
                  ? "border-gold-400 bg-gold-50 text-gold-600"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {s} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyEmails}
          disabled={filtered.length === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs uppercase tracking-widest text-muted transition-colors hover:border-gold-400 hover:text-gold-600 disabled:opacity-50"
        >
          {copied ? "Copied!" : `Copy emails (${filtered.length})`}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Subscribed</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gold-50 transition-colors">
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(s.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <a
                    href={`mailto:${s.email}`}
                    className="text-foreground hover:text-gold-600"
                  >
                    {s.email}
                  </a>
                </td>
                <td className="px-5 py-4 text-muted">{s.source ?? "—"}</td>
                <td className="px-5 py-4">
                  <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLES[s.status]}`}
                  >
                    {s.status}
                  </span>
                  <select
                    value={s.status}
                    disabled={pending && busyId === s.id}
                    onChange={(e) =>
                      run(s.id, () =>
                        updateSubscriberStatus(
                          s.id,
                          e.target.value as SubscriberStatus,
                        ),
                      )
                    }
                    className="block w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold-400 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    disabled={pending && busyId === s.id}
                    className="text-xs uppercase tracking-widest text-muted transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  {subscribers.length === 0
                    ? "No subscribers yet."
                    : "No subscribers match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
