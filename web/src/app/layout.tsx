import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Maintainer",
  description:
    "Warn when an open-source library is dying, abandoned, or quietly hijacked.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="antialiased bg-[#0A0A0A] text-zinc-50 relative min-h-screen">
        {/* Global Blurry Gridline & Ambient Glow Layer */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Ambient Glowing Orbs */}
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-red-600/10 blur-[130px] rounded-full opacity-80" />
          <div className="absolute top-[35%] -left-[10%] w-[600px] h-[600px] bg-indigo-900/15 blur-[140px] rounded-full opacity-60" />
          <div className="absolute top-[65%] -right-[10%] w-[600px] h-[600px] bg-purple-900/15 blur-[140px] rounded-full opacity-60" />

          {/* Primary Crisp Gridlines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_75%,transparent_100%)]" />
          
          {/* Secondary Blurry Gridlines for Depth */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#818cf812_1px,transparent_1px),linear-gradient(to_bottom,#818cf812_1px,transparent_1px)] bg-[size:64px_64px] blur-[1px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)]" />
        </div>

        {children}
      </body>
    </html>
  );
}
