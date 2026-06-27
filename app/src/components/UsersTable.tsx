"use client";

import { useState } from "react";
import type { AppUser } from "@/app/src/data/users";
import { Card, Input } from "@/app/src/components/ui";

export interface UserRow extends AppUser {
  orderCount: number;
  phone: string | null;
  marketingOptIn: boolean;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) =>
    `${u.fullName ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search customers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Sign-in</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Last sign-in</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gold-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">
                    {u.fullName || "—"}
                  </p>
                  <p className="text-xs text-muted">{u.email}</p>
                  {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
                  {u.marketingOptIn && (
                    <span className="mt-1 inline-block rounded-full bg-gold-50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold-600">
                      Newsletter
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <ProviderIcons providers={u.providers} />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(u.createdAt)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {formatDate(u.lastSignInAt)}
                </td>
                <td className="px-5 py-4 text-foreground">{u.orderCount}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${
                      u.confirmed
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {u.confirmed ? "Confirmed" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  {users.length === 0
                    ? "No customers have registered yet."
                    : "No customers match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/** Sign-in provider logos for a customer (Google, Apple, email). */
function ProviderIcons({ providers }: { providers: string[] }) {
  const has = (p: string) => providers.includes(p);
  if (!has("google") && !has("apple") && !has("email")) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <div className="flex items-center gap-2.5">
      {has("google") && (
        <span title="Google" aria-label="Google" className="inline-flex">
          <GoogleIcon />
        </span>
      )}
      {has("apple") && (
        <span title="Apple" aria-label="Apple" className="inline-flex">
          <AppleIcon />
        </span>
      )}
      {has("email") && (
        <span
          title="Email & password"
          aria-label="Email & password"
          className="inline-flex"
        >
          <MailIcon />
        </span>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      className="h-4 w-4 text-neutral-800"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.36 12.78c.02 2.36 2.07 3.15 2.1 3.16-.02.06-.33 1.13-1.09 2.24-.66.96-1.34 1.91-2.42 1.93-1.06.02-1.4-.63-2.61-.63-1.21 0-1.59.61-2.59.65-1.04.04-1.83-1.04-2.5-2-1.37-2-.91-5.96 1.25-7.45.56-.5 1.13-.78 1.84-.78 1.13-.02 2.2.76 2.89.76.69 0 1.99-.94 3.35-.8.57.02 2.17.23 3.2 1.74-.08.05-1.91 1.12-1.89 3.33M14.13 7.5c.57-.69.95-1.65.85-2.6-.82.03-1.81.55-2.4 1.24-.53.61-1 1.59-.87 2.53.91.07 1.85-.47 2.42-1.17" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="h-4 w-4 text-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
