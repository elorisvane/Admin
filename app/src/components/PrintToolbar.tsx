"use client";

import Link from "next/link";

/**
 * On-screen toolbar for the printable order documents (invoice / label). Hidden
 * in the actual printout via `print:hidden`, so only the document prints.
 */
export default function PrintToolbar({
  title,
  backHref = "/orders",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-3">
      <Link
        href={backHref}
        className="text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:text-neutral-900"
      >
        ← Back to orders
      </Link>
      <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">
        {title}
      </span>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md bg-neutral-900 px-5 py-2 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-neutral-700"
      >
        Print
      </button>
    </div>
  );
}
