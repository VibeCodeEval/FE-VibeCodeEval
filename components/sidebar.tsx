"use client"

import Link from "next/link";
import type React from "react"

import { LayoutDashboard, Users, CalendarClock, Settings, FileCode, List, User } from "lucide-react"

interface SidebarProps {
  activeItem: string
  onItemClick: (item: string) => void
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href: string;
}

const sidebarFontFamily = "Inter, system-ui, -apple-system, sans-serif"

const textStyle = {
  fontSize: "14px",
  lineHeight: "20px",
  letterSpacing: "-0.01em",
  fontFamily: sidebarFontFamily,
}

const menuGroupA: MenuItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master",
  },
  {
    label: "Admin Accounts",
    icon: <Users className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/admin-accounts",
  },
]

const menuGroupB: MenuItem[] = [
  {
    label: "Test Sessions",
    icon: <CalendarClock className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/test-sessions",
  },
  {
    label: "Global Settings",
    icon: <Settings className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/global-settings",
  },
  {
    label: "Problem",
    icon: <FileCode className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/problem",
  },
  {
    label: "Platform Logs",
    icon: <List className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/platform-logs",
  },
]

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-screen sticky top-0"
      style={{
        width: "240px",
        minWidth: "240px",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E5E5E5",
        fontFamily: sidebarFontFamily,
      }}
    >
      {/* Section 1 - Logo Row */}
      <div className="px-5 py-6 flex items-center gap-3">
        {/* Logo Circle */}
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#7C3AED",
          }}
        >
          <span style={{ ...textStyle, color: "#FFFFFF", fontWeight: 500 }}>AI</span>
        </div>
        {/* Logo Text */}
        <span style={{ ...textStyle, color: "#1A1A1A", fontWeight: 700 }}>AI Vibe Coding Test</span>
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ borderTop: "1px solid #E5E5E5" }} />

      {/* Section 2 - Profile Row */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{
            width: "36px",
            height: "36px",
            backgroundColor: "#F3E8FF",
          }}
        >
          <User size={20} strokeWidth={1.5} style={{ color: "#7C3AED" }} />
        </div>
        {/* Profile Text */}
        <div className="flex flex-col">
          <span style={{ ...textStyle, color: "#1A1A1A", fontWeight: 500 }}>Master</span>
          <span style={{ ...textStyle, color: "#6B7280", fontWeight: 400, fontSize: "12px" }}>Administrator</span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4" style={{ borderTop: "1px solid #E5E5E5" }} />

      {/* Section 3 - Menu Group A */}
      <nav className="px-3 py-4 flex flex-col gap-1">
        {menuGroupA.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-[#F5F5F5]"
            onClick={() => onItemClick && onItemClick(item.label)}
          >
            <div className="flex h-5 w-5 items-center justify-center shrink-0">
              {item.icon}
            </div>
            
            <span style={textStyle}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4" style={{ borderTop: "1px solid #E5E5E5" }} />

      {/* Section 4 - Menu Group B */}
      <nav className="px-3 py-4 flex flex-col gap-1">
        {menuGroupB.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-5 py-2.5 rounded-xl hover:bg-[#F5F5F5]"
            onClick={() => onItemClick && onItemClick(item.label)}
          >
            <div className="flex h-5 w-5 items-center justify-center shrink-0">
              {item.icon}
            </div>

            <span style={textStyle}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

interface MenuItemButtonProps {
  item: MenuItem
  isActive: boolean
  onClick: () => void
}

function MenuItemButton({ item, isActive, onClick }: MenuItemButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150"
      style={{
        backgroundColor: isActive ? "#E0EDFF" : "transparent",
        color: isActive ? "#3B82F6" : "#6B7280",
        fontFamily: sidebarFontFamily,
        fontWeight: isActive ? 500 : 400,
        fontSize: "14px",
        lineHeight: "20px",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#F0F7FF"
          e.currentTarget.style.color = "#1A1A1A"
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent"
          e.currentTarget.style.color = "#6B7280"
        }
      }}
    >
      <span className="shrink-0" style={{ color: isActive ? "#3B82F6" : "#6B7280" }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  )
}
