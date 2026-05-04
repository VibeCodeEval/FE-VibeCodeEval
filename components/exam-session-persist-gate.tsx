"use client"

import { useLayoutEffect, useState, type ReactNode } from "react"
import { useExamSessionStore } from "@/lib/stores/exam-session-store"

/**
 * 시험 세션 zustand persist(skipHydration) 복구가 끝난 뒤에만 자식을 렌더링합니다.
 * 새로고침 직후 examId 등이 잠깐 null인 상태로 API/타이머가 돌지 않도록 합니다.
 */
export function ExamSessionPersistGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    if (useExamSessionStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    void Promise.resolve(useExamSessionStore.persist.rehydrate())
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] text-sm text-[#6B7280]">
        시험 정보를 불러오는 중…
      </div>
    )
  }

  return <>{children}</>
}
