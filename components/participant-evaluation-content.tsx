"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, User, Code, CheckCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getExams,
  getBoard,
  formatBoardSubmissionLabelKo,
  type Exam,
  type ExamineeBoardEntry,
} from "@/lib/api/admin"
import { getSubmission, type SubmissionDetailResponse } from "@/lib/api/submissions"

interface ParticipantEvaluationContentProps {
  entryCode: string
  participantName?: string
  /** URL 세그먼트 — 목록·보드와 동일하게 `exam_participants.id` (examParticipantId) */
  participantId: string
  onBack?: () => void
}

interface ToastItem {
  id: string
  title: string
  description: string
}

/**
 * participant-list-content 와 동일 규칙 — 결과 URL 세그먼트 → 시험 매칭
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

function trendFromBoard(entry: ExamineeBoardEntry | null): "High" | "Average" | "Low" {
  if (!entry) return "Low"
  if (entry.submitted) return "High"
  if (entry.state === "ENTRANCE") return "Average"
  return "Low"
}

function TrendBadge({ trend }: { trend: "High" | "Average" | "Low" }) {
  const badgeStyles: Record<string, string> = {
    High: "bg-[#DCFCE7] text-[#16A34A]",
    Average: "bg-[#FEF3C7] text-[#D97706]",
    Low: "bg-[#FEE2E2] text-[#DC2626]",
  }
  const trendText: Record<string, string> = {
    High: "높음",
    Average: "보통",
    Low: "낮음",
  }
  return <span className={"rounded-full px-3 py-1 text-xs font-medium " + badgeStyles[trend]}>{trendText[trend]}</span>
}

function LanguageBadge({ language }: { language: string }) {
  return <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151]">{language}</span>
}

function formatScore(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "–"
  return `${Number(n).toFixed(1)}`
}

export function ParticipantEvaluationContent({
  entryCode,
  participantName: participantNameProp,
  participantId,
  onBack,
}: ParticipantEvaluationContentProps) {
  const router = useRouter()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const [examId, setExamId] = useState<number | null>(null)
  const [boardEntry, setBoardEntry] = useState<ExamineeBoardEntry | null>(null)
  const [boardError, setBoardError] = useState<string | null>(null)
  const [isLoadingBoard, setIsLoadingBoard] = useState(true)

  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetailResponse | null>(null)
  const [submissionDetailError, setSubmissionDetailError] = useState<string | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadBoard() {
      setIsLoadingBoard(true)
      setBoardError(null)
      setBoardEntry(null)
      setExamId(null)
      try {
        const exams = await getExams()
        const matched = findExamByResultsSegment(exams, entryCode)
        if (!matched) {
          if (!cancelled) setBoardError("해당 입장 코드·시험명에 맞는 시험을 찾을 수 없습니다.")
          return
        }
        const board = await getBoard(matched.id)
        const entry = board.find((p) => String(p.examParticipantId) === String(participantId))
        if (!cancelled) {
          setExamId(matched.id)
          if (entry) setBoardEntry(entry)
          else setBoardError("참가자를 보드에서 찾을 수 없습니다. (ID가 examParticipantId와 일치하는지 확인하세요)")
        }
      } catch (e) {
        console.error("Failed to load board for evaluation detail", e)
        if (!cancelled) setBoardError("참가자·시험 정보를 불러오지 못했습니다.")
      } finally {
        if (!cancelled) setIsLoadingBoard(false)
      }
    }
    loadBoard()
    return () => {
      cancelled = true
    }
  }, [entryCode, participantId])

  const submissionId = boardEntry?.submissionId ?? null

  useEffect(() => {
    if (!submissionId) {
      setSubmissionDetail(null)
      setSubmissionDetailError(null)
      return
    }
    let cancelled = false
    async function loadSubmission() {
      setIsLoadingSubmission(true)
      setSubmissionDetailError(null)
      try {
        const detail = await getSubmission(submissionId)
        if (!cancelled) setSubmissionDetail(detail)
      } catch (e: unknown) {
        console.error("getSubmission failed", e)
        if (!cancelled) {
          setSubmissionDetail(null)
          setSubmissionDetailError(
            e instanceof Error ? e.message : "제출 상세를 불러오지 못했습니다. (권한 또는 네트워크를 확인하세요)"
          )
        }
      } finally {
        if (!cancelled) setIsLoadingSubmission(false)
      }
    }
    loadSubmission()
    return () => {
      cancelled = true
    }
  }, [submissionId])

  const displayName = useMemo(() => {
    if (participantNameProp?.trim()) return participantNameProp.trim()
    if (boardEntry?.name) return boardEntry.name
    return "–"
  }, [participantNameProp, boardEntry])

  const submissionStatusLabel = useMemo(() => {
    if (!boardEntry) return null
    return formatBoardSubmissionLabelKo(boardEntry)
  }, [boardEntry])

  const trend = useMemo(() => trendFromBoard(boardEntry), [boardEntry])

  const scoreFromDetail = submissionDetail?.score
  /** BE는 Score 행이 없어도 0으로 채워 보냄 → 전부 0이면 ‘실제 점수 없음’으로 간주 */
  const detailScoresMeaningful =
    scoreFromDetail &&
    (Number(scoreFromDetail.prompt) !== 0 ||
      Number(scoreFromDetail.perf) !== 0 ||
      Number(scoreFromDetail.correctness) !== 0 ||
      Number(scoreFromDetail.total) !== 0)

  const showBoardTotalOnly =
    boardEntry?.totalScore != null &&
    !Number.isNaN(Number(boardEntry.totalScore)) &&
    !detailScoresMeaningful

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
    const header = "Field,Value"
    const rows = [
      `Name,${displayName}`,
      `EntryCodeSegment,${entryCode}`,
      `ExamParticipantId,${participantId}`,
      `ExamId,${examId ?? ""}`,
      `SubmissionId,${submissionId ?? ""}`,
      `BoardStatus,${submissionStatusLabel ?? ""}`,
      `PromptScore,${scoreFromDetail?.prompt ?? ""}`,
      `PerfScore,${scoreFromDetail?.perf ?? ""}`,
      `CorrectnessScore,${scoreFromDetail?.correctness ?? ""}`,
      `TotalScore,${scoreFromDetail?.total ?? boardEntry?.totalScore ?? ""}`,
    ]
    const csvContent = [header, ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "participant-evaluation.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast("보내기 완료", "participant-evaluation.csv")
  }

  const handleBackClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()
    if (onBack) onBack()
    else router.back()
  }

  const langDisplay = submissionDetail?.lang ?? "–"

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">참가자 평가 상세</h1>
          <p className="text-sm text-[#6B7280]">
            보드·제출 API에서 불러온 데이터입니다. 미제공 필드는 안내 문구로 표시됩니다.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#4B5563]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            이전 페이지로 돌아가기
          </button>
        </div>

        {boardError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {boardError}
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">참가자</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0EDFF]">
                <User className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              </div>
              <span className="text-base font-semibold text-[#1A1A1A]">
                {isLoadingBoard ? "…" : displayName}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">시험 구분 (URL)</span>
            <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">{entryCode}</p>
            {examId != null && <p className="mt-1 text-xs text-[#6B7280]">examId: {examId}</p>}
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">토큰 사용량</span>
            <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">
              {isLoadingBoard || !boardEntry ? (
                "…"
              ) : (
                <>
                  {boardEntry.tokenUsed.toLocaleString()} / {boardEntry.tokenLimit.toLocaleString()}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              응시 참가 ID (examParticipantId)
            </span>
            <p className="mt-3 text-base font-semibold text-[#1A1A1A]">{participantId}</p>
            {submissionId != null && (
              <p className="mt-2 text-xs text-[#6B7280]">submissionId: {submissionId}</p>
            )}
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">성과 수준 (보드 기준)</span>
            <div className="mt-3">
              <TrendBadge trend={trend} />
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">제출·채점 상태</span>
            <div className="mt-3">
              {isLoadingBoard ? (
                <span className="text-sm text-[#6B7280]">…</span>
              ) : submissionStatusLabel ? (
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151]">
                  {submissionStatusLabel}
                </span>
              ) : (
                <span className="text-sm text-[#6B7280]">–</span>
              )}
            </div>
            {boardEntry?.submittedAt && (
              <p className="mt-2 text-xs text-[#6B7280]">제출 시각: {boardEntry.submittedAt}</p>
            )}
            {boardEntry?.evaluatedAt && (
              <p className="text-xs text-[#6B7280]">점수 갱신: {boardEntry.evaluatedAt}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">평가 점수 세부 내역</h2>
          {isLoadingSubmission && submissionId != null && (
            <p className="mb-2 text-sm text-[#6B7280]">제출 상세를 불러오는 중…</p>
          )}
          {submissionDetailError && (
            <p className="mb-2 text-sm text-red-600">{submissionDetailError}</p>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">
                {detailScoresMeaningful ? formatScore(scoreFromDetail?.prompt ?? null) : "–"}
              </p>
              <p className="mt-1 text-sm font-medium text-[#374151]">프롬프트 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">GET /api/submissions/… 의 score.prompt</p>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">
                {detailScoresMeaningful ? formatScore(scoreFromDetail?.perf ?? null) : "–"}
              </p>
              <p className="mt-1 text-sm font-medium text-[#374151]">성능 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">GET /api/submissions/… 의 score.perf</p>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">
                {detailScoresMeaningful ? formatScore(scoreFromDetail?.correctness ?? null) : "–"}
              </p>
              <p className="mt-1 text-sm font-medium text-[#374151]">정답률 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {detailScoresMeaningful
                  ? "상세 API score.correctness"
                  : showBoardTotalOnly
                    ? "항목별 값 없음 — 아래 총점만 보드 참고"
                    : "데이터 없음"}
              </p>
            </div>
          </div>
          {detailScoresMeaningful && (
            <p className="mt-3 text-center text-sm font-semibold text-[#1A1A1A]">
              총점 {formatScore(scoreFromDetail?.total ?? null)} (상세 API)
            </p>
          )}
          {!detailScoresMeaningful && showBoardTotalOnly && (
            <p className="mt-3 text-center text-sm font-semibold text-[#1A1A1A]">
              총점 {formatScore(Number(boardEntry!.totalScore))} (관리자 보드 — 상세 점수 행 없음)
            </p>
          )}
          {!detailScoresMeaningful && !showBoardTotalOnly && !isLoadingSubmission && (
            <p className="mt-3 text-center text-sm text-[#6B7280]">표시할 점수 데이터가 없습니다.</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">제출한 코드</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[#374151]">코드</span>
                </div>
                <LanguageBadge language={langDisplay} />
              </div>
              <div className="max-h-[400px] flex-1 overflow-y-auto p-4">
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  현재 <code className="rounded bg-[#F3F4F6] px-1">GET /api/submissions/{"{id}"}</code> 응답에
                  제출 소스 코드 필드가 포함되어 있지 않습니다. 백엔드에 코드 필드가 추가되면 여기에 표시할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E5] px-5 py-3">
                <span className="text-sm font-medium text-[#374151]">AI 피드백 (루브릭·턴 평가)</span>
              </div>
              <div className="max-h-[400px] flex-1 overflow-y-auto p-5">
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  Spring 관리자 API에는 <code className="rounded bg-[#F3F4F6] px-1">prompt_evaluations</code> 본문이
                  아직 노출되지 않습니다. AI 평가 텍스트는 별도 내부/분석 API가 마련되면 연결할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">채점·테스트 요약</h2>
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm p-6">
            {!submissionDetail && !isLoadingSubmission && (
              <p className="text-sm text-[#6B7280]">
                제출이 없거나 제출 상세를 불러오지 못했습니다. 개별 테스트 케이스 입·출력은 현재 API에 없습니다.
              </p>
            )}
            {submissionDetail && (
              <div className="space-y-4 text-sm">
                <p>
                  <span className="font-medium text-[#374151]">제출 상태(상세):</span>{" "}
                  <span className="text-[#1A1A1A]">{submissionDetail.status}</span>
                </p>
                {submissionDetail.metrics && (
                  <p className="text-[#6B7280]">
                    시간 중앙값: {submissionDetail.metrics.timeMsMedian ?? "–"} ms · 메모리 peak:{" "}
                    {submissionDetail.metrics.memKbPeak ?? "–"} KB · LOC: {submissionDetail.metrics.loc ?? "–"}
                  </p>
                )}
                {submissionDetail.tc?.groups && submissionDetail.tc.groups.length > 0 ? (
                  <div>
                    <p className="mb-2 font-medium text-[#374151]">채점 그룹별 통과 (submission_runs 집계)</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E5E5] text-[#6B7280]">
                            <th className="py-2 pr-4">그룹</th>
                            <th className="py-2 pr-4">통과</th>
                            <th className="py-2">전체</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionDetail.tc.groups.map((g, i) => (
                            <tr key={i} className="border-b border-[#F3F4F6]">
                              <td className="py-2 pr-4 font-mono text-xs">{String(g.name)}</td>
                              <td className="py-2 pr-4">{g.pass}</td>
                              <td className="py-2">{g.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {submissionDetail.tc.passRateWeighted != null && (
                      <p className="mt-2 text-[#6B7280]">
                        가중 통과율: {(Number(submissionDetail.tc.passRateWeighted) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#6B7280]">그룹별 채점 요약 데이터가 없습니다.</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              결과보내기 (CSV)
            </button>
          </div>
        </div>
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
