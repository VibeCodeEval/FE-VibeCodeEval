"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, CheckCircle2, CalendarClock, FileCode, ScrollText, ArrowRight, KeyRound, Copy, Check } from "lucide-react"
import Link from "next/link";
import { issueAdminNumber, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const recentSessions = [
  { id: 1, sessionId: "SESSION-2025-001", status: "진행 중", createdAt: "2025년 1월 14일", participants: 18 },
  { id: 2, sessionId: "SESSION-2025-002", status: "완료", createdAt: "2025년 1월 13일", participants: 25 },
  { id: 3, sessionId: "SESSION-2025-003", status: "진행 중", createdAt: "2025년 1월 12일", participants: 12 },
  { id: 4, sessionId: "SESSION-2025-004", status: "완료", createdAt: "2025년 1월 11일", participants: 30 },
]

const recentLogs = [
  { id: 1, timestamp: "오전 10:33", type: "관리자", description: "관리자 'john.smith'가 플랫폼 설정을 업데이트했습니다" },
  { id: 2, timestamp: "오전 09:15", type: "시스템", description: "예정된 유지보수가 성공적으로 완료되었습니다" },
  { id: 3, timestamp: "오전 08:45", type: "오류", description: "평가 서비스 연결 실패 (재시도됨)" },
]

type DashboardContentProps = {
  onNavigate: (page: string) => void
}

export function MasterDashboardContent({ onNavigate }: DashboardContentProps) {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [issuedAdminNumber, setIssuedAdminNumber] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleIssueAdminNumber = async () => {
    setIsLoading(true)
    try {
      const response = await issueAdminNumber({
        label: label.trim() || undefined,
        expiresAt: expiresAt || undefined,
      })

      setIssuedAdminNumber(response.adminNumber)
      setLabel("")
      setExpiresAt("")
      toast({
        title: "관리자 번호 발급 성공",
        description: "관리자 번호가 성공적으로 발급되었습니다.",
      })
    } catch (error) {
      if (error instanceof LoginFailedError) {
        toast({
          title: "발급 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "오류",
          description: "관리자 번호 발급 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyAdminNumber = async () => {
    if (issuedAdminNumber) {
      await navigator.clipboard.writeText(issuedAdminNumber)
      setCopied(true)
      toast({
        description: "관리자 번호가 클립보드에 복사되었습니다.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCloseModal = () => {
    setIsIssueModalOpen(false)
    setIssuedAdminNumber(null)
    setLabel("")
    setExpiresAt("")
    setCopied(false)
  }

  return (
    <div className="flex flex-col gap-6 p-6" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em" }}>
          마스터 대시보드
        </h1>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>플랫폼 활동 및 코딩 테스트 운영 개요.</p>
      </div>

      {/* Section 1: KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Sessions */}
        <Card style={{ borderRadius: "12px", border: "1px solid #E5E5E5", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#1A1A1A" }}>12</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>진행 중인 세션</span>
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
                <span style={{ fontSize: "14px", color: "#6B7280" }}>오늘의 참가자</span>
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
                <span style={{ fontSize: "32px", fontWeight: 700, color: "#22C55E" }}>운영 중</span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>시스템 상태</span>
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
            <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>최근 세션</CardTitle>
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
                      {session.createdAt} · 참가자 {session.participants}명
                    </span>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: session.status === "진행 중" ? "#DCFCE7" : "#F3F4F6",
                      color: session.status === "진행 중" ? "#22C55E" : "#6B7280",
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
                  모든 세션 보기
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
            <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>최근 로그</CardTitle>
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
                      backgroundColor: log.type === "관리자" ? "#3B82F6" : log.type === "시스템" ? "#6B7280" : "#EF4444",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{log.timestamp}</span>
                      <Badge
                        style={{
                          backgroundColor:
                            log.type === "관리자" ? "#DBEAFE" : log.type === "시스템" ? "#F3F4F6" : "#FEE2E2",
                          color: log.type === "관리자" ? "#3B82F6" : log.type === "시스템" ? "#6B7280" : "#EF4444",
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
                  모든 로그 보기
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Quick Access */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "16px" }}>빠른 접근</h2>
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
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>테스트 세션 관리</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>모든 코딩 테스트 세션 보기 및 관리</span>
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
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>문제 관리</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>코딩 문제 탐색 및 관리</span>
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
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>플랫폼 로그 열기</span>
                    <span style={{ fontSize: "13px", color: "#6B7280" }}>시스템 활동 및 감사 로그 보기</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Issue Admin Number */}
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setIsIssueModalOpen(true)}
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
                    backgroundColor: "#FEF3C7",
                    borderRadius: "12px",
                  }}
                >
                  <KeyRound size={24} style={{ color: "#92400E" }} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "#1A1A1A" }}>관리자 번호 발급</span>
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>새 관리자 계정 생성을 위한 번호 발급</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 관리자 번호 발급 모달 */}
      <Dialog open={isIssueModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              {issuedAdminNumber ? "관리자 번호 발급 완료" : "관리자 번호 발급"}
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              {issuedAdminNumber
                ? "발급된 관리자 번호를 안전하게 보관하세요. 이 번호는 한 번만 표시됩니다."
                : "새 관리자 계정 생성을 위한 관리자 번호를 발급합니다."}
            </DialogDescription>
          </DialogHeader>
          {issuedAdminNumber ? (
            <div className="py-4">
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1A1A1A",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                발급된 관리자 번호
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={issuedAdminNumber}
                  className="flex-1 bg-[#F9FAFB] font-mono text-[#1A1A1A]"
                  style={{ fontSize: "14px" }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAdminNumber}
                  className="h-10 w-10 shrink-0 bg-transparent"
                  style={{
                    borderColor: "#E5E5E5",
                  }}
                >
                  {copied ? <Check className="h-4 w-4 text-[#16A34A]" /> : <Copy className="h-4 w-4 text-[#6B7280]" />}
                </Button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  marginTop: "8px",
                }}
              >
                이 번호를 새 관리자에게 안전하게 전달하세요.
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">라벨 (선택사항)</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="관리자 번호에 대한 설명을 입력하세요"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">만료일 (선택사항)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {issuedAdminNumber ? "닫기" : "취소"}
            </Button>
            {!issuedAdminNumber && (
              <Button
                onClick={handleIssueAdminNumber}
                disabled={isLoading}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? "발급 중..." : "관리자 번호 발급"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
