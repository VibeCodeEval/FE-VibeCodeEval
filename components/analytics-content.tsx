"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Download, ChevronDown, X, CheckCircle } from "lucide-react"
import {
  getExams,
  getBoard,
  formatBoardSubmissionLabelKo,
  type Exam,
  type ExamineeBoardEntry,
} from "@/lib/api/admin"
import {
  computeParticipantLetterGrade,
  computeSessionAnalytics,
  isExamineeBoardSubmitted,
} from "@/lib/admin-board-analytics"
import {
  buildBoardParticipantsCsvBody,
  downloadUtf8Csv,
} from "@/lib/admin-board-csv-export"
import { adminParticipantEvaluationHref } from "@/lib/paths/admin-participant-evaluation"

interface BoardRow {
  entry: ExamineeBoardEntry
  examId: number
  examTitle: string
  examResultsSegment: string
}

interface Toast {
  id: string
  title: string
  description: string
}

function MetricCard({
  label,
  value,
  suffix,
  isLoading,
}: {
  label: string
  value: string
  suffix?: string
  isLoading?: boolean
}) {
  const display = isLoading ? "–" : value
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1A1A1A]">
        {display}
        {suffix && !isLoading && (
          <span className="ml-1 text-base font-normal text-[#6B7280]">{suffix}</span>
        )}
      </p>
    </div>
  )
}

