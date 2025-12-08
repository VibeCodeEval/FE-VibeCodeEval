"use client"

import { useState } from "react"
import { Search, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const initialProblems = [
  {
    id: 1,
    title: "문제 1. 문자열 압축하기",
    createdBy: "John Smith",
    lastUpdated: "2일 전",
    usedInSessions: 12,
    description:
      "주어진 문자열에서 연속으로 반복되는 문자를 압축하여 표현하세요. 연속으로 반복되는 문자는 해당 문자와 반복 횟수로 표현합니다. 반복 횟수가 1인 경우에는 숫자를 생략합니다.",
    example: "aabbaccc → 2a2ba3c",
    inputExample: "aabbaccc",
    outputExample: "2a2ba3c",
  },
  {
    id: 2,
    title: "문제 2. 이진 탐색 구현",
    createdBy: "Sarah Johnson",
    lastUpdated: "5일 전",
    usedInSessions: 8,
    description:
      "정렬된 배열에서 특정 값의 위치를 이진 탐색 알고리즘을 사용하여 찾으세요. 값이 존재하면 해당 인덱스를, 존재하지 않으면 -1을 반환합니다.",
    example: "[1, 3, 5, 7, 9], target=5 → 2",
    inputExample: "[1, 3, 5, 7, 9]\ntarget = 5",
    outputExample: "2",
  },
  {
    id: 3,
    title: "문제 3. 연결 리스트 뒤집기",
    createdBy: "Mike Davis",
    lastUpdated: "1주 전",
    usedInSessions: 15,
    description:
      "단일 연결 리스트가 주어졌을 때, 리스트의 순서를 뒤집어서 반환하세요. 리스트의 각 노드는 정수 값을 가지고 있습니다.",
    example: "1 → 2 → 3 → 4 → 5 를 5 → 4 → 3 → 2 → 1 로 변환",
    inputExample: "1 → 2 → 3 → 4 → 5",
    outputExample: "5 → 4 → 3 → 2 → 1",
  },
  {
    id: 4,
    title: "문제 4. 배낭 문제 (동적 프로그래밍)",
    createdBy: "John Smith",
    lastUpdated: "3일 전",
    usedInSessions: 6,
    description:
      "무게 제한이 있는 배낭에 최대 가치를 담을 수 있도록 물건을 선택하세요. 각 물건은 무게와 가치를 가지며, 같은 물건을 여러 번 선택할 수 없습니다.",
    example: "배낭 용량 10, 물건들: [(5, 10), (4, 40), (6, 30), (3, 50)] → 최대 가치: 90",
    inputExample: "capacity = 10\nitems = [(5,10), (4,40), (6,30), (3,50)]",
    outputExample: "90",
  },
]

type Problem = {
  id: number
  title: string
  createdBy: string
  lastUpdated: string
  usedInSessions: number
  description: string
  example: string
  inputExample: string
  outputExample: string
}

export function ProblemContent() {
  const [problems] = useState<Problem[]>(initialProblems)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredProblems = problems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.createdBy.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleViewDetail = (problem: Problem) => {
    setSelectedProblem(problem)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProblem(null)
  }

  return (
    <div className="flex flex-col gap-4 p-6" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1A1A1A",
            lineHeight: "32px",
            letterSpacing: "-0.01em",
          }}
        >
          문제 관리
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
            lineHeight: "20px",
          }}
        >
          플랫폼에서 사용되는 모든 문제를 검토하고 관리합니다.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-lg border-[#E5E5E5] bg-white"
          style={{
            fontSize: "14px",
            fontWeight: 400,
          }}
        />
      </div>

      {/* Card List */}
      <div className="flex flex-col gap-3">
        {filteredProblems.map((problem) => (
          <div
            key={problem.id}
            onClick={() => handleViewDetail(problem)}
            className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
            style={{
              borderRadius: "12px",
            }}
          >
            {/* Left Side - Problem Info */}
            <div className="flex items-center gap-12">
              {/* Problem Title */}
              <div className="min-w-[280px]">
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    lineHeight: "24px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {problem.title}
                </h3>
              </div>

              {/* Created By */}
              <div className="flex flex-col gap-0.5 min-w-[140px]">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#9CA3AF",
                    lineHeight: "16px",
                  }}
                >
                  생성자
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    lineHeight: "20px",
                  }}
                >
                  {problem.createdBy}
                </span>
              </div>

              {/* Last Updated */}
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#9CA3AF",
                    lineHeight: "16px",
                  }}
                >
                  마지막 업데이트
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    lineHeight: "20px",
                  }}
                >
                  {problem.lastUpdated}
                </span>
              </div>

              {/* Used In Sessions */}
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#9CA3AF",
                    lineHeight: "16px",
                  }}
                >
                  사용된 세션
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    lineHeight: "20px",
                  }}
                >
                  {problem.usedInSessions}개
                </span>
              </div>
            </div>

            {/* Right Side - View Detail Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewDetail(problem)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Eye size={18} />
              <span>상세 보기</span>
            </button>
          </div>
        ))}

        {/* Empty State */}
        {filteredProblems.length === 0 && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p style={{ fontSize: "14px" }}>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="bg-white p-0 gap-0 overflow-hidden [&>button]:top-6 [&>button]:right-6"
          style={{
            maxWidth: "1000px",
            width: "90vw",
            borderRadius: "14px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {selectedProblem && (
            <div className="flex flex-col gap-8 p-8">
              {/* Title Area */}
              <DialogHeader className="space-y-2 p-0">
                <DialogTitle
                  className="text-left"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    lineHeight: "32px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {selectedProblem.title}
                </DialogTitle>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#6B7280",
                    lineHeight: "20px",
                  }}
                >
                  생성자: {selectedProblem.createdBy} · 마지막 업데이트: {selectedProblem.lastUpdated}
                </p>
              </DialogHeader>

              {/* Problem Description Box */}
              <div
                className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]"
                style={{
                  padding: "24px",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  문제 설명
                </h4>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "#374151",
                    lineHeight: "26px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedProblem.description}
                </p>
                <div
                  className="mt-4 p-4 bg-white rounded-lg border border-[#E5E5E5]"
                  style={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    fontFamily: "monospace",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#6B7280" }}>예: </span>
                  <span style={{ fontWeight: 600 }}>{selectedProblem.example}</span>
                </div>
              </div>

              {/* Example Input/Output Section */}
              <div className="flex gap-6">
                {/* Input Example */}
                <div
                  className="flex-1 rounded-xl border border-[#E5E5E5] bg-white"
                  style={{
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    입력 예시
                  </h4>
                  <div
                    className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      lineHeight: "22px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedProblem.inputExample}
                  </div>
                </div>

                {/* Output Example */}
                <div
                  className="flex-1 rounded-xl border border-[#E5E5E5] bg-white"
                  style={{
                    padding: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6B7280",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    출력 예시
                  </h4>
                  <div
                    className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5]"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      lineHeight: "22px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedProblem.outputExample}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
