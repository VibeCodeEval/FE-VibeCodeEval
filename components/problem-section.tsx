"use client"

import { useState, useEffect } from "react"
import { ProblemContentMdView } from "@/components/problem-content-md-view"
import { getAssignment, AssignmentResponse } from "@/lib/api/exams"

interface ProblemSectionProps {
  examId: number
}

export function ProblemSection({ examId }: ProblemSectionProps) {
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const isRetryableNoAssignment = (err: any) => {
      const status = err?.status
      const code = err?.code
      const msg = String(err?.apiMessage || err?.message || "")
      return (
        status === 400 ||
        code === "PROBLEM005" ||
        msg.includes("배정된 문제가 없습니다")
      )
    }

    const load = async () => {
      setLoading(true)
      setErrorMessage(null)

      const maxAttempts = 6
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await getAssignment(examId)
          if (cancelled) return
          setAssignment(res)
          setLoading(false)
          return
        } catch (err: any) {
          if (cancelled) return

          // 인증 실패는 재시도 대신 별도 안내(자동 리다이렉트 금지)
          if (err?.status === 401) {
            setAssignment(null)
            setErrorMessage("인증이 필요합니다. 다시 입장해주세요.")
            setLoading(false)
            return
          }

          // 배정 지연(PROBLEM005)만 짧게 재시도
          if (isRetryableNoAssignment(err) && attempt < maxAttempts) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`[ProblemSection] assignment not ready (attempt ${attempt}/${maxAttempts}), retrying...`, err)
            }
            await sleep(1000)
            if (cancelled) return
            continue
          }

          if (process.env.NODE_ENV === "development") {
            console.warn("[ProblemSection] getAssignment failed:", err)
          }
          setAssignment(null)
          setErrorMessage("문제를 불러올 수 없습니다.")
          setLoading(false)
          return
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [examId])

  const problem = assignment?.problem

  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] p-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4">
        {loading
          ? "문제 배정을 확인하는 중입니다..."
          : problem
            ? `문제. ${problem.title}`
            : (errorMessage ?? "문제를 불러올 수 없습니다.")}
      </h2>

      {problem && (
        <>
          <ProblemContentMdView contentMd={problem.contentMd} className="mb-6" />

          <div className="flex gap-2 flex-wrap">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
              {problem.difficulty}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
