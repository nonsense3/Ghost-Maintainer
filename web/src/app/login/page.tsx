export const instant = false;

import Link from "next/link";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800/80 bg-[#0A0A0A]/85 backdrop-blur-md flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center group">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#111111] rounded-2xl p-8 border border-zinc-800/80 shadow-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sign in</h1>
            <p className="text-sm text-zinc-400 mt-1 font-light">
              Monitor maintainer health before a CVE exists.
            </p>
          </div>
          <LoginForm searchParams={Promise.resolve(sp)} />
        </div>
      </main>
    </div>
  );
}
