"use client";

import { use, useState, useTransition } from "react";
import {
  continueWithGitHubAction,
  loginWithEmailAction,
  signUpWithEmailAction,
} from "./actions";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error: authError, next } = use(searchParams);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(
    authError ? "Authentication failed. Please check your credentials." : null,
  );
  const [isPending, startTransition] = useTransition();

  function onGitHubClick() {
    setMessage(null);
    startTransition(async () => {
      const res = await continueWithGitHubAction(next ?? "/dashboard");
      if (res?.error) {
        setMessage(res.error);
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("next", next ?? "/dashboard");

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
      {/* 1. Continue with GitHub button */}
      <div>
        <button
          type="button"
          onClick={onGitHubClick}
          disabled={isPending}
          className="btn-dark-utility w-full justify-center flex items-center gap-2.5 py-3 text-[15px] font-medium"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {isPending ? "Connecting..." : "Continue with GitHub"}
        </button>
        <p className="text-caption text-ink-muted-48 text-center mt-2">
          Sync your maintainer access and repository monitoring.
        </p>
      </div>

      <div className="relative text-center">
        <span className="text-caption text-ink-muted-48 bg-canvas px-3 relative z-10">
          or email
        </span>
        <div className="absolute inset-x-0 top-1/2 border-t border-divider-soft" />
      </div>

      {/* 2. Email & Password Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-caption-strong text-ink">Email</span>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="search-input w-full mt-2"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-caption-strong text-ink">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="search-input w-full mt-2"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="••••••••"
          />
        </label>

        {mode === "signup" && (
          <label className="block">
            <span className="text-caption-strong text-ink flex items-center justify-between">
              <span>GitHub Access Token (Optional)</span>
              <span className="text-caption text-ink-muted-48 font-normal">
                Private Repo Access
              </span>
            </span>
            <input
              type="password"
              name="github_token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="github_pat_... or ghp_..."
              className="search-input w-full mt-2 font-mono text-xs"
            />
          </label>
        )}

        {message && (
          <p
            className="text-caption text-red-600 bg-red-50 p-3 rounded-xl border border-red-200"
            role="status"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full py-2.5 text-[15px]"
        >
          {isPending
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="pt-2 text-center">
        <button
          type="button"
          className="text-link text-body hover:underline"
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
