"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

type LogType = "Admin Activity" | "System" | "Error"
type BadgeType = "System Updated" | "Error" | "Admin Change" | "Evaluation Completed" | "Room Started"

type LogEntry = {
  id: number
  date: string
  timestamp: string
  type: LogType
  title: string
  description: string
  badge: BadgeType
}

const initialLogs: LogEntry[] = [
  // 2025-01-08
  {
    id: 1,
    date: "2025-01-08",
    timestamp: "2025-01-08 10:45",
    type: "System",
    title: "Evaluation batch completed.",
    description: "Automated scoring completed for 24 submissions in session TS-2025-0892.",
    badge: "Evaluation Completed",
  },
  {
    id: 2,
    date: "2025-01-08",
    timestamp: "2025-01-08 09:30",
    type: "Admin Activity",
    title: "New test room started.",
    description: "Test session TS-2025-0893 initiated by admin.master@example.com with 18 participants.",
    badge: "Room Started",
  },
  {
    id: 3,
    date: "2025-01-08",
    timestamp: "2025-01-08 08:15",
    type: "System",
    title: "Daily backup completed.",
    description: "Automated daily backup of all test sessions and user data completed successfully.",
    badge: "System Updated",
  },
  // 2025-01-07
  {
    id: 4,
    date: "2025-01-07",
    timestamp: "2025-01-07 18:30",
    type: "Admin Activity",
    title: "Platform settings updated.",
    description: "Updated session timeout configuration for all active test sessions.",
    badge: "Admin Change",
  },
  {
    id: 5,
    date: "2025-01-07",
    timestamp: "2025-01-07 18:20",
    type: "System",
    title: "System maintenance completed.",
    description: "Automated cleanup of expired test sessions completed successfully.",
    badge: "System Updated",
  },
  {
    id: 6,
    date: "2025-01-07",
    timestamp: "2025-01-07 17:55",
    type: "Admin Activity",
    title: "Data retention policy updated.",
    description: "Log retention set to 30 days and submission storage set to 90 days.",
    badge: "Admin Change",
  },
  {
    id: 7,
    date: "2025-01-07",
    timestamp: "2025-01-07 14:00",
    type: "System",
    title: "Evaluation batch completed.",
    description: "Automated scoring completed for 32 submissions in session TS-2025-0891.",
    badge: "Evaluation Completed",
  },
  // 2025-01-06
  {
    id: 8,
    date: "2025-01-06",
    timestamp: "2025-01-06 16:45",
    type: "Error",
    title: "Database connection error.",
    description: "Backup service temporarily failed to connect. Retry scheduled.",
    badge: "Error",
  },
  {
    id: 9,
    date: "2025-01-06",
    timestamp: "2025-01-06 15:10",
    type: "System",
    title: "New evaluation model deployed.",
    description: "Updated AI scoring model for coding tests across all sessions.",
    badge: "System Updated",
  },
  {
    id: 10,
    date: "2025-01-06",
    timestamp: "2025-01-06 11:20",
    type: "Admin Activity",
    title: "New test room started.",
    description: "Test session TS-2025-0890 initiated by admin.kim@example.com with 25 participants.",
    badge: "Room Started",
  },
  // 2025-01-05
  {
    id: 11,
    date: "2025-01-05",
    timestamp: "2025-01-05 11:30",
    type: "Admin Activity",
    title: "Master account created for new organization.",
    description: "New enterprise tenant onboarded with default global settings.",
    badge: "Admin Change",
  },
  {
    id: 12,
    date: "2025-01-05",
    timestamp: "2025-01-05 09:00",
    type: "System",
    title: "Scheduled maintenance completed.",
    description: "Database optimization and index rebuild completed successfully.",
    badge: "System Updated",
  },
  {
    id: 13,
    date: "2025-01-05",
    timestamp: "2025-01-05 08:30",
    type: "Error",
    title: "API rate limit exceeded.",
    description: "External evaluation API temporarily unavailable due to rate limiting. Auto-retry enabled.",
    badge: "Error",
  },
  // 2025-01-04
  {
    id: 14,
    date: "2025-01-04",
    timestamp: "2025-01-04 17:00",
    type: "System",
    title: "Evaluation batch completed.",
    description: "Automated scoring completed for 45 submissions in session TS-2025-0889.",
    badge: "Evaluation Completed",
  },
  {
    id: 15,
    date: "2025-01-04",
    timestamp: "2025-01-04 14:30",
    type: "Admin Activity",
    title: "Global token limit updated.",
    description: "Default token limit changed from 50,000 to 75,000 tokens per session.",
    badge: "Admin Change",
  },
  {
    id: 16,
    date: "2025-01-04",
    timestamp: "2025-01-04 10:15",
    type: "Admin Activity",
    title: "New test room started.",
    description: "Test session TS-2025-0889 initiated by admin.park@example.com with 30 participants.",
    badge: "Room Started",
  },
]

