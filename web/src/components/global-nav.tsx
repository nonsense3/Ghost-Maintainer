import Link from "next/link";

export function GlobalNav({ right }: { right?: React.ReactNode }) {
  return (
    <header className="global-nav sticky top-0 z-50 w-full border-b border-ink-muted-80/30">
      <div className="max-w-[1440px] mx-auto h-11 flex items-center justify-between px-6">
        <Link
          href="/"
          className="text-on-dark text-nav font-semibold tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-primary-on-dark inline-block" />
          Ghost Maintainer
        </Link>
        <div className="hidden md:flex items-center gap-6 text-nav text-on-dark/80">
          <Link href="/#demo" className="hover:text-primary-on-dark transition-colors">
            Demo Comparison
          </Link>
          <Link href="/#scanner" className="hover:text-primary-on-dark transition-colors">
            Dependency Scanner
          </Link>
          <Link href="/#architecture" className="hover:text-primary-on-dark transition-colors">
            Architecture
          </Link>
          <Link href="/#sql" className="hover:text-primary-on-dark transition-colors">
            SQL Signals
          </Link>
          <a
            href="https://github.com/nonsense3/Ghost-Maintainer"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-on-dark transition-colors flex items-center gap-1"
          >
            GitHub
            <span className="text-[10px] opacity-60">↗</span>
          </a>
        </div>
        <div className="flex items-center gap-4 text-nav text-on-dark">
          <Link
            href="/dashboard"
            className="hover:text-primary-on-dark transition-colors font-medium"
          >
            Dashboard
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
