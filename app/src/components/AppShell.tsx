"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";

/** Routes that render without the admin chrome (sidebar + padded main). */
const BARE_ROUTES = ["/login"];

export default function AppShell({
  children,
  categories = [],
}: {
  children: ReactNode;
  categories?: string[];
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // Printable order documents (…/invoice, …/label) render full-screen too, so
  // the printout — and the on-screen preview — is just the document.
  const isBare =
    BARE_ROUTES.some((r) => pathname.startsWith(r)) ||
    /\/(invoice|label)$/.test(pathname);
  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar
        categories={categories}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="lg:ml-64">
        <MobileTopBar onMenu={() => setNavOpen(true)} />
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </>
  );
}

/** Sticky bar shown below the `lg` breakpoint with the menu trigger + wordmark. */
function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="-ml-1 rounded-md p-2 text-foreground transition-colors hover:bg-gold-50 hover:text-gold-600"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div className="leading-none">
        <span className="font-serif text-lg tracking-[0.25em] text-foreground">
          ÉLORIS
        </span>
        <span className="ml-2 text-[10px] uppercase tracking-[0.3em] text-gold-500">
          Atelier
        </span>
      </div>
    </header>
  );
}
