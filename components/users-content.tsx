"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  getBoard,
  getExams,
  type Exam,
  type ExamineeBoardEntry,
} from "@/lib/api/admin"
import {
  isAdminUsersSubmissionCountedComplete,
  resolveAdminUsersConnectionStatus,
  resolveAdminUsersSubmissionStatus,
  type AdminUsersConnectionStatus,
  type AdminUsersSubmissionStatus,
} from "@/lib/admin-users-participant-status"

interface Participant {
  id: string
  name: string
  examLabel: string
  phone: string
  connectionStatus: AdminUsersConnectionStatus
  submissionStatus: AdminUsersSubmissionStatus
  tokenUsage: number
}

function resolveExamDisplayLabel(exam: Exam): string {
  const code = exam.entryCode?.trim()
  if (code) return code
  return exam.title?.trim() || String(exam.id)
}

function mapBoardEntry(entry: ExamineeBoardEntry, exam: Exam): Participant {
  const connectionStatus = resolveAdminUsersConnectionStatus(entry, exam)
  return {
    id: `${exam.id}-${entry.examParticipantId}`,
    name: entry.name || "–",
    examLabel: resolveExamDisplayLabel(exam),
    phone: entry.phoneMasked || "–",
    connectionStatus,
    submissionStatus: resolveAdminUsersSubmissionStatus(entry, exam, connectionStatus),
    tokenUsage: entry.tokenUsed ?? 0,
  }
}

function ConnectionBadge({ status }: { status: AdminUsersConnectionStatus }) {
  const styles: Record<AdminUsersConnectionStatus, string> = {
    "응시 완료": "border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]",
    "응시 중": "border-[#3B82F6] bg-white text-[#3B82F6]",
    "대기 중": "border-[#6B7280] bg-white text-[#6B7280]",
    "종료됨": "border-[#9CA3AF] bg-[#F3F4F6] text-[#6B7280]",
  }
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

function SubmissionBadge({ status }: { status: AdminUsersSubmissionStatus }) {
  const styles: Record<AdminUsersSubmissionStatus, string> = {
    "시작 전": "bg-[#F3F4F6] text-[#6B7280]",
    "진행 중": "bg-[#E0EDFF] text-[#3B82F6]",
    "채점 중": "bg-[#FEF3C7] text-[#D97706]",
    "제출 완료": "bg-[#DCFCE7] text-[#16A34A]",
    "채점 완료": "bg-[#DCFCE7] text-[#16A34A]",
    "미제출": "bg-[#F3F4F6] text-[#6B7280]",
    "제출 실패": "bg-[#FEE2E2] text-[#DC2626]",
  }

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>
}

export function UsersContent() {
  const [exams, setExams] = useState<Exam[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [isLoadingBoard, setIsLoadingBoard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedExamId, setSelectedExamId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    let cancelled = false
    async function loadExams() {
      setIsLoadingExams(true)
      try {
        const data = await getExams()
        if (!cancelled) setExams(data)
      } catch (e) {
        console.error("[Users] Failed to load exams", e)
        if (!cancelled) {
          setExams([])
          setError("시험 세션 목록을 불러오는 데 실패했습니다.")
        }
      } finally {
        if (!cancelled) setIsLoadingExams(false)
      }
    }
    loadExams()
    return () => {
      cancelled = true
    }
  }, [])

  const loadParticipants = useCallback(async () => {
    if (isLoadingExams) return

    setIsLoadingBoard(true)
    setError(null)
    try {
      if (exams.length === 0) {
        setParticipants([])
        setCurrentPage(1)
        return
      }

      let mapped: Participant[] = []

      if (selectedExamId === "all") {
        const boards = await Promise.all(
          exams.map(async (exam) => {
            try {
              const entries = await getBoard(exam.id)
              return entries.map((entry) => mapBoardEntry(entry, exam))
            } catch (e) {
              console.error(`[Users] getBoard failed for examId=${exam.id}`, e)
              return [] as Participant[]
            }
          })
        )
        mapped = boards.flat()
      } else {
        const examId = Number.parseInt(selectedExamId, 10)
        const exam = exams.find((e) => e.id === examId)
        if (!exam || Number.isNaN(examId)) {
          setParticipants([])
          setCurrentPage(1)
          return
        }
        const board = await getBoard(examId)
        mapped = board.map((entry) => mapBoardEntry(entry, exam))
      }

      setParticipants(mapped)
      setCurrentPage(1)
    } catch (e) {
      console.error("[Users] Failed to load participants", e)
      setParticipants([])
      setError("참가자 목록을 불러오는 데 실패했습니다.")
    } finally {
      setIsLoadingBoard(false)
    }
  }, [exams, isLoadingExams, selectedExamId])

  useEffect(() => {
    void loadParticipants()
  }, [loadParticipants])

  const filteredParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return participants
    return participants.filter((p) => {
      const name = p.name.toLowerCase()
      const exam = p.examLabel.toLowerCase()
      return name.includes(q) || exam.includes(q)
    })
  }, [participants, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = currentPage * pageSize
  const visibleParticipants = filteredParticipants.slice(startIndex, endIndex)

  const displayStart = filteredParticipants.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(endIndex, filteredParticipants.length)

  const completedCount = useMemo(
    () =>
      filteredParticipants.filter((p) =>
        isAdminUsersSubmissionCountedComplete(p.submissionStatus)
      ).length,
    [filteredParticipants]
  )

  const isLoading = isLoadingExams || isLoadingBoard

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedExamId])

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">참가자 목록</h1>
          <p className="text-sm text-[#6B7280]">
            모든 시험 세션의 참가자를 조회하고 제출 상태를 확인합니다.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={isLoadingExams}
              className="appearance-none rounded-lg border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
            >
              <option value="all">모든 세션</option>
              {exams.map((exam) => (
                <option key={exam.id} value={String(exam.id)}>
                  {resolveExamDisplayLabel(exam)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          </div>

          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="이름 또는 시험으로 검색…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white py-2 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          <div className="grid shrink-0 grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">이름</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">시험</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">전화번호</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              응시 상태
            </span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              제출 상태
            </span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              토큰 사용량
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-[#6B7280]">불러오는 중...</p>
              </div>
            ) : visibleParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <p className="text-sm text-[#6B7280]">표시할 참가자가 없습니다.</p>
                {!error && filteredParticipants.length === 0 && participants.length > 0 && (
                  <p className="text-xs text-[#9CA3AF]">검색 조건에 맞는 참가자가 없습니다.</p>
                )}
                {!error && participants.length === 0 && (
                  <p className="text-xs text-[#9CA3AF]">선택한 세션에 참가자가 없습니다.</p>
                )}
              </div>
            ) : (
              visibleParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`grid grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 ${
                    index !== visibleParticipants.length - 1 ? "border-b border-[#E5E5E5]" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[#1A1A1A]">{participant.name}</span>
                  <span className="text-sm font-medium text-[#374151]">{participant.examLabel}</span>
                  <span className="text-sm text-[#6B7280]">{participant.phone}</span>
                  <div className="flex justify-center">
                    <ConnectionBadge status={participant.connectionStatus} />
                  </div>
                  <div className="flex justify-center">
                    <SubmissionBadge status={participant.submissionStatus} />
                  </div>
                  <span className="text-right text-sm font-medium text-[#1A1A1A]">
                    {participant.tokenUsage.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {!isLoading && filteredParticipants.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-sm text-[#6B7280]">
              총 {filteredParticipants.length}명 중 {displayStart}–{displayEnd}명 표시
              {completedCount > 0 && ` · 제출 완료 ${completedCount}명`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                    page === currentPage
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#E0EDFF]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
