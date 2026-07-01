"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteSettings } from "@/app/src/actions/settings";
import type { SiteSettings } from "@/app/src/data/settings";
import { Card, Field, Input, Textarea, Button } from "@/app/src/components/ui";

export default function ComingSoonSettings({
  settings,
}: {
  settings: SiteSettings;
}) {
  const router = useRouter();
  const [comingSoon, setComingSoon] = useState(settings.comingSoon);
  const [heading, setHeading] = useState(settings.heading);
  const [message, setMessage] = useState(settings.message);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Every save persists the full current state, so it doesn't matter whether the
  // switch or the "Save copy" button triggered it.
  const persist = (next: SiteSettings) => {
    setError(null);
    startTransition(async () => {
      try {
        await saveSiteSettings(next);
        setSavedAt(new Date().toLocaleTimeString());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
        setComingSoon(settings.comingSoon); // roll the switch back on failure
      }
    });
  };

  const toggle = () => {
    const next = !comingSoon;
    setComingSoon(next);
    persist({ comingSoon: next, heading, message });
  };

  const saveCopy = () => persist({ comingSoon, heading, message });

  return (
    <div className="max-w-2xl space-y-6">
      {/* On/off switch */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl text-foreground">Coming Soon mode</p>
            <p className="mt-1 text-sm text-muted">
              {comingSoon
                ? "The storefront is locked — visitors only see the Coming Soon page."
                : "The storefront is live and fully browsable."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={comingSoon}
            aria-label="Toggle Coming Soon mode"
            disabled={pending}
            onClick={toggle}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              comingSoon ? "bg-amber-500" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                comingSoon ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-5">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
              comingSoon
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {comingSoon ? "Locked · Coming Soon" : "Live"}
          </span>
        </div>
      </Card>

      {/* Coming Soon page copy */}
      <Card className="space-y-5 p-6">
        <div>
          <p className="font-serif text-xl text-foreground">Coming Soon page copy</p>
          <p className="mt-1 text-sm text-muted">
            Shown to visitors while the storefront is locked. Leave a field blank
            to use the default wording.
          </p>
        </div>

        <Field label="Heading">
          <Input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Something extraordinary is coming"
          />
        </Field>

        <Field label="Message">
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Our new collection is being crafted. Please return shortly."
          />
        </Field>

        <div className="flex items-center gap-4">
          <Button onClick={saveCopy} disabled={pending}>
            {pending ? "Saving…" : "Save copy"}
          </Button>
          {savedAt && !error && (
            <span className="text-xs text-muted">Saved at {savedAt}</span>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
