"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getExamState } from "@/lib/api/exams";

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

    const checkState = async () => {
      try {
        const res = await getExamState(examId);
        if (cancelled) return;

        // 시험이 시작되었다고 판단할 상태 값 확인
        // RUNNING 상태일 때 시험 화면으로 이동
        const state = res.state;

        if (state === "RUNNING") {
          // 시험이 시작된 경우에만 시험 화면으로 이동
          router.push("/test");
        } else {
          // WAITING, ENDED 등의 상태에서는 아무것도 하지 않고 그대로 대기
          // 에러 메시지 초기화 (정상 대기 상태)
          setErrorMessage(null);
        }
      } catch (err) {
        console.error("[WaitingPage] getExamState error:", err);
        // 서버 에러가 나도 대기 화면은 유지하되, 에러 메시지만 살짝 보여줌
        setErrorMessage(
          "시험 상태를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    };

    // 컴포넌트가 마운트될 때 바로 한 번 상태를 체크
    checkState();

    // 그 이후에는 5초마다 상태를 폴링
    const intervalId = setInterval(checkState, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [examId, router]);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] flex flex-col">
      <header className="w-full h-[72px] bg-white flex items-center justify-start pl-16 shadow-sm">
        <h1 className="text-xl font-medium text-foreground">Vibe Coding Evaluator</h1>
      </header>

      {/* 🔥 여기 flex-1 추가 */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8">
        <div
          className="w-20 h-20 rounded-full border-[5px] border-violet-200 border-t-violet-500"
          style={{ animation: "spin 1.5s linear infinite" }}
        />

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-lg font-bold text-foreground">시험 대기 중입니다.</p>
          <p className="text-base text-gray-500">
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
