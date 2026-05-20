"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Search, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AdminPageHeader } from "@/components/admin-page-header"
import { ProblemContentMdView } from "@/components/problem-content-md-view"
import { getProblems, getProblemDetail, type AdminProblem } from "@/lib/api/admin"
import {
  buildMasterProblemDetailFromApi,
  filterMasterProblems,
  mapAdminProblemToMasterListItem,
  type MasterProblemDetail,
  type MasterProblemListItem,
  type ProblemDifficultyKo,
} from "@/lib/master-problems"

function DifficultyBadge({ difficulty }: { difficulty: ProblemDifficultyKo }) {
  const styles = {
    쉬움: "bg-[#D1FAE5] text-[#059669]",
    중간: "bg-[#FEF3C7] text-[#D97706]",
    어려움: "bg-[#FEE2E2] text-[#DC2626]",
  }
  return (
    <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + styles[difficulty]}>
      {difficulty}
    </span>
  )
}

export function ProblemContent() {
  const [problems, setProblems] = useState<MasterProblemListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProblem, setSelectedProblem] = useState<MasterProblemDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(false)
  const [modalTitle, setModalTitle] = useState("문제 상세 정보")

  const fetchProblems = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const adminProblems = await getProblems()
      const mapped = adminProblems.map((p: AdminProblem) => mapAdminProblemToMasterListItem(p))
      setProblems(mapped)
    } catch (e) {
      console.error("[MasterProblem] Failed to fetch problems:", e)
      setProblems([])
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProblems()
  }, [fetchProblems])

  const filteredProblems = useMemo(
    () => filterMasterProblems(problems, searchQuery),
    [problems, searchQuery]
  )

  const handleViewDetail = async (problem: MasterProblemListItem) => {
    setModalTitle(problem.title)
    setIsModalOpen(true)
    setDetailLoading(true)
    setDetailError(false)
    setSelectedProblem(null)

    try {
      const detail = await getProblemDetail(problem.id)
      setSelectedProblem(buildMasterProblemDetailFromApi(problem, detail))
    } catch (e) {
      console.error("[MasterProblem] Failed to load detail:", e)
      setDetailError(true)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setSelectedProblem(null)
      setDetailError(false)
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AdminPageHeader
        title="문제 관리"
        description="플랫폼에서 사용되는 모든 문제를 검토하고 관리합니다."
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="문제 제목, 태그, 난이도 검색…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-lg border-[#E5E5E5] bg-white pl-10"
            style={{ fontSize: "14px", fontWeight: 400 }}
            disabled={isLoading && problems.length === 0}
          />
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-sm text-[#6B7280]">문제를 불러오는 중…</p>
        ) : loadError ? (
          <p className="py-12 text-center text-sm text-[#DC2626]">문제 목록을 불러오지 못했습니다.</p>
        ) : problems.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6B7280]">등록된 문제가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
                style={{ borderRadius: "12px" }}
                onClick={() => void handleViewDetail(problem)}
              >
                <div className="flex flex-1 flex-wrap items-start gap-8 lg:gap-12">
                  <div className="min-w-[240px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                      <span className="text-sm text-[#9CA3AF]">{problem.versionLabel}</span>
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                    {problem.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {problem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#E5E5E5] bg-[#F9FAFB] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-[120px] flex-col gap-0.5">
                    <span style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: "16px" }}>
                      마지막 업데이트
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A1A", lineHeight: "20px" }}>
                      {problem.lastUpdatedLabel}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleViewDetail(problem)
                  }}
                  className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  <Eye size={18} />
                  <span>상세 보기</span>
                </button>
              </div>
            ))}

            {filteredProblems.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <p style={{ fontSize: "14px" }}>검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-white p-0 [&>button]:top-6 [&>button]:right-6"
          style={{
            maxWidth: "1000px",
            width: "90vw",
            borderRadius: "14px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{modalTitle} 상세 정보</DialogTitle>
          </DialogHeader>

          {detailLoading && (
            <p className="p-8 text-center text-sm text-[#6B7280]">상세 정보를 불러오는 중…</p>
          )}

          {detailError && !detailLoading && (
            <p className="p-8 text-center text-sm text-[#DC2626]">문제 상세를 불러오지 못했습니다.</p>
          )}

          {selectedProblem && !detailLoading && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-[#E5E5E5] p-8 pb-4">
                <DialogHeader className="space-y-2 p-0">
                  <div className="flex flex-wrap items-center gap-2 pr-8">
                    <h2
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
                    </h2>
                    <span className="text-sm text-[#9CA3AF]">{selectedProblem.versionLabel}</span>
                    <DifficultyBadge difficulty={selectedProblem.difficulty} />
                  </div>
                  {selectedProblem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProblem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#E5E5E5] bg-[#F9FAFB] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "20px" }}>
                    마지막 업데이트: {selectedProblem.lastUpdatedLabel}
                    {selectedProblem.usable ? " · 사용 가능" : " · 사용 불가"}
                  </p>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-8 pt-4">
                <div className="flex flex-col gap-8">
                  <div
                    className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]"
                    style={{ padding: "24px" }}
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
                    <ProblemContentMdView
                      contentMd={selectedProblem.contentMd}
                      scrollable
                      maxHeight="min(50vh, 480px)"
                    />
                  </div>

                  {selectedProblem.restrictionsInfo !== "정보 없음" && (
                    <div>
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
                        제한 정보
                      </h4>
                      <p className="whitespace-pre-wrap text-sm text-[#374151]">
                        {selectedProblem.restrictionsInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
