"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { getExams, getBoard, ExamineeBoardEntry, type Exam } from "@/lib/api/admin"
import { adminParticipantEvaluationHref } from "@/lib/paths/admin-participant-evaluation"

type TrendLevel = "High" | "Average" | "Low"

interface ParticipantDetail {
  id: string
  name: string
  tokenUsed: number
  tokenLimit: number
  submitted: boolean
  trend: TrendLevel
}

interface ParticipantListContentProps {
  entryCode: string
}

/**
 * /admin/results/[segment] 세그먼트로 시험을 찾습니다.
 * - API entryCode와 일치(있을 때)
 * - 시험 제목과 일치(평가 결과 목록이 title을 URL에 넣는 기존 동작)
 * - 전부 숫자면 exam.id (직접 링크용)
 */
function findExamByResultsSegment(exams: Exam[], segment: string) {
  const trimmed = segment.trim()
  if (!trimmed) return undefined

  const byEntryCode = exams.find(
    (e) => e.entryCode != null && String(e.entryCode).length > 0 && e.entryCode === trimmed
  )
  if (byEntryCode) return byEntryCode

  const byTitle = exams.find((e) => e.title === trimmed)
  if (byTitle) return byTitle

  if (/^\d+$/.test(trimmed)) {
    return exams.find((e) => String(e.id) === trimmed)
  }

  return undefined
}

function TrendBadge({ trend }: { trend: TrendLevel }) {
  const styles = {
    High: "bg-[#DCFCE7] text-[#16A34A]",
    Average: "bg-[#FEF3C7] text-[#D97706]",
    Low: "bg-[#FEE2E2] text-[#DC2626]",
  }
  const trendText: Record<TrendLevel, string> = {
    High: "완료",
    Average: "진행 중",
    Low: "미시작",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[trend]}`}>{trendText[trend]}</span>
}

function getTrend(entry: ExamineeBoardEntry): TrendLevel {
  if (entry.submitted) return "High"
  if (entry.state === "ENTRANCE") return "Average"
  return "Low"
}

export function ParticipantListContent({ entryCode }: ParticipantListContentProps) {
  const [examId, setExamId] = useState<number | null>(null)
  const [examTitle, setExamTitle] = useState<string>("")
  const [participants, setParticipants] = useState<ParticipantDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageSize = 10
  const [page, setPage] = useState(1)

  // entryCode → examId 변환 후 board 조회
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        // 1) 시험 목록에서 entryCode에 매핑된 examId 찾기
        const exams = await getExams()
        const matched = findExamByResultsSegment(exams, entryCode)
        if (!matched) {
          // entryCode로 직접 매핑이 안 될 때 — 첫 번째 시험 또는 에러
          setError("해당 입장 코드에 대한 시험을 찾을 수 없습니다.")
          setIsLoading(false)
          return
        }

        setExamId(matched.id)
        setExamTitle(matched.title)

        // 2) board 조회
        const board = await getBoard(matched.id)
        const mapped: ParticipantDetail[] = board.map((p) => ({
          id: p.examParticipantId.toString(),
          name: p.name,
          tokenUsed: p.tokenUsed,
          tokenLimit: p.tokenLimit,
          submitted: p.submitted,
          trend: getTrend(p),
        }))
        setParticipants(mapped)
        setPage(1)
      } catch (e) {
        console.error("Failed to load participant list", e)
        setError("참가자 목록을 불러오는 데 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [entryCode])

  const totalParticipants = participants.length
  const totalPages = Math.max(1, Math.ceil(totalParticipants / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageParticipants = participants.slice(startIndex, endIndex)
  const completedCount = useMemo(() => participants.filter((p) => p.submitted).length, [participants])

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1))
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">참가자 목록</h1>
          <p className="text-sm text-[#6B7280]">해당 입장 코드의 참가자 현황을 확인합니다.</p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Back Link */}
        <div className="mb-4 shrink-0">
          <Link
            href="/admin/results"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-app-accent-soft-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            평가 결과로 돌아가기
          </Link>
        </div>

        {/* Summary Card */}
        <div className="mb-6 shrink-0 rounded-xl border border-[#E5E5E5] bg-white px-12 py-6 shadow-sm">
          <div className="flex items-center gap-16">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">입장 코드</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{entryCode}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">시험명</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{examTitle || "–"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">총 참가자 수</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">
                {isLoading ? "..." : totalParticipants}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">완료 인원</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">
                {isLoading ? "..." : completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Participant Table Container */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid shrink-0 grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-12 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">참가자</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">토큰 사용량</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">제출 상태</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">상세 보기</span>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto px-12">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-[#6B7280]">불러오는 중...</p>
              </div>
            ) : pageParticipants.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-[#6B7280]">참가자가 없습니다.</p>
              </div>
            ) : (
              pageParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 py-4 ${
                    index !== pageParticipants.length - 1 ? "border-b border-[#E5E5E5]" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[#1A1A1A]">{participant.name}</span>
                  <span className="text-center text-sm font-medium text-[#1A1A1A]">
                    {participant.tokenUsed.toLocaleString()}
                    {participant.tokenLimit > 0 && (
                      <span className="ml-1 text-xs text-[#9CA3AF]">/ {participant.tokenLimit.toLocaleString()}</span>
                    )}
                  </span>
                  <div className="flex justify-center">
                    <TrendBadge trend={participant.trend} />
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={adminParticipantEvaluationHref({
                        resultsSegment: entryCode,
                        participantId: participant.id,
                        from: "results",
                        participantName: participant.name,
                      })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-app-ring/40 bg-white px-3 py-1.5 text-sm text-app-accent-soft-foreground hover:bg-app-accent-soft"
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                      상세 보기
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-[#E5E5E5] bg-white px-12 py-3">
            <p className="text-sm text-[#6B7280]">
              총 {totalParticipants}명 중{" "}
              {totalParticipants > 0 ? `${startIndex + 1}–${Math.min(endIndex, totalParticipants)}` : "0"}명 표시
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === 1
                    ? "border-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed"
                    : "border-[#E5E5E5] text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                이전
              </button>
              <span className="px-2 text-sm text-[#6B7280]">
                {page} / {totalPages} 페이지
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === totalPages
                    ? "border-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed"
                    : "border-[#E5E5E5] text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                다음
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
