"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedDatabase } from "@/app/src/actions/seed";

export default function SeedButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      try {
        await seedDatabase();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Seeding failed");
      }
    });
  };

  return (
    <div className="text-right">
      <button
        onClick={run}
        disabled={pending}
        className="text-xs uppercase tracking-widest text-muted hover:text-gold-500 transition-colors disabled:opacity-50"
        title="Load the original sample catalogue into the database"
      >
        {pending ? "Seeding…" : "Seed sample data"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
