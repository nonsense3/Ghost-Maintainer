export function Logo({
  className = "",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Ghost Shield Emblem */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-1.5 shadow-[0_0_20px_rgba(99,102,241,0.35)] ring-1 ring-white/20 transition-transform group-hover:scale-105">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Ghost outline with floating waves */}
          <path
            d="M12 2C7.58172 2 4 5.58172 4 10V21L7 18.5L9.5 21L12 18.5L14.5 21L17 18.5L20 21V10C20 5.58172 16.4183 2 12 2Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Glowing Vigilant Eyes */}
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          {/* Radar Shield Wave */}
          <path
            d="M9 14C10 15 14 15 15 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex items-baseline tracking-tight font-extrabold text-[19px]">
          <span className="text-white">Ghost</span>
          <span className="text-zinc-400 font-normal ml-1.5">Maintainer</span>
        </div>
      )}
    </div>
  );
}
