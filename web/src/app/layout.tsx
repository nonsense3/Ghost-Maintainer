import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ghost-maintainer.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ghost Maintainer — AI Open Source Supply Chain Risk & Burnout Intelligence",
    template: "%s | Ghost Maintainer",
  },
  description:
    "Predict open-source supply chain compromises, account takeovers, and maintainer burnout before the CVE is published. Powered by Gemma 4B LLM and SQL window functions.",
  keywords: [
    "ghost maintainer",
    "open source security",
    "supply chain attack prevention",
    "xz-utils backdoor",
    "CVE-2024-3094",
    "maintainer burnout triage",
    "Gemma 4B AI",
    "OWASP top 10 security",
    "pre-CVE vulnerability scanner",
    "GitHub risk scoring",
    "Snowflake SQL analytics",
    "package.json security audit",
  ],
  authors: [{ name: "Ghost Maintainer Core Team", url: "https://github.com/nonsense3/Ghost-Maintainer" }],
  creator: "Ghost Maintainer Team",
  publisher: "Ghost Maintainer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Ghost Maintainer — AI Supply Chain & Maintainer Burnout Intelligence",
    description:
      "Predict open-source supply chain compromises, account takeovers, and maintainer burnout before the CVE is published. Powered by Gemma 4B and SQL analytics.",
    siteName: "Ghost Maintainer",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Ghost Maintainer AI Supply Chain Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Maintainer — Pre-CVE Supply Chain AI Intelligence",
    description:
      "Predict open-source supply chain compromises and maintainer burnout before code is merged. Powered by Gemma 4B and SQL window functions.",
    images: ["/logo.png"],
    creator: "@ghostmaintainer",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <JsonLd />
      </head>
      <body className="antialiased bg-[#0A0A0A] text-zinc-50 relative min-h-screen">
        {/* Global Blurry Gridline & Ambient Glow Layer */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
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
