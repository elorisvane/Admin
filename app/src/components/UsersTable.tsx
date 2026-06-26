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
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted">
              <th className="px-5 py-3 font-medium">Customer</th>
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
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
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
