/**
 * Master 테스트 세션 — 참가자 평가 상세 URL
 * 라우트: app/master/test-sessions/[ID]/participants/[participantId]/page.tsx
 */
export function masterParticipantEvaluationHref(opts: {
  examId: string | number
  participantId: string | number
  participantName?: string
}): string {
  const examSeg = String(opts.examId).trim()
  const pid = String(opts.participantId).trim()
  const path = `/master/test-sessions/${encodeURIComponent(examSeg)}/participants/${encodeURIComponent(pid)}`
  if (opts.participantName != null && String(opts.participantName).trim() !== "") {
    const q = new URLSearchParams()
    q.set("participantName", String(opts.participantName).trim())
    return `${path}?${q.toString()}`
  }
  return path
}
