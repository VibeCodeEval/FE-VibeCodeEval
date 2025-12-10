"use client"

import { useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation"
import type React from "react"

import { LayoutDashboard, Users, CalendarClock, Settings, FileCode, List, User, LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { logoutAdmin } from "@/lib/api/admin"

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
    label: "대시보드",
    icon: <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master",
  },
  {
    label: "관리자 계정",
    icon: <Users className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/admin-accounts",
  },
]

const menuGroupB: MenuItem[] = [
  {
    label: "테스트 세션",
    icon: <CalendarClock className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/test-sessions",
  },
  {
    label: "전역 설정",
    icon: <Settings className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/global-settings",
  },
  {
    label: "문제 관리",
    icon: <FileCode className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/problem",
  },
  {
    label: "플랫폼 로그",
    icon: <List className="h-5 w-5" strokeWidth={1.5} />,
    href: "/master/platform-logs",
  },
]

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const router = useRouter()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      // 백엔드 로그아웃 API 호출
      await logoutAdmin()
      // API 호출 성공/실패와 관계없이 프론트엔드 세션 정리 및 리다이렉트
      // (logoutAdmin 함수 내부에서 이미 localStorage를 정리함)
      setShowLogoutModal(false)
      router.push("/")
    } catch (error) {
      // 에러가 발생해도 로그아웃은 진행 (idempotent)
      setShowLogoutModal(false)
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

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
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
            <span style={{ ...textStyle, color: "#6B7280", fontWeight: 400, fontSize: "12px" }}>마스터 관리자</span>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="flex items-center justify-center rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1A1A]"
          title="로그아웃"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
        </button>
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

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">
              로그아웃 하시겠습니까?
            </DialogTitle>
            <DialogDescription className="text-[#6B7280] mt-2">
              로그아웃하면 마스터 대시보드에서 나가게 됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="border-[#E5E5E5] text-[#374151]"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
