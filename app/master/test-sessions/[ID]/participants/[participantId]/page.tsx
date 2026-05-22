"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ParticipantEvaluationContent } from "@/components/participant-evaluation-content"
import { parseExamIdParam } from "@/lib/master-test-sessions"

export default function MasterParticipantEvaluationPage() {
  const router = useRouter()
  const params = useParams<{ ID?: string; id?: string; participantId: string }>()
  const searchParams = useSearchParams()

  const examId = parseExamIdParam(params?.ID ?? params?.id)
  const participantId = String(params?.participantId ?? "")
  const participantName = searchParams.get("participantName") ?? undefined

  const handleBack = () => {
    if (examId != null) {
      router.push(`/master/test-sessions/${examId}`)
    } else {
      router.push("/master/test-sessions")
    }
  }

  if (examId == null || !participantId.trim()) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-[#6B7280]">세션 또는 참가자 정보를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <ParticipantEvaluationContent
      examId={examId}
      participantId={participantId}
      participantName={participantName}
      backLabel="테스트 세션 상세로 돌아가기"
      onBack={handleBack}
    />
  )
}
