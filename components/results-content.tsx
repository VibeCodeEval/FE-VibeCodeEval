"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Download, Eye, X, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { getExams, getBoard, type Exam } from "@/lib/api/admin"
import {
  buildBoardParticipantsCsvBody,
  downloadUtf8Csv,
  sanitizeCsvFilenameSegment,
} from "@/lib/admin-board-csv-export"

interface ResultEntry {
  id: string
  entryCode: string
  total: number
  completed: number
}

interface Toast {
  id: string
  title: string
  description: string
}

export function ResultsContent() {
  const [results, setResults] = useState<ResultEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [downloadingExamId, setDownloadingExamId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const showToast = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const exams = await getExams()
      const mapped: ResultEntry[] = exams.map((exam: Exam) => ({
        id: String(exam.id),
        // BE ExamResponse에 entryCode가 없을 수 있음 — 목록 표시·상세 URL은 title과 동기화
        entryCode: exam.entryCode?.trim() || exam.title,
        total: exam.participantCount,
        completed: exam.completedCount,
      }))
      setResults(mapped)
    } catch (error) {
      console.error("Failed to fetch results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDownload = async (result: ResultEntry) => {
    const examId = Number.parseInt(result.id, 10)
    if (Number.isNaN(examId)) {
      showToast("다운로드 실패", "유효하지 않은 시험 ID입니다.")
      return
    }

    setDownloadingExamId(result.id)
    try {
      const board = await getBoard(examId)
      const csvBody = buildBoardParticipantsCsvBody(
        board.map((entry) => ({ entry, examLabel: result.entryCode })),
        { includeScores: true }
      )
      const filename = `results-${sanitizeCsvFilenameSegment(result.entryCode)}.csv`
      downloadUtf8Csv(filename, csvBody)
      showToast("다운로드 완료", `${result.entryCode} 세션 결과가 CSV로 저장되었습니다.`)
    } catch (error) {
      console.error(`[Results] CSV download failed for examId=${examId}`, error)
      showToast(
        "다운로드 실패",
        "참가자 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      )
    } finally {
      setDownloadingExamId(null)
    }
  }

  const filteredResults = results.filter((result) => result.entryCode.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalPages = Math.ceil(filteredResults.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = currentPage * pageSize
  const visibleResults = filteredResults.slice(startIndex, endIndex)

  // Display values (1-based for UI)
  const displayStart = filteredResults.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(endIndex, filteredResults.length)

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">평가 결과</h1>
          <p className="text-sm text-[#6B7280]">참가자 평가 결과를 조회하고 분석합니다.</p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden p-6">
        {/* Search Bar */}
        <div className="mb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="입장 코드를 검색하세요…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {/* Card List */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden">
          {visibleResults.map((result) => (
            <div
              key={result.id}
              className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-xl p-5 transition-all duration-200 hover:shadow-md"
              style={{
                borderRadius: "12px",
              }}
            >
              {/* Left Side - Result Info */}
              <div className="flex items-center gap-12">
                {/* Entry Code */}
                <div className="min-w-[200px]">
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      lineHeight: "24px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {result.entryCode}
                  </h3>
                </div>

                {/* Total Participants */}
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#9CA3AF",
                      lineHeight: "16px",
                    }}
                  >
                    총 인원
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      lineHeight: "20px",
                    }}
                  >
                    {result.total}명
                  </span>
                </div>

                {/* Completed Participants */}
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#9CA3AF",
                      lineHeight: "16px",
                    }}
                  >
                    완료 인원
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      lineHeight: "20px",
                    }}
                  >
                    {result.completed}명
                  </span>
                </div>

                {/* Completion Rate */}
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 400,
                      color: "#9CA3AF",
                      lineHeight: "16px",
                    }}
                  >
                    완료율
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      lineHeight: "20px",
                    }}
                  >
                    {result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownload(result)}
                  disabled={downloadingExamId === result.id}
                  className="flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {downloadingExamId === result.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  <span>{downloadingExamId === result.id ? "다운로드 중…" : "다운로드"}</span>
                </button>
                <Link
                  href={`/admin/results/${encodeURIComponent(result.entryCode)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  <Eye size={18} />
                  <span>상세 보기</span>
                </Link>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredResults.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p style={{ fontSize: "14px" }}>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredResults.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            {/* Left side: Showing X-Y of N */}
            <span className="text-sm text-[#6B7280]">
              총 {filteredResults.length}개의 결과 중 {displayStart}–{displayEnd} 표시
            </span>

            {/* Right side: Pagination controls */}
            <div className="flex items-center gap-1">
              {/* Prev button */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
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

              {/* Next button */}
              <button
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

      {/* Toast Notifications */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex w-[360px] items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
              <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A]">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
