import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Sidebar } from "@/components/sidebar"

export const metadata: Metadata = {
  title: "Master Dashboard - AI Vibe Coding Test",
  description: "Admin dashboard for AI Vibe Coding Test platform",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function MasterLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ maxWidth: "1920px" }}>
      <div className="fixed left-0 top-0 z-30 h-screen" style={{ width: "240px" }}>
        <Sidebar />
      </div>

      <div className="ml-[240px] flex h-screen flex-1 flex-col bg-app-surface-muted">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
