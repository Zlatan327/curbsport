import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Curbsport — Live Pickup Sports & Ground Radar",
    short_name: "Curbsport",
    description: "Find pickup football and basketball, check the ground, and fill your set across Nigerian campuses.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#111311",
    theme_color: "#111311",
    orientation: "portrait-primary",
    icons: [
      { src: "/brand-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
