import type { Exam, ExamineeBoardEntry } from "@/lib/api/admin"

/** Test Sessions 목록 행 */
export type TestSessionListItem = {
  id: number
  sessionId: string
  createdBy: string
  createdAt: string
  /** 필터용: Active | Completed */
  status: string
  /** UI 표시용 한글 */
  statusLabel: string
  participants: number
  sortKey: number
  rawState: string
  startsAt: string
}

/** Master Dashboard · Test Sessions 목록 공통 표시 모델 */
export type MasterRecentSession = {
  id: number
  sessionId: string
  createdAt: string
  participants: number
  status: string
  sortKey: number
}

export const RECENT_SESSIONS_DISPLAY_LIMIT = 4

type ExamWithOptionalCreatedAt = Exam & { createdAt?: string | null }

/** URL params → examId (유효하지 않으면 null) */
export function parseExamIdParam(raw: string | undefined | null): number | null {
  if (raw == null || String(raw).trim() === "") return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

/** 정렬: createdAt 우선, 없으면 startsAt */
export function getExamSortTimestamp(exam: Exam): number {
  const extended = exam as ExamWithOptionalCreatedAt
  const iso = extended.createdAt?.trim() || exam.startsAt?.trim() || ""
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function sortExamsByCreatedAtDesc(exams: Exam[]): Exam[] {
  return [...exams].sort((a, b) => getExamSortTimestamp(b) - getExamSortTimestamp(a))
}

export function formatSessionCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso.split("T")[0] ?? "-"
  }
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 상세 화면용 날짜·시간 */
export function formatSessionDateTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.replace("T", " ").slice(0, 16)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day} ${h}:${min}`
}

export function getExamDisplayDate(exam: Exam): string {
  const extended = exam as ExamWithOptionalCreatedAt
  const iso = extended.createdAt?.trim() || exam.startsAt?.trim()
  return formatSessionDateTime(iso)
}

/** 목록 필터용 Active / Completed */
const UNKNOWN_CREATOR_LABEL = "알 수 없음"

/** API creatorName → 목록/상세 표시용 생성자 라벨 */
export function resolveExamCreatorDisplayName(exam: Exam): string {
  const name = exam.creatorName?.trim()
  if (name) return name
  return UNKNOWN_CREATOR_LABEL
}

export function getTestSessionFilterStatus(state: string | null | undefined): string {
  const normalized = (state ?? "").trim().toUpperCase()
  if (["RUNNING", "IN_PROGRESS", "ACTIVE"].includes(normalized)) return "Active"
  return "Completed"
}

export function mapExamToTestSession(exam: Exam): TestSessionListItem {
  const title = (exam.title ?? "").trim()
  return {
    id: exam.id,
    sessionId: title || `시험 #${exam.id}`,
    createdBy: resolveExamCreatorDisplayName(exam),
    createdAt: formatSessionCreatedAt(
      (exam as ExamWithOptionalCreatedAt).createdAt ?? exam.startsAt
    ),
    status: getTestSessionFilterStatus(exam.state),
    statusLabel: getMasterSessionStatusLabel(exam.state),
    participants: exam.participantCount ?? 0,
    sortKey: getExamSortTimestamp(exam),
    rawState: exam.state ?? "",
    startsAt: exam.startsAt ?? "",
  }
}

export function mapExamsToTestSessions(exams: Exam[]): TestSessionListItem[] {
  return sortExamsByCreatedAtDesc(exams).map(mapExamToTestSession)
}

/** 세션 종료 여부 (completed / ended / finished 계열) */
export function isExamSessionEnded(state: string | null | undefined): boolean {
  const normalized = (state ?? "").trim().toUpperCase()
  return ["ENDED", "COMPLETED", "FINISHED", "CLOSED", "DONE"].includes(normalized)
}

/** 세션 진행 중 여부 (active / running / in_progress 계열) */
export function isExamSessionActive(state: string | null | undefined): boolean {
  const normalized = (state ?? "").trim().toUpperCase()
  return ["RUNNING", "IN_PROGRESS", "ACTIVE"].includes(normalized)
}

