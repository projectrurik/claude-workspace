import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Brief",
    short_name: "Brief",
    description: "A varied daily brief of fresh, verified reading.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#b4532a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
