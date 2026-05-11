"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserTestScreen from "@/components/user-test-screen"
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getActiveSession, getActiveSessionByExam } from "@/lib/api/exams";

export default function TestPage() {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const examId = useExamSessionStore((state) => state.examId);
  const participantId = useExamSessionStore((state) => state.participantId);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // 시험 시작 직후(관리자 start 직후)에는 서버가 아직 "RUNNING/active-session"으로
      // 판단되기 전에 FE가 먼저 조회할 수 있어 404(NO_ACTIVE_SESSION)가 일시적으로 발생할 수 있다.
      // 이 경우 즉시 entry로 튕기지 말고 짧게 재시도 후 실패 시에만 리다이렉트한다.
      const maxAttempts = 6; // 총 5~6초 내 재시도
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const currentExamId = useExamSessionStore.getState().examId;
          const activeSession = currentExamId
            ? await getActiveSessionByExam(currentExamId)
            : await getActiveSession();
          if (cancelled) return;

          if (activeSession) {
            useExamSessionStore.setState({
              examId: activeSession.examId,
              participantId: activeSession.examParticipantId,
              tokenLimit: activeSession.tokenLimit,
            });
            return;
          }

          if (attempt === maxAttempts) {
            setRestoreError("활성 시험 세션이 없습니다. 다시 입장해주세요.");
            setTimeout(() => router.replace("/"), 1200);
            return;
          }

          await sleep(300 + attempt * 250);
        } catch (error: any) {
          if (cancelled) return;
          // 인증 실패(쿠키 누락/만료)는 재시도해도 의미 없으므로 즉시 리다이렉트
          if (error?.status === 401) {
            setRestoreError("인증이 필요합니다. 다시 입장해주세요.");
            setTimeout(() => router.replace("/"), 1200);
            return;
          }

          console.error("[TestPage] active session restore failed:", error);

          if (attempt === maxAttempts) {
            setRestoreError("세션 복구에 실패했습니다. 다시 입장해주세요.");
            setTimeout(() => router.replace("/"), 1200);
            return;
          }

          await sleep(300 + attempt * 250);
        }
      }
    };

    void restoreSession().finally(() => {
      if (!cancelled) setIsRestoring(false);
    });
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