function ParticipantCard({ row }: { row: BoardRow }) {
  const { entry, examTitle, examResultsSegment } = row
  const grade = computeParticipantLetterGrade(entry)
  const statusLabel = formatBoardSubmissionLabelKo(entry)

  const gradeColor =
    grade === "A"
      ? "text-[#16A34A]"
      : grade === "B"
        ? "text-[#2563EB]"
        : grade === "C"
          ? "text-[#D97706]"
          : grade === "D"
            ? "text-[#EA580C]"
            : grade === "F"
              ? "text-[#DC2626]"
              : "text-[#9CA3AF]"

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#1A1A1A]">{entry.name || "–"}</h3>
          <p className="mt-0.5 text-sm text-[#9CA3AF]">{examTitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-center px-2">
          <span className={`text-5xl font-bold leading-none tracking-tight ${gradeColor}`}>
            {grade}
          </span>
          <span className="mt-1 text-xs font-medium text-[#9CA3AF]">등급</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-[#6B7280]">제출 상태</p>
        <p className="mt-0.5 text-base font-medium text-[#1A1A1A]">{statusLabel}</p>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={adminParticipantEvaluationHref({
            resultsSegment: examResultsSegment,
            participantId: String(entry.examParticipantId),
            from: "analytics",
            participantName: entry.name,
          })}
          className="text-sm font-medium text-app-accent-soft-foreground transition-colors hover:text-foreground"
        >
          상세 보기 →
        </Link>
      </div>
    </div>
  )
}

async function loadBoardRowsForExams(exams: Exam[]): Promise<BoardRow[]> {
  const boards = await Promise.all(
    exams.map(async (exam) => {
      try {
        const entries = await getBoard(exam.id)
        return entries.map((entry) => ({
          entry,
          examId: exam.id,
          examTitle: exam.title,
          examResultsSegment: String(exam.id),
        }))
      } catch (e) {
        console.error(`[Analytics] getBoard failed for examId=${exam.id}`, e)
        return [] as BoardRow[]
      }
    })
  )
  return boards.flat()
}

export function AnalyticsContent() {
  const [exams, setExams] = useState<Exam[]>([])
  const [boardRows, setBoardRows] = useState<BoardRow[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [isLoadingBoard, setIsLoadingBoard] = useState(false)
  const [boardLoadError, setBoardLoadError] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string>("all")
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    let cancelled = false
    async function loadExams() {
      try {
        const data = await getExams()
        if (!cancelled) setExams(data)
      } catch (e) {
        console.error("[Analytics] Failed to load exams", e)
        if (!cancelled) setExams([])
      } finally {
        if (!cancelled) setIsLoadingExams(false)
      }
    }
    loadExams()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isLoadingExams) return

    let cancelled = false

    async function loadBoard() {
      setIsLoadingBoard(true)
      setBoardLoadError(false)
      try {
        if (selectedExamId === "all") {
          if (exams.length === 0) {
            if (!cancelled) setBoardRows([])
            return
          }
          const rows = await loadBoardRowsForExams(exams)
          if (!cancelled) setBoardRows(rows)
          return
        }

        const examId = Number.parseInt(selectedExamId, 10)
        if (Number.isNaN(examId)) {
          if (!cancelled) setBoardRows([])
          return
        }

        const exam = exams.find((e) => e.id === examId)
        const board = await getBoard(examId)
        if (!cancelled) {
          setBoardRows(
            board.map((entry) => ({
              entry,
              examId,
              examTitle: exam?.title ?? String(examId),
              examResultsSegment: String(examId),
            }))
          )
        }
      } catch (e) {
        console.error("[Analytics] Failed to load board", e)
        if (!cancelled) {
          setBoardRows([])
          setBoardLoadError(true)
        }
      } finally {
        if (!cancelled) setIsLoadingBoard(false)
      }
    }

    loadBoard()
    return () => {
      cancelled = true
    }
  }, [selectedExamId, isLoadingExams, exams])

  const entries = useMemo(() => boardRows.map((r) => r.entry), [boardRows])

  const analytics = useMemo(() => computeSessionAnalytics(entries), [entries])

  const submittedRows = useMemo(
    () => boardRows.filter((r) => isExamineeBoardSubmitted(r.entry)),
    [boardRows]
  )

  const inProgressRows = useMemo(
    () => boardRows.filter((r) => !isExamineeBoardSubmitted(r.entry)),
    [boardRows]
  )

  const showToast = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleExport = () => {
    const csvBody = buildBoardParticipantsCsvBody(
      boardRows.map((r) => ({ entry: r.entry, examLabel: r.examTitle }))
    )
    downloadUtf8Csv("analytics-results.csv", csvBody)
    showToast("보내기 시작", "통계 분석 결과가 CSV 파일로 다운로드되고 있습니다.")
  }

  const metricsLoading = isLoadingExams || isLoadingBoard

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">통계 분석</h1>
          <p className="text-sm text-[#6B7280]">
            선택한 시험 세션의 참가자 현황·채점 점수를 집계합니다.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                disabled={isLoadingExams}
                className="appearance-none rounded-lg border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                <option value="all">모든 세션</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id.toString()}>
                    {exam.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={metricsLoading || boardRows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            결과보내기 (CSV)
          </button>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <MetricCard label="평균 프롬프트 점수" value={analytics.avgPrompt} isLoading={metricsLoading} />
          <MetricCard label="평균 성능 점수" value={analytics.avgPerformance} isLoading={metricsLoading} />
          <MetricCard label="평균 정답률 점수" value={analytics.avgCorrectness} isLoading={metricsLoading} />
          <MetricCard
            label="누적 사용자 수"
            value={String(analytics.cumulativeUsers)}
            suffix="명"
            isLoading={metricsLoading}
          />
        </div>

        {boardLoadError && (
          <div className="mb-6 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
            <p className="text-sm text-[#B91C1C]">
              참가자 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB] px-4 py-3">
          <p className="text-sm text-[#6B7280]">
            평균 점수는 채점이 완료된 참가자만 집계합니다. 채점 전이거나 점수가 없으면 &quot;–&quot;로
            표시됩니다. 등급(A~F)은 종합 점수(또는 항목 점수 평균)를 100점 만점 기준으로 산정합니다.
          </p>
        </div>

        {metricsLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-16">
            <p className="text-lg font-medium text-[#6B7280]">불러오는 중...</p>
          </div>
        ) : boardRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-16">
            <p className="text-lg font-medium text-[#6B7280]">조회된 참가자가 없습니다</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">시험 세션을 선택하거나 참가자를 확인해보세요.</p>
          </div>
        ) : (
          <>
            {submittedRows.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                  제출 완료 ({submittedRows.length}명)
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {submittedRows.map((row) => (
                    <ParticipantCard
                      key={`${row.examId}-${row.entry.examParticipantId}`}
                      row={row}
                    />
                  ))}
                </div>
              </div>
            )}

            {inProgressRows.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                  진행 중 ({inProgressRows.length}명)
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {inProgressRows.map((row) => (
                    <ParticipantCard
                      key={`${row.examId}-${row.entry.examParticipantId}`}
                      row={row}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex w-[360px] items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
              <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A]">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">{toast.description}</p>
            </div>
            <button
              type="button"
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