export type ParticipantExamStatusInput = {
  submitted?: boolean
  submissionStatus?: string | null
  submissionStatusLabel?: string
  state?: string | null
}

function isParticipantSubmissionComplete(input: ParticipantExamStatusInput): boolean {
  if (input.submitted === true) return true
  const label = (input.submissionStatusLabel ?? "").trim()
  if (label === "제출됨" || label.startsWith("채점 완료")) return true
  const st = (input.submissionStatus ?? "").trim().toUpperCase()
  return st === "DONE"
}

function isParticipantInProgress(input: ParticipantExamStatusInput): boolean {
  const label = (input.submissionStatusLabel ?? "").trim()
  if (label === "진행 중" || label === "제출·채점 중") return true
  const st = (input.state ?? "").trim().toUpperCase()
  return st === "ENTRANCE"
}

/** Master 테스트 세션 상세 — 참가자 응시 상태 */
export function mapMasterParticipantExamStatus(
  examState: string | null | undefined,
  input: ParticipantExamStatusInput
): string {
  if (isExamSessionEnded(examState)) {
    return "종료됨"
  }

  if (isExamSessionActive(examState)) {
    if (isParticipantSubmissionComplete(input)) return "응시 완료"
    if (isParticipantInProgress(input)) return "응시 중"
    return "대기 중"
  }

  if (isParticipantSubmissionComplete(input)) return "응시 완료"
  if (isParticipantInProgress(input)) return "응시 중"

  const sessionLabel = getMasterSessionStatusLabel(examState)
  if (sessionLabel === "대기 중") return "대기 중"

  return "-"
}

export function mapBoardConnectionStatus(state: string | null | undefined): string {
  const normalized = (state ?? "").trim().toUpperCase()
  if (["ENTRANCE", "ACTIVE", "RUNNING", "IN_PROGRESS", "CONNECTED", "ONLINE", "JOINED", "STARTED"].includes(normalized)) {
    return "Connected"
  }
  if (["PENDING", "WAITING", "IDLE"].includes(normalized)) {
    return "Pending"
  }
  return "Disconnected"
}

export function mapBoardParticipant(entry: ExamineeBoardEntry) {
  return {
    id: entry.examParticipantId,
    name: entry.name || "-",
    phoneNumber: entry.phoneMasked || "-",
    connectionStatus: mapBoardConnectionStatus(entry.state),
    hasSubmission: entry.submitted === true,
    submissionStatusLabel: entry.submitted ? "submitted" : "not_started",
    tokenUsage: entry.tokenUsed ?? 0,
  }
}

/** Dashboard / Test Sessions 상태 한글 라벨 */
export function getMasterSessionStatusLabel(state: string | null | undefined): string {
  const normalized = (state ?? "").trim().toUpperCase()
  if (["RUNNING", "IN_PROGRESS", "ACTIVE"].includes(normalized)) {
    return "진행 중"
  }
  if (["ENDED", "COMPLETED", "FINISHED", "CLOSED"].includes(normalized)) {
    return "완료"
  }
  if (["WAITING", "PENDING", "SCHEDULED", "DRAFT"].includes(normalized)) {
    return "대기 중"
  }
  return state?.trim() || "-"
}

export function isMasterSessionInProgress(statusLabel: string): boolean {
  return statusLabel === "진행 중"
}

export function mapExamToMasterRecentSession(exam: Exam): MasterRecentSession {
  const item = mapExamToTestSession(exam)
  return {
    id: item.id,
    sessionId: item.sessionId,
    createdAt: item.createdAt,
    participants: item.participants,
    status: item.statusLabel,
    sortKey: item.sortKey,
  }
}

export function sortMasterSessionsByCreatedAtDesc(
  sessions: MasterRecentSession[]
): MasterRecentSession[] {
  return [...sessions].sort((a, b) => b.sortKey - a.sortKey)
}

export function pickRecentSessions(
  exams: Exam[],
  limit = RECENT_SESSIONS_DISPLAY_LIMIT
): MasterRecentSession[] {
  return sortMasterSessionsByCreatedAtDesc(exams.map(mapExamToMasterRecentSession)).slice(0, limit)
}
