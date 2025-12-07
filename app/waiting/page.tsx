"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WaitingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/test");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

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
        </div>
      </main>
    </div>
  );
}
