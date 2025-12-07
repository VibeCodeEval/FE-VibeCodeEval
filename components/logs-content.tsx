"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"

type LogStatus = "Room Created" | "Room Started" | "Evaluation Completed" | "Room Ended"

interface LogEntry {
  id: number
  timestamp: string
  status: LogStatus
  entryCode: string
  message: string
}

const initialLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: "2025-01-07 18:30",
    status: "Room Ended",
    entryCode: "AV4B203A",
    message: "The test session has ended.",
  },
  {
    id: 2,
    timestamp: "2025-01-07 18:20",
    status: "Evaluation Completed",
    entryCode: "AV4B203A",
    message: "Scoring process finished successfully.",
  },
  {
    id: 3,
    timestamp: "2025-01-07 18:10",
    status: "Room Started",
    entryCode: "AV4B203A",
    message: "The test session has officially started.",
  },
  {
    id: 4,
    timestamp: "2025-01-07 17:55",
    status: "Room Created",
    entryCode: "AV4B203A",
    message: "New room created with entry code AV4B203A.",
  },
  {
    id: 5,
    timestamp: "2025-01-06 16:45",
    status: "Room Ended",
    entryCode: "AV3C102B",
    message: "The test session has ended.",
  },
  {
    id: 6,
    timestamp: "2025-01-06 16:30",
    status: "Evaluation Completed",
    entryCode: "AV3C102B",
    message: "Scoring process finished successfully.",
  },
  {
    id: 7,
    timestamp: "2025-01-06 15:20",
    status: "Room Started",
    entryCode: "AV3C102B",
    message: "The test session has officially started.",
  },
  {
    id: 8,
    timestamp: "2025-01-06 15:00",
    status: "Room Created",
    entryCode: "AV3C102B",
    message: "New room created with entry code AV3C102B.",
  },
  {
    id: 9,
    timestamp: "2025-01-05 14:30",
    status: "Room Ended",
    entryCode: "AV2A501C",
    message: "The test session has ended.",
  },
  {
    id: 10,
    timestamp: "2025-01-05 14:00",
    status: "Evaluation Completed",
    entryCode: "AV2A501C",
    message: "Scoring process finished successfully.",
  },
]

const statusColors: Record<LogStatus, { bg: string; text: string; marker: string }> = {
  "Room Created": { bg: "#EBF0FA", text: "#4A74E0", marker: "#4A74E0" },
  "Room Started": { bg: "#F0EBFA", text: "#7A5AF8", marker: "#7A5AF8" },
  "Evaluation Completed": { bg: "#E8F5EF", text: "#4AA785", marker: "#4AA785" },
  "Room Ended": { bg: "#FBEAEC", text: "#D6455D", marker: "#D6455D" },
}

const statusOptions = ["All Status", "Room Created", "Room Started", "Evaluation Completed", "Room Ended"]

function getDateFromTimestamp(timestamp: string): string {
  return timestamp.split(" ")[0]
}

function groupLogsByDate(logs: LogEntry[]): Map<string, LogEntry[]> {
  const grouped = new Map<string, LogEntry[]>()
  logs.forEach((log) => {
    const date = getDateFromTimestamp(log.timestamp)
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(log)
  })
  return grouped
}

export function LogsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.entryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All Status" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedLogs = groupLogsByDate(filteredLogs)
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex h-full flex-1 flex-col">
    {/* Top Header Bar */}
    <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Logs</h1>
        <p className="text-sm text-[#6B7280]">
          Monitor real-time events and API activity during test sessions.
        </p>
      </div>
    </header>


      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col min-h-0 shadow-sm">
          {/* Search and Filter Section */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[180px] justify-between"
              >
                <span>{statusFilter}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {statusOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setStatusFilter(option)
                        setIsDropdownOpen(false)
                      }}
                      className={
                        "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg " +
                        (statusFilter === option ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700")
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5" style={{ backgroundColor: "#D9D9D9" }} />

              <div className="space-y-2">
                {sortedDates.map((date, dateIndex) => (
                  <div key={date}>
                    <div className={dateIndex === 0 ? "mb-4" : "mt-8 mb-4"}>
                      <div className="flex items-center gap-6">
                        {/* Spacer for timeline alignment */}
                        <div className="w-6 shrink-0" />
                        {/* Date label */}
                        <span className="text-sm font-semibold text-gray-500">{date}</span>
                      </div>
                    </div>

                    {/* Logs for this date */}
                    <div className="space-y-4">
                      {groupedLogs.get(date)!.map((log) => (
                        <div key={log.id} className="relative flex items-start gap-6">
                          <div
                            className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "#F5F5F5" }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: statusColors[log.status].marker }}
                            />
                          </div>

                          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-[#F9FAFB] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                            {/* Top Row: Timestamp and Status Badge */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-400">{log.timestamp}</span>
                              <span
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor: statusColors[log.status].bg,
                                  color: statusColors[log.status].text,
                                }}
                              >
                                {log.status}
                              </span>
                            </div>

                            {/* Entry Code */}
                            <div className="mb-1">
                              <span className="text-sm text-gray-500">Entry Code: </span>
                              <span className="text-sm font-medium text-gray-900">{log.entryCode}</span>
                            </div>

                            {/* Message */}
                            <p className="text-sm text-gray-600">{log.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">No logs found matching your criteria.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
