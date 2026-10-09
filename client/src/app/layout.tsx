import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://insidelife.vercel.app"),
  title: {
    default: "Inside Life — Live Pickup Sports & Ground Radar",
    template: "%s · Inside Life",
  },
  description:
    "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
  applicationName: "Inside Life",
  keywords: [
    "pickup football",
    "basketball courts",
    "campus sports",
    "inside life",
    "ball dey ground",
    "street ball",
    "match lobbies",
    "UNIZIK",
    "Nigeria",
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://insidelife.vercel.app",
    siteName: "Inside Life",
    title: "Inside Life — Live Pickup Sports & Ground Radar",
    description:
      "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Inside Life — Live Pickup Sports & Ground Radar",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Inside Life — Live Pickup Sports & Ground Radar",
    description:
      "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
    images: ["/icon.svg"],
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inside Life",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#111311",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
