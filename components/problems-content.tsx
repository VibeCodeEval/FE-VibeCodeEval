"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

interface Problem {
  id: string
  title: string
  version: string
  difficulty: "Easy" | "Medium" | "Hard"
  available: boolean
}

const initialProblems: Problem[] = [
  { id: "1", title: "String Compression", version: "v1.2", difficulty: "Medium", available: true },
  { id: "2", title: "Median of Two Sorted Arrays", version: "v2.0", difficulty: "Hard", available: false },
  { id: "3", title: "Longest Substring Without Repeating", version: "v1.5", difficulty: "Medium", available: true },
  { id: "4", title: "Regular Expression Matching", version: "v1.1", difficulty: "Hard", available: true },
  { id: "5", title: "Two Sum", version: "v3.0", difficulty: "Easy", available: false },
]

type FilterOption = "All" | "Available Only" | "Unavailable Only"

function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-[#D1FAE5] text-[#059669]",
    Medium: "bg-[#FEF3C7] text-[#D97706]",
    Hard: "bg-[#FEE2E2] text-[#DC2626]",
  }
  return <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + styles[difficulty]}>{difficulty}</span>
}

export function ProblemsContent() {
  const [problems, setProblems] = useState<Problem[]>(initialProblems)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterOption>("All")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const filteredProblems = useMemo(() => {
    let result = problems

    if (searchQuery.trim()) {
      result = result.filter((problem) => problem.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (filter === "Available Only") {
      result = result.filter((problem) => problem.available)
    } else if (filter === "Unavailable Only") {
      result = result.filter((problem) => !problem.available)
    }

    return result
  }, [problems, searchQuery, filter])

  const totalPages = Math.ceil(filteredProblems.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = currentPage * pageSize
  const visibleProblems = filteredProblems.slice(startIndex, endIndex)

  const displayStart = filteredProblems.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(endIndex, filteredProblems.length)

  const handleToggleAvailability = (id: string) => {
    setProblems((prev) =>
      prev.map((problem) => (problem.id === id ? { ...problem, available: !problem.available } : problem)),
    )
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (value: FilterOption) => {
    setFilter(value)
    setCurrentPage(1)
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Problem Management</h1>
          <p className="text-sm text-[#6B7280]">
            Manage which coding problems are available for upcoming test sessions.
          </p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Top Controls */}
        <div className="mb-4 flex items-center justify-between">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search Problem…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 w-72 rounded-lg border border-[#E5E5E5] bg-white pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E5E5] bg-white px-4 text-sm text-[#1A1A1A] transition-colors hover:bg-[#F9FAFB]">
                {filter}
                <ChevronDown className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleFilterChange("All")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("Available Only")}>Available Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("Unavailable Only")}>
                Unavailable Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {visibleProblems.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-sm text-[#9CA3AF] shadow-sm">
              No problems found
            </div>
          ) : (
            visibleProblems.map((problem) => (
              <div
                key={problem.id}
                className="rounded-xl border border-[#E5E5E5] bg-white px-6 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Card Top Row: Title, Version, Difficulty */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#1A1A1A]">{problem.title}</h3>
                      <span className="text-sm text-[#9CA3AF]">{problem.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                  </div>

                  {/* Toggle Section */}
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        (problem.available ? "bg-[#E0EDFF] text-[#3B82F6]" : "bg-[#F3F4F6] text-[#6B7280]")
                      }
                    >
                      {problem.available ? "Available" : "Unavailable"}
                    </span>
                    <Switch
                      checked={problem.available}
                      onCheckedChange={() => handleToggleAvailability(problem.id)}
                      className="data-[state=checked]:bg-[#3B82F6]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredProblems.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-sm text-[#6B7280]">
              Showing {displayStart}–{displayEnd} of {filteredProblems.length} Problems
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors " +
                    (page === currentPage
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#E0EDFF]")
                  }
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
