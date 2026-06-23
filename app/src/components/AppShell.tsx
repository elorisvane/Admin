"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

/** Routes that render without the admin chrome (sidebar + padded main). */
const BARE_ROUTES = ["/login"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen px-10 py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </>
  );
}