const getDotColor = (type: LogType) => {
  switch (type) {
    case "Admin Activity":
      return "#3B82F6" // blue
    case "System":
      return "#9CA3AF" // gray
    case "Error":
      return "#EF4444" // red
  }
}

const getBadgeStyle = (badge: BadgeType) => {
  switch (badge) {
    case "Admin Change":
      return {
        backgroundColor: "#EFF6FF",
        color: "#3B82F6",
      }
    case "System Updated":
      return {
        backgroundColor: "#F3F4F6",
        color: "#6B7280",
      }
    case "Error":
      return {
        backgroundColor: "#FEF2F2",
        color: "#EF4444",
      }
    case "Evaluation Completed":
      return {
        backgroundColor: "#ECFDF5",
        color: "#10B981",
      }
    case "Room Started":
      return {
        backgroundColor: "#F5F3FF",
        color: "#7C3AED",
      }
  }
}

const getBadgeText = (badge: BadgeType): string => {
  switch (badge) {
    case "Admin Change":
      return "관리자 변경"
    case "System Updated":
      return "시스템 업데이트"
    case "Error":
      return "오류"
    case "Evaluation Completed":
      return "평가 완료"
    case "Room Started":
      return "세션 시작"
    default:
      return badge
  }
}

const getLogTitle = (title: string): string => {
  const titleMap: { [key: string]: string } = {
    "Evaluation batch completed.": "평가 배치 완료",
    "New test room started.": "새 테스트 세션 시작",
    "Daily backup completed.": "일일 백업 완료",
    "Platform settings updated.": "플랫폼 설정 업데이트",
    "System maintenance completed.": "시스템 유지보수 완료",
    "Data retention policy updated.": "데이터 보관 정책 업데이트",
    "Database connection error.": "데이터베이스 연결 오류",
    "New evaluation model deployed.": "새 평가 모델 배포",
    "Scheduled maintenance completed.": "예약된 유지보수 완료",
    "API rate limit exceeded.": "API 요청 한도 초과",
    "Global token limit updated.": "전역 토큰 제한 업데이트",
    "Master account created for new organization.": "새 조직의 마스터 계정 생성",
  }
  return titleMap[title] || title
}

const getLogDescription = (description: string): string => {
  const descMap: { [key: string]: string } = {
    "Automated scoring completed for 24 submissions in session TS-2025-0892.": "세션 TS-2025-0892에서 24건의 제출물에 대한 자동 채점이 완료되었습니다.",
    "Test session TS-2025-0893 initiated by admin.master@example.com with 18 participants.": "admin.master@example.com이 18명의 참가자로 테스트 세션 TS-2025-0893을 시작했습니다.",
    "Automated daily backup of all test sessions and user data completed successfully.": "모든 테스트 세션 및 사용자 데이터의 자동 일일 백업이 성공적으로 완료되었습니다.",
    "Updated session timeout configuration for all active test sessions.": "모든 활성 테스트 세션의 세션 타임아웃 설정이 업데이트되었습니다.",
    "Automated cleanup of expired test sessions completed successfully.": "만료된 테스트 세션의 자동 정리가 성공적으로 완료되었습니다.",
    "Log retention set to 30 days and submission storage set to 90 days.": "로그 보관 기간이 30일로, 제출물 저장 기간이 90일로 설정되었습니다.",
    "Automated scoring completed for 32 submissions in session TS-2025-0891.": "세션 TS-2025-0891에서 32건의 제출물에 대한 자동 채점이 완료되었습니다.",
    "Backup service temporarily failed to connect. Retry scheduled.": "백업 서비스 연결이 일시적으로 실패했습니다. 재시도가 예약되었습니다.",
    "Updated AI scoring model for coding tests across all sessions.": "모든 세션의 코딩 테스트용 AI 채점 모델이 업데이트되었습니다.",
    "Test session TS-2025-0890 initiated by admin.kim@example.com with 25 participants.": "admin.kim@example.com이 25명의 참가자로 테스트 세션 TS-2025-0890을 시작했습니다.",
    "New enterprise tenant onboarded with default global settings.": "기본 전역 설정으로 새 엔터프라이즈 테넌트가 온보딩되었습니다.",
    "Database optimization and index rebuild completed successfully.": "데이터베이스 최적화 및 인덱스 재구성이 성공적으로 완료되었습니다.",
    "External evaluation API temporarily unavailable due to rate limiting. Auto-retry enabled.": "요청 한도로 인해 외부 평가 API가 일시적으로 사용 불가능합니다. 자동 재시도가 활성화되었습니다.",
    "Automated scoring completed for 45 submissions in session TS-2025-0889.": "세션 TS-2025-0889에서 45건의 제출물에 대한 자동 채점이 완료되었습니다.",
    "Default token limit changed from 50,000 to 75,000 tokens per session.": "세션당 기본 토큰 제한이 50,000에서 75,000으로 변경되었습니다.",
    "Test session TS-2025-0889 initiated by admin.park@example.com with 30 participants.": "admin.park@example.com이 30명의 참가자로 테스트 세션 TS-2025-0889을 시작했습니다.",
  }
  return descMap[description] || description
}

