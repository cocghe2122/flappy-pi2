import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flappy Pi",
    short_name: "Flappy Pi",
    description: "Flappy Pi - Bay cùng Pi! Fly with Pi!",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2e1065",
    theme_color: "#5b21b6",
    lang: "vi",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }
}
