import type { ExamineeBoardEntry } from "@/lib/api/admin"

function normalizeSubmissionStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toUpperCase()
}

function toNumericScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/** 보드 API 기준 제출 완료 (submissions 행 존재) */
export function isExamineeBoardSubmitted(entry: ExamineeBoardEntry): boolean {
  return entry.submitted === true
}

/**
 * 채점 완료 — Score 행(evaluatedAt·totalScore) 또는 제출 실패 등
 * users-content 의 isGradingComplete 와 동일 규칙
 */
export function isExamineeBoardGradingComplete(entry: ExamineeBoardEntry): boolean {
  if (!isExamineeBoardSubmitted(entry)) return false
  const status = normalizeSubmissionStatus(entry.submissionStatus)
  if (status === "FAILED") return true

  if (entry.evaluatedAt) return true
  const total = toNumericScore(entry.totalScore)
  if (total !== null) return true
  return false
}

/** 평균·등급 집계에 포함할 채점 완료 행 (실제 점수 데이터 존재) */
export function isExamineeBoardScoreGraded(entry: ExamineeBoardEntry): boolean {
  if (!isExamineeBoardSubmitted(entry)) return false
  if (entry.evaluatedAt) return true
  if (toNumericScore(entry.totalScore) !== null) return true
  if (
    toNumericScore(entry.promptScore) !== null ||
    toNumericScore(entry.perfScore) !== null ||
    toNumericScore(entry.correctnessScore) !== null
  ) {
    return true
  }
  return false
}

/** 종합 점수 우선, 없으면 존재하는 항목 점수의 산술 평균 (0~100 스케일) */
export function computeParticipantCompositeScore(entry: ExamineeBoardEntry): number | null {
  if (!isExamineeBoardScoreGraded(entry)) return null

  const total = toNumericScore(entry.totalScore)
  if (total !== null) return total

  const parts: number[] = []
  const prompt = toNumericScore(entry.promptScore)
  const perf = toNumericScore(entry.perfScore)
  const correctness = toNumericScore(entry.correctnessScore)
  if (prompt !== null) parts.push(prompt)
  if (perf !== null) parts.push(perf)
  if (correctness !== null) parts.push(correctness)
  if (parts.length === 0) return null
  return parts.reduce((sum, v) => sum + v, 0) / parts.length
}

export function computeLetterGrade(score: number | null): string {
  if (score === null) return "–"
  if (score >= 90) return "A"
  if (score >= 80) return "B"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}

export function computeParticipantLetterGrade(entry: ExamineeBoardEntry): string {
  return computeLetterGrade(computeParticipantCompositeScore(entry))
}

function averageOf(values: number[]): string {
  if (values.length === 0) return "–"
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return avg.toFixed(1)
}

export interface SessionAnalyticsSummary {
  avgPrompt: string
  avgPerformance: string
  avgCorrectness: string
  cumulativeUsers: number
}

export function computeSessionAnalytics(entries: ExamineeBoardEntry[]): SessionAnalyticsSummary {
  const graded = entries.filter(isExamineeBoardScoreGraded)

  const promptValues = graded
    .map((e) => toNumericScore(e.promptScore))
    .filter((n): n is number => n !== null)
  const perfValues = graded
    .map((e) => toNumericScore(e.perfScore))
    .filter((n): n is number => n !== null)
  const correctnessValues = graded
    .map((e) => toNumericScore(e.correctnessScore))
    .filter((n): n is number => n !== null)

  return {
    avgPrompt: averageOf(promptValues),
    avgPerformance: averageOf(perfValues),
    avgCorrectness: averageOf(correctnessValues),
    cumulativeUsers: entries.length,
  }
}
