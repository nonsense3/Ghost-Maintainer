import Link from "next/link";

export function GlobalNav({ right }: { right?: React.ReactNode }) {
  // Since we are in an app router component that might be a server component,
  // we'll keep the navigation styling simple and use hover states for interactivity.
  
  const navLinks = [
    { to: '#platform', label: 'Platform' },
    { to: '#solutions', label: 'Solutions' },
    { to: '#customers', label: 'Customers' },
    { to: '#docs', label: 'Docs' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-zinc-800/80">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="relative w-40 md:w-48 h-10 flex items-center justify-start -ml-12 md:-ml-24">
            <img src="/logo.png" alt="Ghost Maintainer" className="w-full h-full object-contain scale-[2.5] md:scale-[3] origin-left" />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              href={link.to}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80"
            >
              {link.label}
            </Link>
          ))}
          <div className="w-px h-5 bg-zinc-800 mx-2" />
          <a
            href="https://github.com/nonsense3/Ghost-Maintainer"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 rounded-md transition-all duration-300"
            aria-label="GitHub Repository"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
        </nav>

        {/* Right Action (e.g. Dashboard button) */}
        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          {right}
        </div>
      </div>
    </header>
  );
}
