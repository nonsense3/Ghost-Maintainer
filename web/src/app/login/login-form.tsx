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
  const [tokenInput, setTokenInput] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "token">("signin");
  const [showOAuthGuide, setShowOAuthGuide] = useState(false);
  const [message, setMessage] = useState<string | null>(
    authError ? "Authentication failed. Try again." : null,
  );
  const [loading, setLoading] = useState(false);

  async function signInWithGitHub() {
    setLoading(true);
    setMessage(null);
    setShowOAuthGuide(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`,
        scopes: "read:user user:email repo",
      },
    });
    if (error) {
      if (
        error.message.toLowerCase().includes("not enabled") ||
        error.message.toLowerCase().includes("unsupported")
      ) {
        setShowOAuthGuide(true);
        setMessage(
          "GitHub OAuth is not yet toggled on in your Supabase project dashboard.",
        );
      } else {
        setMessage(error.message);
      }
      setLoading(false);
    }
  }

  async function quickMaintainerSignIn() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: "nonsense3@users.noreply.github.com",
      password: "Password123!",
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      router.push(next ?? "/dashboard");
      router.refresh();
    }
  }

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
          data: tokenInput ? { github_token: tokenInput } : undefined,
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

  return (
    <div className="space-y-6">
      {/* 1. Supabase GitHub OAuth button */}
      <div>
        <button
          type="button"
          onClick={signInWithGitHub}
          disabled={loading}
          className="btn-dark-utility w-full justify-center flex items-center gap-2 py-3"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub (Supabase OAuth)
        </button>
        <p className="text-caption text-ink-muted-48 text-center mt-2">
          Logs in and stores your GitHub provider token in Supabase
        </p>
      </div>

      {/* 2. Quick Developer Auto-Login (Pre-linked to @nonsense3) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={quickMaintainerSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-surface border border-hairline hover:border-ink-muted-48 transition-all flex items-center justify-between text-caption-strong text-ink"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sign in as Maintainer (@nonsense3)
          </span>
          <span className="text-caption text-ink-muted-48 font-normal">
            Pre-stored Token →
          </span>
        </button>
      </div>

      {/* Supabase GitHub OAuth setup guide modal/card if not enabled yet */}
      {showOAuthGuide && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-caption text-amber-950 space-y-2">
          <p className="font-semibold text-amber-900 flex items-center gap-1.5">
            <span>⚙️</span> Enable GitHub OAuth in Supabase (2 min setup):
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              Go to{" "}
              <a
                href="https://supabase.com/dashboard/project/nutthaoveqkdusnmhioy/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                Supabase Dashboard → Authentication → Providers → GitHub
              </a>
            </li>
            <li>Toggle on <strong>Enable GitHub</strong>.</li>
            <li>
              Create a GitHub OAuth App at{" "}
              <a
                href="https://github.com/settings/applications/new"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                github.com/settings/applications/new
              </a>{" "}
              with Callback URL:
              <br />
              <code className="select-all font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px] block mt-1">
                https://nutthaoveqkdusnmhioy.supabase.co/auth/v1/callback
              </code>
            </li>
            <li>Paste Client ID &amp; Secret into Supabase and Save.</li>
          </ol>
          <p className="text-[11px] text-amber-800 pt-1">
            Tip: You can also use the <strong>Sign in as Maintainer</strong> button above right now!
          </p>
        </div>
      )}

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

        {mode === "signup" && (
          <label className="block">
            <span className="text-caption-strong text-ink flex items-center justify-between">
              <span>GitHub Personal Access Token (Optional)</span>
              <span className="text-caption text-ink-muted-48 font-normal">
                Stored in Supabase
              </span>
            </span>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="github_pat_... or ghp_..."
              className="search-input w-full mt-2 font-mono text-xs"
            />
          </label>
        )}

        {message && (
          <p className="text-caption text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200" role="status">
            {message}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {mode === "signup" ? "Create account & store token" : "Sign in"}
        </button>
      </form>

      <div className="flex flex-col gap-2 pt-2">
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
    </div>
  );
}
