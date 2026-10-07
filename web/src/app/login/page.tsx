export const instant = false;

import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen bg-canvas-parchment flex flex-col">
      <header className="global-nav h-11 flex items-center justify-center px-6">
        <Link href="/" className="text-on-dark text-nav tracking-tight">
          Ghost Maintainer
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-section">
        <div className="w-full max-w-md bg-canvas rounded-lg p-8 border border-hairline">
          <h1 className="text-display-md text-ink mb-2">Sign in</h1>
          <p className="text-body text-ink-muted-48 mb-8">
            Monitor maintainer health before a CVE exists.
          </p>
          <LoginForm searchParams={Promise.resolve(sp)} />
        </div>
      </main>
    </div>
  );
}
