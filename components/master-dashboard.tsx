"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MasterDashboardContent } from "@/components/master-dashboard-content"
import { AdminAccountsContent } from "@/components/admin-accounts-content"
import { TestSessionsContent } from "@/components/test-sessions-content"
import TestSessionDetailsContent from "@/components/test-session-details-content"
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

      <div className="ml-[240px] flex h-screen flex-1 flex-col" style={{ backgroundColor: "#F9FAFB" }}>
        <main className="flex-1 overflow-y-auto">
          {activeItem === "Dashboard" && <MasterDashboardContent />}
          {activeItem === "Admin Accounts" && <AdminAccountsContent />}
          {activeItem === "Test Sessions" && !selectedSession && (
            <TestSessionsContent onViewDetails={handleViewSessionDetails} />
          )}
          {activeItem === "Test Sessions" && selectedSession && (
            <TestSessionDetailsContent examId={selectedSession.id} onBack={handleBackToSessions} />
          )}
          {activeItem === "Global Settings" && <GlobalSettingsContent />}
          {activeItem === "Problem" && <ProblemContent />}
          {activeItem === "Platform Logs" && <PlatformLogsContent />}
        </main>
      </div>
    </div>
  )
}
