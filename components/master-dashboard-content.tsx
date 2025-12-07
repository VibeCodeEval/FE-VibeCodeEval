"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, CheckCircle2, CalendarClock, FileCode, ScrollText, ArrowRight } from "lucide-react"
import Link from "next/link";

const recentSessions = [
  { id: 1, sessionId: "SESSION-2025-001", status: "Active", createdAt: "Jan 14, 2025", participants: 18 },
  { id: 2, sessionId: "SESSION-2025-002", status: "Completed", createdAt: "Jan 13, 2025", participants: 25 },
  { id: 3, sessionId: "SESSION-2025-003", status: "Active", createdAt: "Jan 12, 2025", participants: 12 },
  { id: 4, sessionId: "SESSION-2025-004", status: "Completed", createdAt: "Jan 11, 2025", participants: 30 },
]

const recentLogs = [
  { id: 1, timestamp: "10:33 AM", type: "Admin", description: "Admin 'john.smith' updated platform settings" },
  { id: 2, timestamp: "09:15 AM", type: "System", description: "Scheduled maintenance completed successfully" },
  { id: 3, timestamp: "08:45 AM", type: "Error", description: "Failed to connect to evaluation service (retried)" },
]

type DashboardContentProps = {
  onNavigate: (page: string) => void
}

export function MasterDashboardContent({ onNavigate }: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em" }}>
          Master Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Overview of platform activity and coding test operations.</p>
      </div>

      {/* Section 1: KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Sessions */}
        <Card style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#1A1A1A" }}>12</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>Active Sessions</span>
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#EFF6FF",
                  borderRadius: "12px",
                }}
              >
                <Users size={24} style={{ color: "#3B82F6" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants Today */}
        <Card style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#1A1A1A" }}>148</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>Participants Today</span>
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#F0FDF4",
                  borderRadius: "12px",
                }}
              >
                <UserCheck size={24} style={{ color: "#22C55E" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: "18px", fontWeight: 600, color: "#22C55E" }}>Operational</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>System Status</span>
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#F0FDF4",
                  borderRadius: "12px",
                }}
              >
                <CheckCircle2 size={24} style={{ color: "#22C55E" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Two-column summary section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Recent Sessions */}
        <Card
          className="h-full flex flex-col"
          style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardHeader className="pb-3">
            <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col flex-1">
            <div className="flex flex-col gap-3 flex-1 mb-5">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3"
                  style={{
                    backgroundColor: "#FAFAFA",
                    borderRadius: "8px",
                    border: "1px solid #F0F0F0",
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A1A" }}>{session.sessionId}</span>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {session.createdAt} · {session.participants} participants
                    </span>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: session.status === "Active" ? "#DCFCE7" : "#F3F4F6",
                      color: session.status === "Active" ? "#22C55E" : "#6B7280",
                      fontWeight: 500,
                      fontSize: "12px",
                      border: "none",
                    }}
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-3" style={{ borderTop: "1px solid #E5E5E5" }}>
              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2"
                style={{ color: "#3B82F6", fontSize: "14px", fontWeight: 500 }}
              >
                <Link href="/master/test-sessions">
                  View All Sessions
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recent Logs */}
        <Card
          className="h-full flex flex-col"
          style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <CardHeader className="pb-3">
            <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col flex-1">
            <div className="flex flex-col gap-3 flex-1 mb-5">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3"
                  style={{
                    backgroundColor: "#FAFAFA",
                    borderRadius: "8px",
                    border: "1px solid #F0F0F0",
                  }}
                >
                  <div
                    className="mt-0.5"
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: log.type === "Admin" ? "#3B82F6" : log.type === "System" ? "#6B7280" : "#EF4444",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{log.timestamp}</span>
                      <Badge
                        style={{
                          backgroundColor:
                            log.type === "Admin" ? "#DBEAFE" : log.type === "System" ? "#F3F4F6" : "#FEE2E2",
                          color: log.type === "Admin" ? "#3B82F6" : log.type === "System" ? "#6B7280" : "#EF4444",
                          fontWeight: 500,
                          fontSize: "10px",
                          padding: "2px 6px",
                          border: "none",
                        }}
                      >
                        {log.type}
                      </Badge>
                    </div>
                    <span style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.4" }} className="truncate">
                      {log.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-3" style={{ borderTop: "1px solid #E5E5E5" }}>
              <Button
                asChild
                variant="ghost"
                className="w-full flex items-center justify-center gap-2"
                style={{ color: "#3B82F6", fontSize: "14px", fontWeight: 500 }}
              >
                <Link href="/master/platform-logs">
                  View All Logs
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Quick Access */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "16px" }}>Quick Access</h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Manage Test Sessions */}
          <Link href="/master/test-sessions" className="block">
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              style={{
                borderRadius: "12px",
                border: "1px solid #E5E5E5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#EFF6FF",
                      borderRadius: "12px",
                    }}
                  >
                    <CalendarClock size={24} style={{ color: "#3B82F6" }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>Manage Test Sessions</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>View and manage all coding test sessions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Manage Problems */}
          <Link href="/master/problem" className="block">
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              style={{
                borderRadius: "12px",
                border: "1px solid #E5E5E5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#F3E8FF",
                      borderRadius: "12px",
                    }}
                  >
                    <FileCode size={24} style={{ color: "#7C3AED" }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>Manage Problems</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>Browse and manage coding problems</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Open Platform Logs */}
          <Link href="/master/platform-logs" className="block">
            <Card
              className="cursor-pointer transition-all hover:shadow-md"
              style={{
                borderRadius: "12px",
                border: "1px solid #E5E5E5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "#F3F4F6",
                      borderRadius: "12px",
                    }}
                  >
                    <ScrollText size={24} style={{ color: "#6B7280" }} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>Open Platform Logs</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>View system activity and audit logs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
