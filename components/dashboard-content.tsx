"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, CheckCircle, Play, Plus, BarChart3, ArrowRight } from "lucide-react"
import { getExams, getBoard } from "@/lib/api/admin"

// Sample recent activity data (정적 - 활동 로그 API 미지원)
const recentActivity = [
  {
    id: 1,
    timestamp: "2024-01-15 14:32",
    status: "채점 과정이 성공적으로 완료되었습니다.",
    message: "참가자 김민준님의 채점이 완료되었습니다",
  },
  { id: 2, timestamp: "2024-01-15 14:15", status: "시험 세션이 시작되었습니다.", message: "시험 세션 AIV-2024-001이 시작되었습니다" },
  {
    id: 3,
    timestamp: "2024-01-15 13:45",
    status: "시험 방 생성됨",
    message: "새 입장 코드 AIV-2024-005가 생성되었습니다",
  },
  {
    id: 4,
    timestamp: "2024-01-15 12:30",
    status: "채점 과정이 성공적으로 완료되었습니다.",
    message: "참가자 박지연님의 채점이 완료되었습니다",
  },
  { id: 5, timestamp: "2024-01-15 11:20", status: "시험 세션이 시작되었습니다.", message: "시험 세션 AIV-2024-002가 시작되었습니다" },
]

function getStatusColor(status: string) {
  switch (status) {
    case "시험 세션이 시작되었습니다.":
      return "bg-purple-500"
    case "채점 과정이 성공적으로 완료되었습니다.":
      return "bg-green-500"
    case "시험 방 생성됨":
      return "bg-blue-500"
    case "시험 세션이 종료되었습니다.":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function DashboardContent() {
  const [totalParticipants, setTotalParticipants] = useState<number | null>(null)
  const [completedCount, setCompletedCount] = useState<number | null>(null)
  const [runningExams, setRunningExams] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const exams = await getExams()
        const running = exams.filter(
          (e) => e.state === "RUNNING" || e.state === "IN_PROGRESS"
        ).length
        setRunningExams(running)

        // 각 시험의 보드를 병렬로 조회해 참가자 수 집계
        const boards = await Promise.all(
          exams.map((e) => getBoard(e.id).catch(() => []))
        )
        const allParticipants = boards.flat()
        setTotalParticipants(allParticipants.length)
        setCompletedCount(allParticipants.filter((p) => p.submitted).length)
      } catch (e) {
        console.error("Failed to load dashboard stats", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const displayValue = (val: number | null) =>
    isLoading ? "..." : val !== null ? val.toLocaleString() : "–"

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Section 2: Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">관리자 대시보드</h1>
      </header>

      {/* Section 3: Main Content Panel */}
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* 1) Metric Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Participants */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">총 참가자 수</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">{displayValue(totalParticipants)}</p>
            <p className="mt-1 text-xs text-gray-400">전체 시험 기준</p>
          </div>

          {/* Completed Evaluations */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">평가 완료 수</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">{displayValue(completedCount)}</p>
            <p className="mt-1 text-xs text-gray-400">
              {!isLoading && totalParticipants !== null && totalParticipants > 0
                ? `완료율 ${Math.round(((completedCount ?? 0) / totalParticipants) * 100)}%`
                : "코드 제출 기준"}
            </p>
          </div>

          {/* Average Prompt Score - no API available */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <span className="text-sm font-medium text-gray-500">평균 프롬프트 점수</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">–</p>
            <p className="mt-1 text-xs text-gray-400">채점 완료 후 집계</p>
          </div>

          {/* Active Test Sessions */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Play className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">진행 중인 테스트 세션</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">{displayValue(runningExams)}</p>
            <p className="mt-1 text-xs text-gray-400">현재 진행 중</p>
          </div>
        </div>

        {/* 2) Recent Activity */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">최근 활동</h2>
              <p className="text-sm text-gray-400">시스템 이벤트 및 활동 내역</p>
            </div>
            <Link
              href="/admin/logs"
              className="flex items-center gap-1 text-[13px] font-normal text-blue-600 transition-all hover:text-blue-700 hover:underline"
            >
              모두 보기 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6">
            {recentActivity.length > 0 ? (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gray-200" />

                <div className="space-y-5">
                  {recentActivity.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 pl-6 relative">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${getStatusColor(event.status)}`} />

                      {/* Content */}
                      <div className="flex flex-1 items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">{event.status}</span>
                          <span className="text-sm text-gray-500">{event.message}</span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{event.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">최근 활동이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 3) Quick Actions */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm -mt-3">
          <h2 className="text-lg font-semibold text-gray-700">빠른 작업</h2>
          <p className="text-sm text-gray-400">자주 사용하는 관리자 기능</p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/admin/entry-codes"
              className="flex items-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              <Plus className="h-4 w-4" />
              입장 코드 생성
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              참가자 목록 보기
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              분석 화면 열기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
