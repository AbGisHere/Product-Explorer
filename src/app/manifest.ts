import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Product Explorer",
    short_name: "Explorer",
    description: "Browse, search and save products from the DummyJSON catalogue.",
    start_url: "/",
    display: "standalone",
    background_color: "#e6e6e8",
    theme_color: "#e6e6e8",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
