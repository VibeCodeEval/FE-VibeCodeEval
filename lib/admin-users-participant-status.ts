/**
 * 관리자 참가자 목록(/admin/users) — 응시·제출 상태 표시 (FE 보정, API 변경 없음).
 */

import type { Exam, ExamineeBoardEntry } from "@/lib/api/admin"
import { isExamSessionEnded } from "@/lib/master-test-sessions"

export type AdminUsersConnectionStatus = "응시 완료" | "응시 중" | "대기 중" | "종료됨"

export type AdminUsersSubmissionStatus =
  | "시작 전"
  | "진행 중"
  | "채점 중"
  | "제출 완료"
  | "채점 완료"
  | "미제출"
  | "제출 실패"

const PARTICIPANT_WAITING_STATES = new Set(["WAITING", "PENDING", "IDLE"])

const PARTICIPANT_EXAMINING_STATES = new Set([
  "ACTIVE",
  "RUNNING",
  "IN_PROGRESS",
  "ENTRANCE",
  "STARTED",
  "JOINED",
])

function normalizeParticipantState(state: string | null | undefined): string {
  return (state ?? "").trim().toUpperCase()
}

function normalizeSubmissionStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toUpperCase()
}

export function isAdminExamEnded(exam: Exam): boolean {
  if (isExamSessionEnded(exam.state)) return true
  if (exam.endsAt) {
    const endMs = new Date(exam.endsAt).getTime()
    if (!Number.isNaN(endMs) && endMs <= Date.now()) return true
  }
  return false
}

function isWaitingParticipant(entry: ExamineeBoardEntry): boolean {
  const state = normalizeParticipantState(entry.state)
  if (PARTICIPANT_WAITING_STATES.has(state)) return true
  if (!state && (entry.tokenUsed ?? 0) === 0 && !entry.submitted) return true
  return false
}

/** 응시가 진행 중인지 (시험·응시 종료 전용 판단에는 사용하지 않음) */
export function isExamineeInProgress(entry: ExamineeBoardEntry): boolean {
  if (entry.submitted) return false
  const state = normalizeParticipantState(entry.state)
  if (PARTICIPANT_EXAMINING_STATES.has(state)) return true
  if ((entry.tokenUsed ?? 0) > 0) return true
  if (
    entry.submissionStatus === "QUEUED" ||
    entry.submissionStatus === "RUNNING"
  ) {
    return true
  }
  return false
}

export function isSubmissionGradingComplete(entry: ExamineeBoardEntry): boolean {
  if (!entry.submitted) return false
  const status = normalizeSubmissionStatus(entry.submissionStatus)
  if (status === "FAILED") return true

  if (entry.evaluatedAt) return true
  if (entry.totalScore != null && entry.totalScore !== undefined) {
    const n = Number(entry.totalScore)
    if (!Number.isNaN(n)) return true
  }
  if (status === "DONE") return true
  return false
}

function isSubmissionGradingInFlight(entry: ExamineeBoardEntry): boolean {
  const status = normalizeSubmissionStatus(entry.submissionStatus)
  return status === "QUEUED" || status === "RUNNING"
}

export function isExamineeSessionEnded(
  connectionStatus: AdminUsersConnectionStatus,
  exam: Exam
): boolean {
  if (connectionStatus === "종료됨" || connectionStatus === "응시 완료") {
    return true
  }
  return isAdminExamEnded(exam)
}

/** 응시 상태 (관리자 참가자 목록) */
export function resolveAdminUsersConnectionStatus(
  entry: ExamineeBoardEntry,
  exam: Exam
): AdminUsersConnectionStatus {
  if (isAdminExamEnded(exam)) return "종료됨"
  if (entry.submitted) return "응시 완료"
  if (isWaitingParticipant(entry)) return "대기 중"
  if (isExamineeInProgress(entry)) return "응시 중"
  return "대기 중"
}

/**
 * 제출 상태 — 응시가 종료된 경우 `진행 중`을 쓰지 않음.
 */
export function resolveAdminUsersSubmissionStatus(
  entry: ExamineeBoardEntry,
  exam: Exam,
  connectionStatus: AdminUsersConnectionStatus
): AdminUsersSubmissionStatus {
  const examineeEnded = isExamineeSessionEnded(connectionStatus, exam)

  if (!examineeEnded) {
    if (!entry.submitted) {
      if (isExamineeInProgress(entry)) return "진행 중"
      return "시작 전"
    }
    if (normalizeSubmissionStatus(entry.submissionStatus) === "FAILED") {
      return "제출 실패"
    }
    if (isSubmissionGradingComplete(entry)) return "채점 완료"
    if (isSubmissionGradingInFlight(entry)) return "채점 중"
    return "제출 완료"
  }

  if (!entry.submitted) {
    return "미제출"
  }

  if (normalizeSubmissionStatus(entry.submissionStatus) === "FAILED") {
    return "제출 실패"
  }
  if (isSubmissionGradingComplete(entry)) return "채점 완료"
  if (isSubmissionGradingInFlight(entry)) return "채점 중"
  return "제출 완료"
}

/** 제출·채점이 끝난 것으로 집계할 상태 (통계용) */
export function isAdminUsersSubmissionCountedComplete(
  status: AdminUsersSubmissionStatus
): boolean {
  return status === "제출 완료" || status === "채점 완료"
}
