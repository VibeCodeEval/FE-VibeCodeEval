"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserTestScreen from "@/components/user-test-screen"
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getActiveSession } from "@/lib/api/exams";

export default function TestPage() {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const examId = useExamSessionStore((state) => state.examId);
  const participantId = useExamSessionStore((state) => state.participantId);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const activeSession = await getActiveSession();
        if (cancelled) return;

        if (!activeSession) {
          setRestoreError("활성 시험 세션이 없습니다. 다시 입장해주세요.");
          setTimeout(() => router.replace("/"), 1200);
          return;
        }

        useExamSessionStore.setState({
          examId: activeSession.examId,
          participantId: activeSession.examParticipantId,
          tokenLimit: activeSession.tokenLimit,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("[TestPage] active session restore failed:", error);
        setRestoreError("세션 복구에 실패했습니다. 다시 입장해주세요.");
        setTimeout(() => router.replace("/"), 1200);
      } finally {
        if (!cancelled) {
          setIsRestoring(false);
        }
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isRestoring || !examId || !participantId) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-base font-medium text-[#1F2937]">
            {restoreError ?? "시험 세션을 복구하는 중입니다..."}
          </p>
        </div>
      </div>
    );
  }

  return <UserTestScreen />
}
