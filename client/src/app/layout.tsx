import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://curbsport.vercel.app"),
  title: {
    default: "Curbsport — Live Pickup Sports & Ground Radar",
    template: "%s · Curbsport",
  },
  description:
    "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
  applicationName: "Curbsport",
  keywords: [
    "pickup football",
    "basketball courts",
    "campus sports",
    "curbsport",
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
    url: process.env.NEXT_PUBLIC_APP_URL || "https://curbsport.vercel.app",
    siteName: "Curbsport",
    title: "Curbsport — Live Pickup Sports & Ground Radar",
    description:
      "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Curbsport — Live Pickup Sports & Ground Radar",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Curbsport — Live Pickup Sports & Ground Radar",
    description:
      "Find verified football pitches & basketball courts, check live ball radar ('Ball Dey Ground'), rally match sets, and pull up to play across your campus.",
    images: ["/icon.svg"],
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Curbsport",
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
    <html lang="en" className={`${oswald.variable} ${plusJakarta.variable}`}>
      <head />
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
