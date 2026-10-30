import type { MetadataRoute } from "next";

// Install-only PWA: no service worker, so the installed app always loads
// the live site — same pages, same auth, nothing cached on the device.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Opacity",
    short_name: "Opacity",
    description: "Dyslexia screening tool for dyslexic users",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
