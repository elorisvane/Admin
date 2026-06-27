"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/src/lib/supabase/client";
import { Card, Field, Input, Button } from "@/app/src/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only honour same-origin absolute paths. Reject protocol-relative ("//evil")
  // and backslash ("/\\evil") targets that browsers normalise to another host,
  // which would turn this into an open redirect after a successful sign-in.
  const rawRedirect = searchParams.get("redirectedFrom");
  const redirectedFrom =
    rawRedirect && /^\/(?![/\\])/.test(rawRedirect) ? rawRedirect : "/";
  const forbidden = searchParams.get("error") === "forbidden";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace(redirectedFrom);
      router.refresh();
    });
  };

  return (
    <Card className="px-8 py-9">
      <form onSubmit={onSubmit} className="space-y-5">
        {forbidden && (
          <p className="text-xs text-red-500">
            This account doesn’t have atelier admin access. Sign in with an
            authorized admin account.
          </p>
        )}

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@eloris.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3 3.9" />
                  <path d="M6.6 6.6A17.2 17.2 0 0 0 2 12s3.6 7 10 7a10.3 10.3 0 0 0 4.2-.9" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </Field>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-serif text-3xl tracking-[0.3em] text-foreground">
            ÉLORIS
          </p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.35em] text-gold-500">
            Atelier Admin
          </p>
          <p className="mt-6 text-sm text-muted">
            Sign in to manage the storefront.
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
