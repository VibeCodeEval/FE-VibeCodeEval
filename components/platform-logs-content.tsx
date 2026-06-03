"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { AdminPageHeader } from "@/components/admin-page-header"
import {
  getMasterActivityLogs,
  LoginFailedError,
  type MasterActivityLogEntry,
} from "@/lib/api/admin"
import {
  formatMasterActivityLogDateHeader,
  formatMasterActivityLogDateTime,
  getMasterActivityLogColors,
  getMasterActivityLogDateKey,
  getMasterActivityLogStatusLabel,
  mapMasterActivityLogFilterToType,
  MASTER_ACTIVITY_LOG_FILTER_OPTIONS,
} from "@/lib/master-activity-logs"

function groupLogsByDate(logs: MasterActivityLogEntry[]): Map<string, MasterActivityLogEntry[]> {
  const grouped = new Map<string, MasterActivityLogEntry[]>()
  logs.forEach((log) => {
    const date = getMasterActivityLogDateKey(log.createdAt)
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(log)
  })
  return grouped
}

export function PlatformLogsContent() {
  const [logs, setLogs] = useState<MasterActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedKeyword, setDebouncedKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("전체 상태")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(searchQuery.trim())
      setPage(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMasterActivityLogs({
        keyword: debouncedKeyword || undefined,
        type: mapMasterActivityLogFilterToType(statusFilter),
        page,
        size: 20,
      })
      setLogs(result.content)
      setTotalPages(result.totalPages)
    } catch (e) {
      console.error("Failed to load master activity logs", e)
      setLogs([])
      if (e instanceof LoginFailedError) {
        setError(e.message)
      } else {
        setError("로그를 불러오지 못했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [debouncedKeyword, statusFilter, page])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  const groupedLogs = groupLogsByDate(logs)
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex h-full flex-1 flex-col">
      <AdminPageHeader
        title="플랫폼 로그"
        description="관리자 가입 번호 발급, 관리자 가입, 계정 관리 등 마스터 활동 이력을 확인합니다."
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="로그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "14px",
                height: "40px",
              }}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-[180px]"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              {MASTER_ACTIVITY_LOG_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              padding: "40px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#9CA3AF" }}>로그를 불러오는 중...</span>
          </div>
        )}

        {!isLoading && error && (
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #FECACA",
              borderRadius: "12px",
              padding: "40px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#DC2626" }}>{error}</span>
          </div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              padding: "40px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#9CA3AF" }}>표시할 활동 로그가 없습니다.</span>
          </div>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <div className="relative">
            {sortedDates.map((date, dateIndex) => (
              <div key={date} className="mb-6">
                <div
                  className="mb-4"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {formatMasterActivityLogDateHeader(date)}
                </div>

                <div className="relative">
                  <div
                    className="absolute"
                    style={{
                      left: "7px",
                      top: "12px",
                      bottom: dateIndex === sortedDates.length - 1 ? "12px" : "0",
                      width: "2px",
                      backgroundColor: "#E5E5E5",
                    }}
                  />

                  <div className="flex flex-col gap-3">
                    {groupedLogs.get(date)!.map((log) => {
                      const colors = getMasterActivityLogColors(log.type)
                      const label = getMasterActivityLogStatusLabel(log.type)
                      return (
                        <div key={log.id} className="flex gap-4">
                          <div
                            className="relative z-10 flex-shrink-0"
                            style={{ width: "16px", height: "16px", marginTop: "4px" }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: colors.marker,
                                border: "3px solid #FFFFFF",
                                boxShadow: `0 0 0 2px ${colors.marker}33`,
                              }}
                            />
                          </div>

                          <div
                            className="flex-1 transition-all duration-200 hover:shadow-md"
                            style={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E5E5",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                                {formatMasterActivityLogDateTime(log.createdAt)}
                              </span>
                              <span
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  padding: "4px 10px",
                                  borderRadius: "9999px",
                                }}
                              >
                                {label}
                              </span>
                            </div>
                            <div
                              className="mb-1"
                              style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}
                            >
                              {log.title}
                            </div>
                            <div style={{ fontSize: "14px", color: "#6B7280" }}>{log.message}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <span className="text-sm text-gray-500">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
