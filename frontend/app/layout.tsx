import type { Metadata } from "next";
import { GeistPixelSquare } from "geist/font/pixel";
import localFont from "next/font/local";
import "./globals.css";

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
      className={`${GeistPixelSquare.variable} ${openSauce.variable} h-full antialiased`}
    >
      <body className="font-sauce min-h-full flex flex-col items-center justify-center">{children}</body>
    </html>
  );
}
