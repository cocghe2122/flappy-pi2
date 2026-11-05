import type { Metadata, Viewport } from "next"
import { FlappyGame } from "@/components/flappy-game"

export const metadata: Metadata = {
  title: "Flappy Pi",
  description: "Flappy Pi - Bay cùng Pi! Fly with Pi!",
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#5b21b6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function Page() {
  return <FlappyGame />
}
