"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { createClient } from "@/app/src/lib/supabase/client";

const nav = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  {
    href: "/products",
    label: "Products",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    href: "/blog",
    label: "Journal",
    icon: "M4 5h16M4 12h16M4 19h10",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const signOut = () =>
    startSignOut(async () => {
      await createClient().auth.signOut();
      router.replace("/login");
      router.refresh();
    });

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-surface">
      <div className="px-7 py-8 border-b border-border">
        <Link href="/" className="block">
          <p className="font-serif text-2xl tracking-[0.3em] text-foreground">
            ÉLORIS
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-gold-500">
            Atelier Admin
          </p>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-gold-100 text-gold-600"
                      : "text-muted hover:bg-gold-50 hover:text-foreground"
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                  <span className="tracking-wide uppercase text-xs">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-border px-7 py-5">
        <button
          onClick={signOut}
          disabled={signingOut}
          className="block text-xs uppercase tracking-widest text-muted hover:text-gold-500 transition-colors disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
