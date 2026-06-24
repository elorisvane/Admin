"use client";

import { useMemo, useState, useTransition } from "react";
import type { ContactMessage, MessageStatus } from "@/app/src/data/messages";
import { updateMessageStatus, deleteMessage } from "@/app/src/actions/messages";
import { Card, Input } from "@/app/src/components/ui";

// Mirrors MESSAGE_STATUSES in data/messages.ts (kept local so this client
// bundle doesn't import the service-role data module). The action re-validates.
const STATUS_OPTIONS: { value: MessageStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<MessageStatus, string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-blue-100 text-blue-700",
  archived: "bg-neutral-200 text-neutral-500",
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

export default function MessagesTable({
  messages,
}: {
  messages: ContactMessage[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MessageStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: messages.length };
    for (const m of messages) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [messages]);

  const filtered = messages.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (!query) return true;
    return `${m.firstName} ${m.lastName} ${m.email} ${m.message}`
      .toLowerCase()
      .includes(query.toLowerCase());
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

  const remove = (m: ContactMessage) => {
    if (!confirm(`Delete the message from ${m.firstName} ${m.lastName}?`)) return;
    run(m.id, () => deleteMessage(m.id));
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search messages…"
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
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Received</th>
              <th className="px-5 py-3 font-medium">From</th>
              <th className="px-5 py-3 font-medium">Message</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gold-50 transition-colors">
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(m.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {m.firstName} {m.lastName}
                  </p>
                  <a
                    href={`mailto:${m.email}`}
                    className="text-xs text-muted hover:text-gold-600"
                  >
                    {m.email}
                  </a>
                  {m.phone && <p className="text-xs text-muted">{m.phone}</p>}
                </td>
                <td className="px-5 py-4">
                  <p className="max-w-md whitespace-pre-wrap text-foreground">
                    {m.message}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLES[m.status]}`}
                  >
                    {m.status}
                  </span>
                  <select
                    value={m.status}
                    disabled={pending && busyId === m.id}
                    onChange={(e) =>
                      run(m.id, () =>
                        updateMessageStatus(m.id, e.target.value as MessageStatus),
                      )
                    }
                    className="block w-full cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold-400 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    disabled={pending && busyId === m.id}
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
                  {messages.length === 0
                    ? "No messages yet."
                    : "No messages match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
