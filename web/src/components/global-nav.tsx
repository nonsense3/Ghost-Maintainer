import Link from "next/link";

export function GlobalNav({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <nav className="global-nav h-11 flex items-center justify-between px-6 max-w-[1440px] mx-auto w-full">
      <Link href="/" className="text-on-dark text-nav">
        Ghost Maintainer
      </Link>
      <div className="flex items-center gap-5 text-nav text-on-dark">
        <Link href="/dashboard" className="hover:text-primary-on-dark">
          Dashboard
        </Link>
        {right}
      </div>
    </nav>
  );
}
