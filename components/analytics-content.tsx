"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Download, TrendingUp, TrendingDown, Minus, ChevronDown, X, CheckCircle } from "lucide-react"
import { getExams, getBoard, Exam, ExamineeBoardEntry } from "@/lib/api/admin"

type Trend = "높음" | "보통" | "낮음"
type Status = "완료" | "진행 중"

interface Participant {
  id: string
  name: string
  entryCode: string
  avgScore: number
  status: Status
  trend: Trend
  sparklineData: number[]
  testDate: Date
  promptScore: number
  performanceScore: number
  correctnessScore: number
}

interface Toast {
  id: string
  title: string
  description: string
}

function mapBoardToParticipant(entry: ExamineeBoardEntry, examTitle: string): Participant {
  const submitted = entry.submitted
  // tokenUsed를 0~100 스케일로 정규화 (tokenLimit 기준)
  const tokenRatio =
    entry.tokenLimit > 0 ? Math.min(100, Math.round((entry.tokenUsed / entry.tokenLimit) * 100)) : 0

  return {
    id: entry.examParticipantId.toString(),
    name: entry.name,
    entryCode: examTitle,
    avgScore: 0, // 채점 API 미연동 — 채점 완료 후 집계 예정
    status: submitted ? "완료" : "진행 중",
    trend: "보통",
    sparklineData: [0, tokenRatio], // 토큰 사용 추이
    testDate: new Date(),
    promptScore: 0,
    performanceScore: 0,
    correctnessScore: 0,
  }
}

function Sparkline({ data, trend }: { data: number[]; trend: Trend }) {
  const width = 100
  const height = 32
  const padding = 4

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  const lineColor = trend === "높음" ? "#4AA785" : trend === "낮음" ? "#D6455D" : "#9CA3AF"

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "높음") {
    return <TrendingUp className="h-4 w-4 text-[#4AA785]" strokeWidth={2} />
  } else if (trend === "낮음") {
    return <TrendingDown className="h-4 w-4 text-[#D6455D]" strokeWidth={2} />
  }
  return <Minus className="h-4 w-4 text-[#9CA3AF]" strokeWidth={2} />
}

function StatusBadge({ status }: { status: Status }) {
  const styles = status === "완료" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#E0E7FF] text-[#6366F1]"
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{status}</span>
}

function TrendBadge({ trend }: { trend: Trend }) {
  const styles = {
    "높음": "bg-[#DCFCE7] text-[#16A34A]",
    "보통": "bg-[#F3F4F6] text-[#6B7280]",
    "낮음": "bg-[#FEE2E2] text-[#DC2626]",
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[trend]}`}>{trend}</span>
}

function MetricCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1A1A1A]">
        {value}
        {suffix && <span className="ml-1 text-base font-normal text-[#6B7280]">{suffix}</span>}
      </p>
    </div>
  )
}

function ParticipantCard({ participant }: { participant: Participant }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#1A1A1A]">{participant.name}</h3>
          <p className="mt-0.5 text-sm text-[#9CA3AF]">{participant.entryCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={participant.status} />
          <TrendBadge trend={participant.trend} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-[#6B7280]">제출 상태</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#1A1A1A]">{participant.status}</span>
              <TrendIcon trend={participant.trend} />
            </div>
          </div>
        </div>
        <Sparkline data={participant.sparklineData} trend={participant.trend} />
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={{
            pathname: `/admin/results/${encodeURIComponent(participant.entryCode)}/${participant.id}`,
            query: { from: "analytics" },
          }}
          className="text-sm font-medium text-[#3B82F6] transition-colors hover:text-[#2563EB]"
        >
          상세 보기 →
        </Link>
      </div>
    </div>
  )
}

export function AnalyticsContent() {
  const [exams, setExams] = useState<Exam[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [isLoadingBoard, setIsLoadingBoard] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string>("all")
  const [toasts, setToasts] = useState<Toast[]>([])

  // 시험 목록 로드
  useEffect(() => {
    async function loadExams() {
      try {
        const data = await getExams()
        setExams(data)
      } catch (e) {
        console.error("Failed to load exams", e)
      } finally {
        setIsLoadingExams(false)
      }
    }
    loadExams()
  }, [])

  // 선택된 시험 보드 로드
  useEffect(() => {
    async function loadBoard() {
      if (isLoadingExams) return
      setIsLoadingBoard(true)
      try {
        if (selectedExamId === "all") {
          // 모든 시험의 보드를 병렬 조회
          const boards = await Promise.all(
            exams.map((e) =>
              getBoard(e.id)
                .then((entries) => entries.map((p) => mapBoardToParticipant(p, e.title)))
                .catch(() => [] as Participant[])
            )
          )
          setParticipants(boards.flat())
        } else {
          const examId = parseInt(selectedExamId, 10)
          const exam = exams.find((e) => e.id === examId)
          const board = await getBoard(examId)
          setParticipants(board.map((p) => mapBoardToParticipant(p, exam?.title ?? selectedExamId)))
        }
      } catch (e) {
        console.error("Failed to load board", e)
        setParticipants([])
      } finally {
        setIsLoadingBoard(false)
      }
    }
    loadBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId, isLoadingExams])

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
    const csvContent =
      "이름,시험,제출상태\n" +
      participants.map((p) => `${p.name},${p.entryCode},${p.status}`).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "analytics-results.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast("내보내기 시작", "통계 분석 결과가 CSV 파일로 다운로드되고 있습니다.")
  }

  const completedParticipants = useMemo(
    () => participants.filter((p) => p.status === "완료"),
    [participants]
  )
  const inProgressParticipants = useMemo(
    () => participants.filter((p) => p.status === "진행 중"),
    [participants]
  )

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">통계 분석</h1>
          <p className="text-sm text-[#6B7280]">
            모든 시험 세션의 참가자 현황 및 제출 상태를 시각화합니다.
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
                className="appearance-none rounded-lg border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
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
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            결과 내보내기 (CSV)
          </button>
        </div>

        {/* 메트릭 카드 — 점수는 채점 완료 후 집계됨 */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <MetricCard label="프롬프트 점수" value="–" />
          <MetricCard label="성능 점수" value="–" />
          <MetricCard label="정답률 점수" value="–" />
          <MetricCard label="누적 사용자 수" value={isLoadingBoard ? "..." : participants.length.toString()} />
        </div>

        {/* 점수 미집계 안내 */}
        <div className="mb-6 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB] px-4 py-3">
          <p className="text-sm text-[#6B7280]">
            평가 점수는 채점 완료 후 집계됩니다. 현재는 참가자 현황 및 제출 상태를 기준으로 표시합니다.
          </p>
        </div>

        {isLoadingBoard ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-16">
            <p className="text-lg font-medium text-[#6B7280]">불러오는 중...</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-16">
            <p className="text-lg font-medium text-[#6B7280]">조회된 참가자가 없습니다</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">시험 세션을 선택하거나 참가자를 확인해보세요.</p>
          </div>
        ) : (
          <>
            {completedParticipants.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                  제출 완료 ({completedParticipants.length}명)
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {completedParticipants.map((participant) => (
                    <ParticipantCard key={participant.id} participant={participant} />
                  ))}
                </div>
              </div>
            )}

            {inProgressParticipants.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                  진행 중 ({inProgressParticipants.length}명)
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {inProgressParticipants.map((participant) => (
                    <ParticipantCard key={participant.id} participant={participant} />
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
