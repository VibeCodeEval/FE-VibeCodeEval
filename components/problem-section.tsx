"use client"

import { useState, useEffect } from "react"
import { getAssignment, AssignmentResponse } from "@/lib/api/exams"

interface ProblemSectionProps {
  examId: number
}

export function ProblemSection({ examId }: ProblemSectionProps) {
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAssignment(examId)
      .then(setAssignment)
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[ProblemSection] getAssignment failed:", err)
        }
      })
      .finally(() => setLoading(false))
  }, [examId])

  const problem = assignment?.problem

  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] p-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-[#1F2937] mb-4">
        {loading ? "문제 로딩 중..." : problem ? `문제. ${problem.title}` : "문제를 불러올 수 없습니다."}
      </h2>

      {problem && (
        <>
          <div className="text-[#4B5563] text-sm leading-relaxed mb-6 whitespace-pre-wrap">
            {problem.contentMd}
          </div>

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
