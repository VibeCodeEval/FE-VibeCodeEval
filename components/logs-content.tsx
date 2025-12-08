"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"

type LogStatus = "방 생성" | "시험 시작" | "평가 완료" | "시험 종료"

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
    status: "시험 종료",
    entryCode: "AV4B203A",
    message: "시험 세션이 종료되었습니다.",
  },
  {
    id: 2,
    timestamp: "2025-01-07 18:20",
    status: "평가 완료",
    entryCode: "AV4B203A",
    message: "채점 과정이 성공적으로 완료되었습니다.",
  },
  {
    id: 3,
    timestamp: "2025-01-07 18:10",
    status: "시험 시작",
    entryCode: "AV4B203A",
    message: "시험 세션이 시작되었습니다.",
  },
  {
    id: 4,
    timestamp: "2025-01-07 17:55",
    status: "방 생성",
    entryCode: "AV4B203A",
    message: "시험 방 생성됨",
  },
  {
    id: 5,
    timestamp: "2025-01-06 16:45",
    status: "시험 종료",
    entryCode: "AV3C102B",
    message: "시험 세션이 종료되었습니다.",
  },
  {
    id: 6,
    timestamp: "2025-01-06 16:30",
    status: "평가 완료",
    entryCode: "AV3C102B",
    message: "채점 과정이 성공적으로 완료되었습니다.",
  },
  {
    id: 7,
    timestamp: "2025-01-06 15:20",
    status: "시험 시작",
    entryCode: "AV3C102B",
    message: "시험 세션이 시작되었습니다.",
  },
  {
    id: 8,
    timestamp: "2025-01-06 15:00",
    status: "방 생성",
    entryCode: "AV3C102B",
    message: "시험 방 생성됨",
  },
  {
    id: 9,
    timestamp: "2025-01-05 14:30",
    status: "시험 종료",
    entryCode: "AV2A501C",
    message: "시험 세션이 종료되었습니다.",
  },
  {
    id: 10,
    timestamp: "2025-01-05 14:00",
    status: "평가 완료",
    entryCode: "AV2A501C",
    message: "채점 과정이 성공적으로 완료되었습니다.",
  },
]

const statusColors: Record<LogStatus, { bg: string; text: string; marker: string }> = {
  "방 생성": { bg: "#EBF0FA", text: "#4A74E0", marker: "#4A74E0" },
  "시험 시작": { bg: "#F0EBFA", text: "#7A5AF8", marker: "#7A5AF8" },
  "평가 완료": { bg: "#E8F5EF", text: "#4AA785", marker: "#4AA785" },
  "시험 종료": { bg: "#FBEAEC", text: "#D6455D", marker: "#D6455D" },
}

const statusOptions = ["전체 상태", "방 생성", "시험 시작", "평가 완료", "시험 종료"]

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
  const [statusFilter, setStatusFilter] = useState("전체 상태")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.entryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "전체 상태" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const groupedLogs = groupLogsByDate(filteredLogs)
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex h-full flex-1 flex-col">
    {/* Top Header Bar */}
    <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">로그</h1>
        <p className="text-sm text-[#6B7280]">
          시험 세션 중 발생하는 실시간 이벤트와 API 활동을 모니터링합니다.
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
                placeholder="로그 검색…"
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
                              <span className="text-sm text-gray-500">입장 코드: </span>
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
                  <div className="text-center py-12 text-gray-400">조건에 맞는 로그가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
