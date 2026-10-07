import Link from "next/link";
import { GlobalNav } from "@/components/global-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav
        right={
          <Link href="/login" className="btn-dark-utility">
            Sign in
          </Link>
        }
      />
      <section className="product-tile-light text-center flex flex-col items-center gap-6">
        <h1 className="text-hero text-ink max-w-3xl">
          See maintainer risk before the CVE.
        </h1>
        <p className="text-lead text-ink-muted-80 max-w-2xl">
          Dependabot reacts after the bug. Ghost Maintainer tracks burnout,
          tone drift, and takeover signals in public GitHub activity.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Link href="/login" className="btn-primary">
            Get started
          </Link>
          <Link href="/dashboard" className="btn-secondary-pill">
            View dashboard
          </Link>
        </div>
      </section>
      <section className="product-tile-dark text-center">
        <h2 className="text-display-lg mb-4">Hijack / Burnout Risk Score</h2>
        <p className="text-lead text-body-muted max-w-xl mx-auto opacity-80">
          Risk = 0.5 × linguistic score + 0.5 × velocity score — from Gemma on
          comments and SQL behavior signals in Supabase.
        </p>
      </section>
    </div>
  );
}
