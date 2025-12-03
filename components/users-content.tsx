"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type ConnectionStatus = "Connected" | "Pending"
type SubmissionStatus = "Not Started" | "In Progress" | "Submitted"

interface Participant {
  id: string
  name: string
  phone: string
  connectionStatus: ConnectionStatus
  submissionStatus: SubmissionStatus
  tokenUsage: number
}

const initialParticipants: Participant[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "Submitted",
    tokenUsage: 1250,
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "In Progress",
    tokenUsage: 890,
  },
  {
    id: "3",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Pending",
    submissionStatus: "Not Started",
    tokenUsage: 0,
  },
  {
    id: "4",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "In Progress",
    tokenUsage: 1450,
  },
  {
    id: "5",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "Not Started",
    tokenUsage: 0,
  },
  {
    id: "6",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Pending",
    submissionStatus: "Not Started",
    tokenUsage: 0,
  },
  {
    id: "7",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "Submitted",
    tokenUsage: 1120,
  },
  {
    id: "8",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "In Progress",
    tokenUsage: 760,
  },
  {
    id: "9",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Pending",
    submissionStatus: "Not Started",
    tokenUsage: 0,
  },
  {
    id: "10",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "Submitted",
    tokenUsage: 1340,
  },
  {
    id: "11",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Pending",
    submissionStatus: "Not Started",
    tokenUsage: 0,
  },
  {
    id: "12",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "In Progress",
    tokenUsage: 815,
  },
  {
    id: "13",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "Submitted",
    tokenUsage: 980,
  },
  {
    id: "14",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    connectionStatus: "Connected",
    submissionStatus: "In Progress",
    tokenUsage: 1025,
  },
]

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const isConnected = status === "Connected"
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isConnected ? "border-[#3B82F6] bg-white text-[#3B82F6]" : "border-[#6B7280] bg-white text-[#6B7280]"
      }`}
    >
      {status}
    </span>
  )
}

function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const styles = {
    "Not Started": "bg-[#F3F4F6] text-[#6B7280]",
    "In Progress": "bg-[#E0EDFF] text-[#3B82F6]",
    Submitted: "bg-[#DCFCE7] text-[#16A34A]",
  }

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>
}

export function UsersContent() {
  const [participants] = useState<Participant[]>(initialParticipants)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  const totalPages = Math.ceil(participants.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = currentPage * pageSize
  const visibleParticipants = participants.slice(startIndex, endIndex)

  const displayStart = participants.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(endIndex, participants.length)

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Participants</h1>
          <p className="text-sm text-[#6B7280]">Real-time monitoring of test participants</p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Table Container */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid shrink-0 grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Name</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Phone Number</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Connection</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Submission</span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Token Usage</span>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {visibleParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={`grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 ${
                  index !== visibleParticipants.length - 1 ? "border-b border-[#E5E5E5]" : ""
                }`}
              >
                <span className="text-sm font-medium text-[#1A1A1A]">{participant.name}</span>
                <span className="text-sm text-[#6B7280]">{participant.phone}</span>
                <div className="flex justify-center">
                  <ConnectionBadge status={participant.connectionStatus} />
                </div>
                <div className="flex justify-center">
                  <SubmissionBadge status={participant.submissionStatus} />
                </div>
                <span className="text-right text-sm font-medium text-[#1A1A1A]">
                  {participant.tokenUsage.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {participants.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            <span className="text-sm text-[#6B7280]">
              Showing {displayStart}–{displayEnd} of {participants.length} Participants
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
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                    page === currentPage
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#E0EDFF]"
                  }`}
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
