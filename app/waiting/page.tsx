"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getExamState, getParticipantSession } from "@/lib/api/exams";

export default function WaitingPage() {
  const router = useRouter();
  const examId = useExamSessionStore((state: { examId: number | null }) => state.examId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // examId가 없으면 상태 조회가 불가능하므로, 초기 화면으로 돌려보내거나 안내 메시지를 띄움
    if (!examId) {
      setErrorMessage("시험 정보가 없습니다. 처음 화면으로 돌아가 다시 입장해 주세요.");
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const checkState = async () => {
      try {
        const res = await getExamState(examId);
        if (cancelled) return;

        const state = res.state;

        if (state === "RUNNING") {
          // RUNNING 확정 시점에 interval을 즉시 정리해 중복 실행 방지
          clearInterval(intervalId);

          // 시험 시작 후 최신 세션 정보(tokenLimit 등)를 재조회해 store 갱신
          try {
            const session = await getParticipantSession(examId);
            // 비동기 대기 중 unmount가 발생했을 수 있으므로 재확인
            if (cancelled) return;
            useExamSessionStore.setState({ tokenLimit: session.tokenLimit });
          } catch (sessionErr) {
            // 세션 갱신 실패해도 화면 이동은 진행 (기존 값 유지)
            console.warn("[WaitingPage] getParticipantSession 실패, 기존 tokenLimit 유지:", sessionErr);
          }

          if (cancelled) return;
          router.push("/test");
        } else {
          // WAITING, ENDED 등의 상태에서는 아무것도 하지 않고 그대로 대기
          setErrorMessage(null);
        }
      } catch (err) {
        console.error("[WaitingPage] getExamState error:", err);
        setErrorMessage(
          "시험 상태를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    };

    // 컴포넌트가 마운트될 때 바로 한 번 상태를 체크
    checkState();

    // 그 이후에는 5초마다 상태를 폴링
    intervalId = setInterval(checkState, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [examId, router]);

  return (
    <div className="min-h-screen w-full bg-app-surface flex flex-col">
      <header className="w-full h-[72px] bg-white flex items-center justify-start pl-16 shadow-sm">
        <h1 className="text-xl font-medium text-foreground">Vibe Coding Evaluator</h1>
      </header>

      {/* 🔥 여기 flex-1 추가 */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8">
        <div
          className="w-20 h-20 rounded-full border-[5px] border-app-spinner-track border-t-foreground"
          style={{ animation: "spin 1.5s linear infinite" }}
        />

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-lg font-bold text-foreground">시험 대기 중입니다.</p>
          <p className="text-base text-muted-foreground">
            관리자가 시험을 시작하면 자동으로 진행됩니다.
          </p>
          {errorMessage && (
            <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
          )}
        </div>
      </main>
    </div>
  );
}
