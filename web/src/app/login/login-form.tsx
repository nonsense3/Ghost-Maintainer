"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error: authError, next } = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(
    authError ? "Authentication failed. Try again." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`,
        },
      });
      if (error) setMessage(error.message);
      else setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage(error.message);
      else {
        router.push(next ?? "/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  async function signInWithGitHub() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={signInWithGitHub}
        disabled={loading}
        className="btn-dark-utility w-full justify-center flex"
      >
        Continue with GitHub
      </button>
      <div className="relative text-center">
        <span className="text-caption text-ink-muted-48 bg-canvas px-3 relative z-10">
          or email
        </span>
        <div className="absolute inset-x-0 top-1/2 border-t border-divider-soft" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-caption-strong text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="search-input w-full mt-2"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-caption-strong text-ink">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="search-input w-full mt-2"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </label>
        {message && (
          <p className="text-caption text-ink-muted-80" role="status">
            {message}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
      <button
        type="button"
        className="text-link text-body w-full text-center"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
