"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ChevronDown } from "lucide-react"
import {
  getAdminActivityLogs,
  LoginFailedError,
  type AdminActivityLogEntry,
} from "@/lib/api/admin"
import {
  adminActivityLogStatusColors,
  formatActivityLogDateTime,
  getActivityLogDateKey,
  getActivityLogStatusLabel,
  mapActivityLogFilterToType,
} from "@/lib/admin-activity-logs"

const statusOptions = ["전체 상태", "방 생성", "시험 시작", "평가 완료", "시험 종료"]

function groupLogsByDate(logs: AdminActivityLogEntry[]): Map<string, AdminActivityLogEntry[]> {
  const grouped = new Map<string, AdminActivityLogEntry[]>()
  logs.forEach((log) => {
    const date = getActivityLogDateKey(log.createdAt)
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(log)
  })
  return grouped
}

export function LogsContent() {
  const [logs, setLogs] = useState<AdminActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedKeyword, setDebouncedKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("전체 상태")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAdminActivityLogs({
        keyword: debouncedKeyword || undefined,
        type: mapActivityLogFilterToType(statusFilter),
        page: 0,
        size: 20,
      })
      setLogs(result.content)
    } catch (e) {
      console.error("Failed to load admin activity logs", e)
      setLogs([])
      if (e instanceof LoginFailedError) {
        setError(e.message)
      } else {
        setError("로그를 불러오지 못했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [debouncedKeyword, statusFilter])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  const groupedLogs = groupLogsByDate(logs)
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">로그</h1>
          <p className="text-sm text-[#6B7280]">
            시험 세션 중 발생하는 실시간 이벤트와 API 활동을 모니터링합니다.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col min-h-0 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
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

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">로그를 불러오는 중...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-0.5" style={{ backgroundColor: "#D9D9D9" }} />

                <div className="space-y-2">
                  {sortedDates.map((date, dateIndex) => (
                    <div key={date}>
                      <div className={dateIndex === 0 ? "mb-4" : "mt-8 mb-4"}>
                        <div className="flex items-center gap-6">
                          <div className="w-6 shrink-0" />
                          <span className="text-sm font-semibold text-gray-500">{date}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {groupedLogs.get(date)!.map((log) => {
                          const statusLabel = getActivityLogStatusLabel(log.type)
                          const colors = adminActivityLogStatusColors[statusLabel]
                          return (
                            <div key={log.id} className="relative flex items-start gap-6">
                              <div
                                className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "#F5F5F5" }}
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: colors.marker }}
                                />
                              </div>

                              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-[#F9FAFB] hover:-translate-y-0.5 transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-gray-400">
                                    {formatActivityLogDateTime(log.createdAt)}
                                  </span>
                                  <span
                                    className="px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                      backgroundColor: colors.bg,
                                      color: colors.text,
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>

                                <p className="text-sm font-medium text-gray-900 mb-1">{log.title}</p>
                                <p className="text-sm text-gray-600">{log.message}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">조건에 맞는 로그가 없습니다.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
