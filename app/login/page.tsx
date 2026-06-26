"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/app/src/lib/supabase/client";
import { Card, Field, Input, Button } from "@/app/src/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";
  const forbidden = searchParams.get("error") === "forbidden";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
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
