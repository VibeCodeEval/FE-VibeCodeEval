/**
 * 관리자 참가자 목록(/admin/users) — 응시·제출 상태 표시.
 * BE가 내려주는 attendanceStatus / submissionDisplayStatus를 우선 사용한다.
 */

import type { Exam, ExamineeBoardEntry } from "@/lib/api/admin"

export type AdminUsersConnectionStatus = "대기중" | "응시중" | "응시완료" | "종료됨"

export type AdminUsersSubmissionStatus = "미제출" | "채점중" | "채점완료"

export type ParticipantAttendanceStatusBe =
  | "WAITING"
  | "IN_EXAM"
  | "SUBMITTED"
  | "ENDED"

export type ParticipantSubmissionDisplayStatusBe =
  | "NOT_SUBMITTED"
  | "GRADING"
  | "GRADED"

const ATTENDANCE_LABEL: Record<ParticipantAttendanceStatusBe, AdminUsersConnectionStatus> = {
  WAITING: "대기중",
  IN_EXAM: "응시중",
  SUBMITTED: "응시완료",
  ENDED: "종료됨",
}

const SUBMISSION_LABEL: Record<ParticipantSubmissionDisplayStatusBe, AdminUsersSubmissionStatus> = {
  NOT_SUBMITTED: "미제출",
  GRADING: "채점중",
  GRADED: "채점완료",
}

/** 시험 세션 종료 여부 (BE displayState 또는 endsAt 보정) */
export function getEffectiveExamState(exam: Exam): string {
  const display = exam.displayState?.trim().toUpperCase()
  if (display) return display
  if (isAdminExamEnded(exam)) return "ENDED"
  return (exam.state ?? "").trim().toUpperCase()
}

export function isAdminExamEnded(exam: Exam): boolean {
  const effective = exam.displayState?.trim().toUpperCase()
  if (effective === "ENDED" || effective === "COMPLETED") return true
  const state = (exam.state ?? "").trim().toUpperCase()
  if (state === "ENDED" || state === "COMPLETED" || state === "CLOSED") return true
  if (exam.endsAt) {
    const endMs = new Date(exam.endsAt).getTime()
    if (!Number.isNaN(endMs) && endMs <= Date.now()) return true
  }
  return false
}

function mapAttendanceFromBe(
  value: string | null | undefined
): AdminUsersConnectionStatus | null {
  if (!value) return null
  const key = value.trim().toUpperCase() as ParticipantAttendanceStatusBe
  return ATTENDANCE_LABEL[key] ?? null
}

function mapSubmissionFromBe(
  value: string | null | undefined
): AdminUsersSubmissionStatus | null {
  if (!value) return null
  const key = value.trim().toUpperCase() as ParticipantSubmissionDisplayStatusBe
  return SUBMISSION_LABEL[key] ?? null
}

/** 응시 상태 (관리자 참가자 목록) */
export function resolveAdminUsersConnectionStatus(
  entry: ExamineeBoardEntry,
  exam: Exam
): AdminUsersConnectionStatus {
  const fromBe = mapAttendanceFromBe(entry.attendanceStatus)
  if (fromBe) return fromBe

  if (isAdminExamEnded(exam)) return "종료됨"
  if (entry.submitted) return "응시완료"
  const state = (entry.state ?? "").trim().toUpperCase()
  if (["WAITING", "PENDING", "IDLE"].includes(state)) return "대기중"
  if ((entry.tokenUsed ?? 0) > 0 || ["RUNNING", "IN_PROGRESS", "ACTIVE"].includes(state)) {
    return "응시중"
  }
  return "대기중"
}

/** 제출 상태 */
export function resolveAdminUsersSubmissionStatus(
  entry: ExamineeBoardEntry,
  _exam: Exam,
  _connectionStatus: AdminUsersConnectionStatus
): AdminUsersSubmissionStatus {
  const fromBe = mapSubmissionFromBe(entry.submissionDisplayStatus)
  if (fromBe) return fromBe

  if (!entry.submitted) return "미제출"
  if (entry.totalScore != null && !Number.isNaN(Number(entry.totalScore))) return "채점완료"
  if (entry.evaluatedAt) return "채점완료"
  const status = (entry.submissionStatus ?? "").trim().toUpperCase()
  if (status === "DONE" || status === "FAILED") return "채점완료"
  return "채점중"
}

/** 제출·채점 완료 집계 (통계용) */
export function isAdminUsersSubmissionCountedComplete(
  status: AdminUsersSubmissionStatus
): boolean {
  return status === "채점완료"
}
