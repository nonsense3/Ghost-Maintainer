"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  loginWithEmailAction,
  signUpWithEmailAction,
} from "./actions";

interface LoginFormProps {
  initialError?: string;
  nextPath?: string;
}

export function LoginForm({ initialError, nextPath = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    initialError ? "Authentication failed. Please check your credentials or provider setup." : null,
  );
  const [isPending, startTransition] = useTransition();

  // 1. Direct Supabase OAuth Provider Login
  async function handleSupabaseOAuthLogin(provider: "github" = "github") {
    setMessage(null);
    setIsOAuthLoading(true);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          scopes: "read:user user:email repo",
        },
      });

      if (error) {
        if (
          error.message.includes("provider is not enabled") ||
          error.message.includes("Unsupported provider") ||
          error.message.includes("validation_failed")
        ) {
          setMessage(
            `Supabase GitHub OAuth provider is not yet enabled in your Supabase project (Project Dashboard -> Authentication -> Providers -> GitHub). Please enable it or sign in with your email and password below.`
          );
        } else {
          setMessage(error.message);
        }
        setIsOAuthLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to initiate Supabase OAuth login";
      setMessage(errMsg);
      setIsOAuthLoading(false);
    }
  }

  // 2. Email / Password form submission
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("next", nextPath);

    startTransition(async () => {
      const res =
        mode === "signup"
          ? await signUpWithEmailAction(formData)
          : await loginWithEmailAction(formData);

      if (res?.error) {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Supabase OAuth Provider Button */}
      <div>
        <button
          type="button"
          onClick={() => handleSupabaseOAuthLogin("github")}
          disabled={isOAuthLoading || isPending}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 hover:border-zinc-600 transition-all font-medium text-[15px] shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {isOAuthLoading ? "Redirecting to GitHub..." : "Continue with GitHub (Supabase OAuth)"}
        </button>
        <p className="text-xs text-zinc-500 text-center mt-2 font-light">
          Authenticate using Supabase GitHub OAuth provider.
        </p>
      </div>

      <div className="relative text-center">
        <span className="text-xs text-zinc-500 bg-[#111111] px-3 relative z-10 font-medium">
          or sign in with email
        </span>
        <div className="absolute inset-x-0 top-1/2 border-t border-zinc-800" />
      </div>

      {/* 2. Email & Password Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-sm"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
          />
        </div>

        {message && (
          <div
            className="text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-800/60 leading-relaxed"
            role="status"
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isOAuthLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold transition-all text-sm shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isPending
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="pt-1 flex flex-col items-center gap-3">
        <button
          type="button"
          className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            setMessage(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
