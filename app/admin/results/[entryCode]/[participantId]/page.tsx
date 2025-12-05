"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ParticipantEvaluationContent } from "@/components/participant-evaluation-content";

export default function ParticipantEvaluationPage() {
  const router = useRouter();

  // URL 동적 파라미터 (entryCode, participantId)
  const { entryCode, participantId } = useParams<{
    entryCode: string;
    participantId: string;
  }>();

  // ?from=results | ?from=analytics
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const sessionId = searchParams.get("sessionId");

  const decodedEntryCode = decodeURIComponent(entryCode);

  const handleBack = () => {
  if (from === "results") {
    // 1번 루트 복귀 (Results → Detail)
    router.push(`/admin/results/${encodeURIComponent(decodedEntryCode)}`);
  } else if (from === "analytics") {
    // 2번 루트 복귀 (Analytics → Detail)
    router.push("/admin/analytics");
  } else if (from === "master" && sessionId) {
    // 3번 루트 복귀 (Master → Test Session Details → Detail)
    router.push(`/master/test-sessions/${sessionId}`);
  } else {
    // 직접 URL 입력/새로고침 같은 경우
    router.back();
  }
};

  return (
    <main className="mt-[0px] min-h-[calc(100vh-80px)] overflow-y-auto py-6 px-8">
      <ParticipantEvaluationContent
        entryCode={decodedEntryCode}
        participantId={String(participantId)}
        onBack={handleBack}
      />
    </main>
  );
}
