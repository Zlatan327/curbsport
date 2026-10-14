import type { Metadata, Viewport } from "next";
import { Oswald, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "@/app/globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Impact", "sans-serif"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "CURBSPORT — Live Pickup Sports & Ground Radar",
    template: "%s · CURBSPORT",
  },
  description: "Find live pickup football and basketball, check if the ball dey ground, build your set and see who's king across Nigerian campuses.",
  applicationName: "Curbsport",
  keywords: ["pickup football", "pickup basketball", "campus sports", "Nigeria", "ground radar", "Curbsport"],
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Curbsport",
    title: "CURBSPORT — Live Pickup Sports & Ground Radar",
    description: "Find the game. Check the ground. Pull up.",
  },
  twitter: { card: "summary", title: "CURBSPORT — Live Pickup Sports & Ground Radar", description: "Find the game. Check the ground. Pull up." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111311",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oswald.variable} ${jakarta.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
