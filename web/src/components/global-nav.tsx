import Link from "next/link";
import Image from "next/image";

export function GlobalNav({ right }: { right?: React.ReactNode }) {
  const navLinks = [
    { to: "/#demo", label: "Incident Triage" },
    { to: "/#scanner", label: "Dependency Scanner" },
    { to: "/#sql", label: "SQL Engine" },
    { to: "/dashboard", label: "Live Dashboard" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="Ghost Maintainer Logo"
            width={180}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className="px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-px h-5 bg-zinc-800 mx-2" />
          <a
            href="https://github.com/nonsense3/Ghost-Maintainer"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 rounded-md transition-all duration-200"
            aria-label="GitHub Repository"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-4">
          {!right && (
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
          {right || (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 font-semibold hover:bg-white transition-colors text-sm shadow-sm"
            >
              Launch App
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
