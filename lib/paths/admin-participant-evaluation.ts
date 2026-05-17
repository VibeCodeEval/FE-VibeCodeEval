/**
 * 관리자 평가 결과 — 참가자 상세 화면 URL
 * 라우트: app/admin/results/[entryCode]/[participantId]/page.tsx
 *
 * 첫 경로 세그먼트는 participant-list-content 의 findExamByResultsSegment 와 동일하게
 * entryCode · 시험 제목 · 또는 숫자 exam id 를 사용할 수 있습니다.
 */
export type AdminParticipantEvaluationFrom = "results" | "analytics" | "master"

export function adminParticipantEvaluationHref(opts: {
  resultsSegment: string | number
  participantId: string | number
  from: AdminParticipantEvaluationFrom
  participantName?: string
  /** from === "master" 일 때 뒤로가기용 */
  sessionId?: string | number
}): string {
  const seg = String(opts.resultsSegment).trim()
  const pid = String(opts.participantId)
  const path = `/admin/results/${encodeURIComponent(seg)}/${encodeURIComponent(pid)}`
  const q = new URLSearchParams()
  q.set("from", opts.from)
  if (opts.participantName != null && String(opts.participantName).trim() !== "") {
    q.set("participantName", String(opts.participantName).trim())
  }
  if (opts.from === "results") {
    q.set("entryCode", seg)
  }
  if (opts.from === "master" && opts.sessionId != null && String(opts.sessionId) !== "") {
    q.set("sessionId", String(opts.sessionId))
  }
  const qs = q.toString()
  return qs ? `${path}?${qs}` : path
}
