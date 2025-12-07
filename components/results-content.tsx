"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Download, Eye, X, CheckCircle } from "lucide-react"

interface ResultEntry {
  id: string
  entryCode: string
  total: number
  completed: number
}

interface Toast {
  id: string
  title: string
  description: string
}

const initialResults: ResultEntry[] = [
  { id: "1", entryCode: "AIV-2024-001", total: 54, completed: 54 },
  { id: "2", entryCode: "AIV-2024-002", total: 30, completed: 30 },
  { id: "3", entryCode: "AIV-2024-003", total: 28, completed: 28 },
  { id: "4", entryCode: "TEST-2024-04", total: 12, completed: 12 },
]

function generateDummyCSV(entryCode: string): string {
  const header = "Name,Phone,Score,PromptScore,PerformanceScore,CorrectnessScore"
  const rows = [
    "John Doe,+1-555-0101,87,28,30,29",
    "Jane Smith,+1-555-0102,92,30,32,30",
    "Bob Johnson,+1-555-0103,78,25,28,25",
    "Alice Brown,+1-555-0104,95,32,33,30",
    "Charlie Wilson,+1-555-0105,81,27,29,25",
  ]
  return [header, ...rows].join("\n")
}

function downloadCSV(entryCode: string) {
  const csvContent = generateDummyCSV(entryCode)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `results-${entryCode}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ResultsContent() {
  const [results] = useState<ResultEntry[]>(initialResults)
  const [searchQuery, setSearchQuery] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDownload = (entryCode: string) => {
    downloadCSV(entryCode)
    showToast(
      "Results file download started",
      "The evaluation results for this entry code are being downloaded as a CSV file.",
    )
  }

  const filteredResults = results.filter((result) => result.entryCode.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">평가 결과</h1>
          <p className="text-sm text-[#6B7280]">참가자 평가 결과를 조회하고 분석합니다.</p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Search Bar */}
        <div className="mb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="입장 코드를 검색하세요…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E5E5] bg-white px-12 shadow-sm">
          {/* Table Header */}
          <div className="grid shrink-0 grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-6 py-3 -mx-12">
            <span className="pl-12 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">입장 코드</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">총 인원</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">완료 인원</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">다운로드</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">상세 보기</span>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {filteredResults.map((result, index) => (
              <div
                key={result.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 -mx-12 ${
                  index !== filteredResults.length - 1 ? "border-b border-[#E5E5E5]" : ""
                }`}
              >
                <span className="pl-12 text-sm font-medium text-[#1A1A1A]">{result.entryCode}</span>
                <span className="text-center text-sm text-[#6B7280]">{result.total}</span>
                <span className="text-center text-sm text-[#6B7280]">{result.completed}</span>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleDownload(result.entryCode)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={2} />
                    다운로드
                  </button>
                </div>
                <div className="flex justify-center">
                  <Link
                    href={`/admin/results/${encodeURIComponent(result.entryCode)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#3B82F6]"
                  >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                    상세 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Footer */}
        {filteredResults.length > 0 && (
          <div className="mt-4 shrink-0 border-t border-[#E5E7EB] pt-4">
            <span className="text-sm text-[#6B7280]">
              총 {filteredResults.length}개의 결과 중 1–{filteredResults.length} 표시
            </span>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex w-[360px] items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
              <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A]">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
