"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Server,
  FileText,
  Trophy,
  ScrollText,
  Settings,
  BarChart3,
  User,
} from "lucide-react"

const menuGroupA = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/admin/dashboard" },
  { icon: KeyRound,        label: "Entry Codes", href: "/admin/entry-codes" },
  { icon: Users,           label: "Users",       href: "/admin/users" },
  { icon: Server,          label: "Server Status", href: "/admin/server-status" },
];

const menuGroupB = [
  { icon: FileText,  label: "Problems", href: "/admin/problems" },
  { icon: Trophy,    label: "Results",  href: "/admin/results" },
  { icon: ScrollText,label: "Logs",     href: "/admin/logs" },
];

const menuGroupC = [
  { icon: Settings,  label: "Settings",  href: "/admin/settings" },
  { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
];

function MenuItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: typeof LayoutDashboard
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        active ? "bg-[#E0EDFF] font-medium text-[#3B82F6]" : "text-[#6B7280] hover:bg-[#F0F7FF] hover:text-[#1A1A1A]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      <span className="text-sm">{label}</span>
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex w-[240px] flex-col border-r border-[#E5E5E5] bg-white min-h-screen">
      {/* SECTION 1 — Logo Area */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C3AED]">
          <span className="text-sm font-bold text-white">AI</span>
        </div>
        <span className="text-sm font-semibold text-[#1A1A1A]">AI Vibe Coding Test</span>
      </div>

      {/* Divider 1 */}
      <div className="mx-4 border-t border-[#E5E5E5]" />

      {/* SECTION 2 — Profile Area */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3E8FF]">
          <User className="h-5 w-5 text-[#7C3AED]" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1A1A1A]">Admin</span>
          <span className="text-xs text-[#6B7280]">Administrator</span>
        </div>
      </div>

      {/* Divider 2 */}
      <div className="mx-4 border-t border-[#E5E5E5]" />

      {/* SECTION 3 — Menu Group A (Main management) */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuGroupA.map((item) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Divider 3 */}
      <div className="mx-4 border-t border-[#E5E5E5]" />

      {/* SECTION 4 — Menu Group B (Exam/operation) */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuGroupB.map((item) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Divider 4 */}
      <div className="mx-4 border-t border-[#E5E5E5]" />

      {/* SECTION 5 — Menu Group C (System/config) */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuGroupC.map((item) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isActive(item.href)}
          />
        ))}
      </nav>
    </aside>
  )
}
