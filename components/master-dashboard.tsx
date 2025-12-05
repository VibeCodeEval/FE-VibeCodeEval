"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopNavBar } from "@/components/top-nav-bar"
import { DashboardContent } from "@/components/dashboard-content"
import { AdminAccountsContent } from "@/components/admin-accounts-content"
import { TestSessionsContent } from "@/components/test-sessions-content"
import { TestSessionDetailsContent } from "@/components/test-session-details-content"
import { GlobalSettingsContent } from "@/components/global-settings-content"
import { ProblemContent } from "@/components/problem-content"
import { PlatformLogsContent } from "@/components/platform-logs-content"

type TestSession = {
  id: number
  sessionId: string
  createdBy: string
  createdAt: string
  status: string
  participants: number
}

export function MasterDashboard() {
  const [activeItem, setActiveItem] = useState("Dashboard")
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)

  const handleViewSessionDetails = (session: TestSession) => {
    setSelectedSession(session)
  }

  const handleBackToSessions = () => {
    setSelectedSession(null)
  }

  const handleSidebarItemClick = (item: string) => {
    setActiveItem(item)
    setSelectedSession(null)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ maxWidth: "1920px" }}>
      <div className="fixed left-0 top-0 h-screen z-30" style={{ width: "240px" }}>
        <Sidebar activeItem={activeItem} onItemClick={handleSidebarItemClick} />
      </div>

      <div className="flex-1 flex flex-col h-screen ml-[240px]" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="fixed top-0 z-20" style={{ left: "240px", right: "0", maxWidth: "calc(1920px - 240px)" }}>
          <TopNavBar />
        </div>

        <main className="flex-1 mt-[80px] overflow-y-auto">
          {activeItem === "Dashboard" && <DashboardContent onNavigate={handleSidebarItemClick} />}
          {activeItem === "Admin Accounts" && <AdminAccountsContent />}
          {activeItem === "Test Sessions" && !selectedSession && (
            <TestSessionsContent onViewDetails={handleViewSessionDetails} />
          )}
          {activeItem === "Test Sessions" && selectedSession && (
            <TestSessionDetailsContent session={selectedSession} onBack={handleBackToSessions} />
          )}
          {activeItem === "Global Settings" && <GlobalSettingsContent />}
          {activeItem === "Problem" && <ProblemContent />}
          {activeItem === "Platform Logs" && <PlatformLogsContent />}
        </main>
      </div>
    </div>
  )
}
