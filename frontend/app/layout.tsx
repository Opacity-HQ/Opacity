import type { Metadata } from "next";
import { GeistPixelSquare } from "geist/font/pixel";
import localFont from "next/font/local";
import "./globals.css";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", GeistPixelSquare.variable, openSauce.variable, "font-sans")}
    >
      <body className="font-sauce min-h-full flex flex-col items-center justify-center">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
