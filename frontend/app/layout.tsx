import type { Metadata, Viewport } from "next";
import { GeistPixelSquare } from "geist/font/pixel";
import localFont from "next/font/local";
import "./globals.css";
import "blobatar/motion.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const openSauce = localFont({
  src: "./font/open-sauce.ttf",
  variable: "--font-open-sauce",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Opacity",
  description: "Dyslexia screening tool for dyslexic users",
  // Home-screen install on iOS. "default" keeps content below the status
  // bar, so no safe-area padding is needed.
  appleWebApp: {
    capable: true,
    title: "Opacity",
    statusBarStyle: "default",
  },
};

// Matches --background in globals.css for each scheme.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", GeistPixelSquare.variable, openSauce.variable, "font-sans")}
    >
      <body className="font-sauce min-h-full flex flex-col items-center justify-center">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
