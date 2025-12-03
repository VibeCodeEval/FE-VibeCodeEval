"use client"

import { useState } from "react"
import { Copy, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type EntryCodeStatus = "Not Started" | "In Progress"

interface EntryCode {
  id: string
  code: string
  createdAt: string
  status: EntryCodeStatus
}

const initialEntryCodes: EntryCode[] = [
  { id: "1", code: "AIVIBE2024A", createdAt: "2024-01-15", status: "Not Started" },
  { id: "2", code: "AIVIBE2024B", createdAt: "2024-01-16", status: "Not Started" },
  { id: "3", code: "AIVIBE2024C", createdAt: "2024-01-17", status: "Not Started" },
  { id: "4", code: "AIVIBE2024D", createdAt: "2024-01-18", status: "Not Started" },
]

function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `AVIBE2024${suffix}`
}

function getTodayDate(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

function StatusBadge({ status }: { status: EntryCodeStatus }) {
  const isInProgress = status === "In Progress"
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs ${
        isInProgress ? "bg-[#E0EDFF] font-semibold text-[#3B82F6]" : "bg-[#F3F4F6] font-medium text-[#6B7280]"
      }`}
    >
      {status}
    </span>
  )
}

export function EntryCodesContent() {
  const [entryCodes, setEntryCodes] = useState<EntryCode[]>(initialEntryCodes)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [startTestModalOpen, setStartTestModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const totalPages = Math.ceil(entryCodes.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = currentPage * pageSize
  const visibleEntryCodes = entryCodes.slice(startIndex, endIndex)

  // Display values (1-based for UI)
  const displayStart = entryCodes.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(endIndex, entryCodes.length)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleDeleteClick = (id: string, code: string) => {
    setSelectedId(id)
    setSelectedCode(code)
    setDeleteModalOpen(true)
  }

  const handleStartTestClick = (id: string, code: string) => {
    setSelectedId(id)
    setSelectedCode(code)
    setStartTestModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedId) {
      setEntryCodes((prev) => {
        const newList = prev.filter((entry) => entry.id !== selectedId)
        const newTotalPages = Math.ceil(newList.length / pageSize)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        } else if (newList.length === 0) {
          setCurrentPage(1)
        }
        return newList
      })
    }
    setDeleteModalOpen(false)
    setSelectedId(null)
    setSelectedCode(null)
  }

  const handleConfirmGenerate = () => {
    const newEntry: EntryCode = {
      id: crypto.randomUUID(),
      code: generateUniqueCode(),
      createdAt: getTodayDate(),
      status: "Not Started",
    }
    setEntryCodes((prev) => {
      const newList = [...prev, newEntry]
      const newTotalPages = Math.ceil(newList.length / pageSize)
      setCurrentPage(newTotalPages)
      return newList
    })
    setGenerateModalOpen(false)
  }

  const handleConfirmStartTest = () => {
    if (selectedId) {
      setEntryCodes((prev) =>
        prev.map((entry) => (entry.id === selectedId ? { ...entry, status: "In Progress" } : entry)),
      )
    }
    setStartTestModalOpen(false)
    setSelectedId(null)
    setSelectedCode(null)
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Entry Codes</h1>
          <p className="text-sm text-[#6B7280]">Manage access codes for test participants</p>
        </div>
        <button
          onClick={() => setGenerateModalOpen(true)}
          className="rounded-full bg-[#3B82F6] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
        >
          Generate Code
        </button>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {visibleEntryCodes.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-6 py-4 shadow-sm"
            >
              {/* Left side: Code, Copy icon, Timestamp, Status Badge */}
              <div className="flex items-center gap-4">
                <span className="text-base font-semibold text-[#1A1A1A]">{entry.code}</span>
                <button
                  onClick={() => handleCopy(entry.code)}
                  className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <span className="text-xs text-[#9CA3AF]">Created: {entry.createdAt}</span>
                <StatusBadge status={entry.status} />
              </div>

              {/* Right side: Start Test button, More menu */}
              <div className="flex items-center gap-3">
                {entry.status === "In Progress" ? (
                  <span className="rounded-full border border-[#3B82F6] bg-[#E0EDFF] px-4 py-1.5 text-sm font-medium text-[#3B82F6]">
                    In Progress
                  </span>
                ) : (
                  <button
                    onClick={() => handleStartTestClick(entry.id, entry.code)}
                    className="rounded-full border border-[#3B82F6] bg-white px-4 py-1.5 text-sm font-medium text-[#3B82F6] transition-colors hover:bg-[#E0EDFF]"
                  >
                    Start Test &gt;
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]">
                      <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => handleCopy(entry.code)}>Copy</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(entry.id, entry.code)}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {entryCodes.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            {/* Left side: Showing X-Y of N */}
            <span className="text-sm text-[#6B7280]">
              Showing {displayStart}–{displayEnd} of {entryCodes.length} Entry Codes
            </span>

            {/* Right side: Pagination controls */}
            <div className="flex items-center gap-1">
              {/* Prev button */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                    page === currentPage
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#E0EDFF]"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next button */}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>입장 코드를 삭제하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {
                "선택된 Entry Code를 삭제하면 되돌릴 수 없습니다.\n해당 코드와 연관된 참여자 데이터는 유지되지만,\n입장용 코드는 더 이상 사용할 수 없습니다."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              코드 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Code Confirmation Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 Entry Code를 생성하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {
                "새로운 Entry Code가 생성되며 참여자에게 제공할 수 있습니다.\n생성된 코드는 Entry Codes 목록에 자동으로 추가됩니다."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmGenerate}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Test Confirmation Modal */}
      <Dialog open={startTestModalOpen} onOpenChange={setStartTestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험을 시작하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {"이 Entry Code에 해당하는 시험 세션이 활성화됩니다.\n참여자들은 즉시 시험에 입장할 수 있습니다."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setStartTestModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmStartTest}>시험 시작</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
