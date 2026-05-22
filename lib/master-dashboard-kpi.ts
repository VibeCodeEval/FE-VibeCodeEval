import type { Exam, ExamineeBoardEntry, SystemStatusServiceItem } from "@/lib/api/admin"

/** 진행 중으로 집계할 시험 상태 (Admin dashboard / test-sessions 와 동일) */
export const ACTIVE_EXAM_STATES = new Set(["RUNNING", "IN_PROGRESS", "ACTIVE"])

/** 오늘 참여로 볼 참가자 상태 */
const PARTICIPANT_PARTICIPATED_STATES = new Set([
  "ENTRANCE",
  "ACTIVE",
  "RUNNING",
  "IN_PROGRESS",
  "STARTED",
  "JOINED",
])

export type MasterSystemStatusTone = "success" | "warning" | "danger" | "connectionFailed"

export type MasterSystemStatusSource =
  | { type: "fetch_failed" }
  | { type: "services"; services: SystemStatusServiceItem[] }

export type MasterSystemStatusDisplay = {
  label: string
  valueColor: string
  iconColor: string
  iconBg: string
}

export function isActiveExam(exam: Exam): boolean {
  return ACTIVE_EXAM_STATES.has((exam.state ?? "").trim().toUpperCase())
}

export function countActiveExamSessions(exams: Exam[]): number {
  return exams.filter(isActiveExam).length
}

export function isSameLocalCalendarDay(
  iso: string | null | undefined,
  ref: Date = new Date()
): boolean {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

/**
 * 오늘 참가자 수 — board API 기준
 * - 오늘 제출/채점 활동(submittedAt, evaluatedAt)
 * - 진행 중 시험 또는 오늘 시작된 시험에서 입장·응시 중인 참가자
 */
export function countTodayParticipants(
  exams: Exam[],
  boards: ExamineeBoardEntry[][]
): number {
  const seen = new Set<number>()

  exams.forEach((exam, index) => {
    const entries = boards[index] ?? []
    const examActive = isActiveExam(exam)
    const examStartsToday = isSameLocalCalendarDay(exam.startsAt)

    for (const entry of entries) {
      if (
        isSameLocalCalendarDay(entry.submittedAt) ||
        isSameLocalCalendarDay(entry.evaluatedAt)
      ) {
        seen.add(entry.examParticipantId)
        continue
      }

      if (!examActive && !examStartsToday) continue

      const state = (entry.state ?? "").trim().toUpperCase()
      if (PARTICIPANT_PARTICIPATED_STATES.has(state)) {
        seen.add(entry.examParticipantId)
        continue
      }

      if ((entry.tokenUsed ?? 0) > 0) {
        seen.add(entry.examParticipantId)
      }
    }
  })

  return seen.size
}

const SYSTEM_STATUS_STYLES: Record<MasterSystemStatusTone, MasterSystemStatusDisplay> = {
  success: {
    label: "운영 중",
    valueColor: "#22C55E",
    iconColor: "#22C55E",
    iconBg: "#F0FDF4",
  },
  warning: {
    label: "부분 장애",
    valueColor: "#D97706",
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
  },
  danger: {
    label: "점검 중",
    valueColor: "#DC2626",
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
  },
  connectionFailed: {
    label: "연결 실패",
    valueColor: "#6B7280",
    iconColor: "#6B7280",
    iconBg: "#F3F4F6",
  },
}

/**
 * server-status API 결과 → Master KPI 카드 문구
 * - fetch_failed: getSystemStatus() 요청 자체 실패
 * - services: 응답 수신 후 api / database / ai 상태 집계
 */
export function deriveMasterSystemStatusDisplay(
  source: MasterSystemStatusSource
): MasterSystemStatusDisplay {
  if (source.type === "fetch_failed") {
    return SYSTEM_STATUS_STYLES.connectionFailed
  }

  const services = source.services
  if (!services.length) {
    return SYSTEM_STATUS_STYLES.danger
  }

  const statuses = services.map((s) => (s.status ?? "").trim().toUpperCase())
  const upCount = statuses.filter((s) => s === "UP").length

  if (upCount === statuses.length) {
    return SYSTEM_STATUS_STYLES.success
  }
  if (upCount === 0) {
    return SYSTEM_STATUS_STYLES.danger
  }
  return SYSTEM_STATUS_STYLES.warning
}