// Group logs by date
const groupLogsByDate = (logs: LogEntry[]) => {
  const grouped: { [key: string]: LogEntry[] } = {}
  logs.forEach((log) => {
    if (!grouped[log.date]) {
      grouped[log.date] = []
    }
    grouped[log.date].push(log)
  })
  return grouped
}

export function PlatformLogsContent() {
  const [logs] = useState<LogEntry[]>(initialLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`
  }

  const filteredLogs = logs.filter((log) => {
    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "admin" && log.type !== "Admin Activity") return false
      if (typeFilter === "system" && log.type !== "System") return false
      if (typeFilter === "error" && log.type !== "Error") return false
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return log.title.toLowerCase().includes(query) || log.description.toLowerCase().includes(query)
    }
    return true
  })

  const groupedLogs = groupLogsByDate(filteredLogs)
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a))

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
          플랫폼 로그
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#6B7280",
            lineHeight: "20px",
          }}
        >
          플랫폼 전역의 시스템 활동 로그를 확인하고 모니터링합니다.
        </p>
      </div>

      {/* Search Bar and Filters Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar */}
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

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="w-[160px]"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <SelectValue placeholder="전체 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="admin">관리자 활동</SelectItem>
              <SelectItem value="system">시스템</SelectItem>
              <SelectItem value="error">오류</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px]"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <SelectValue placeholder="최근 24시간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">최근 24시간</SelectItem>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="all">전체 기간</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedDates.map((date, dateIndex) => (
          <div key={date} className="mb-6">
            {/* Date Label */}
            <div
              className="mb-4"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1A1A1A",
                letterSpacing: "-0.01em",
              }}
            >
              {formatDate(date)}
            </div>

            {/* Timeline Events for this date */}
            <div className="relative">
              {/* Vertical Timeline Line */}
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

              {/* Log Events */}
              <div className="flex flex-col gap-3">
                {groupedLogs[date].map((log, logIndex) => (
                  <div key={log.id} className="flex gap-4">
                    {/* Timeline Dot */}
                    <div
                      className="relative z-10 flex-shrink-0"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginTop: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: getDotColor(log.type),
                          border: "3px solid #FFFFFF",
                          boxShadow: "0 0 0 2px " + getDotColor(log.type) + "33",
                        }}
                      />
                    </div>

                    {/* Event Card */}
                    <div
                      className="flex-1 transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E5E5",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                      }}
                    >
                      {/* Top Row: Timestamp + Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "#9CA3AF",
                            lineHeight: "16px",
                          }}
                        >
                          {log.timestamp}
                        </span>
                        <span
                          style={{
                            ...getBadgeStyle(log.badge),
                            fontSize: "12px",
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            lineHeight: "16px",
                          }}
                        >
                          {getBadgeText(log.badge)}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="mb-1">
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            lineHeight: "20px",
                          }}
                        >
                          {getLogTitle(log.title)}
                        </span>
                      </div>

                      {/* Description */}
                      <div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 400,
                            color: "#6B7280",
                            lineHeight: "20px",
                          }}
                        >
                          {getLogDescription(log.description)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              borderRadius: "12px",
              padding: "40px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "#9CA3AF",
              }}
            >
              선택한 필터에 해당하는 로그가 없습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
