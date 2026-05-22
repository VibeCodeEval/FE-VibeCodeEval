"use client"

import { useParams, useRouter } from "next/navigation"
import TestSessionDetailsContent from "@/components/test-session-details-content"
import { parseExamIdParam } from "@/lib/master-test-sessions"

export default function Page() {
  const router = useRouter()
  const params = useParams<{ ID?: string; id?: string }>()
  const examId = parseExamIdParam(params?.ID ?? params?.id)

  return (
    <TestSessionDetailsContent
      examId={examId}
      onBack={() => router.push("/master/test-sessions")}
    />
  )
}
