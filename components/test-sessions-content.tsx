"use client"

import { useState } from "react"
import { Eye, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "next/navigation";

const initialTestSessions = [
  {
    id: 1,
    sessionId: "AVBE2024A",
    createdBy: "John Anderson",
    createdAt: "2024-01-15",
    status: "Active",
    participants: 18,
  },
  {
    id: 2,
    sessionId: "AVBE2024B",
    createdBy: "Sarah Mitchell",
    createdAt: "2024-01-14",
    status: "Completed",
    participants: 25,
  },
  {
    id: 3,
    sessionId: "AVBE2024C",
    createdBy: "Michael Chen",
    createdAt: "2024-01-13",
    status: "Completed",
    participants: 12,
  },
  {
    id: 4,
    sessionId: "AVBE2024D",
    createdBy: "Emily Davis",
    createdAt: "2024-01-12",
    status: "Active",
    participants: 30,
  },
  {
    id: 5,
    sessionId: "AVBE2024E",
    createdBy: "Robert Wilson",
    createdAt: "2024-01-11",
    status: "Completed",
    participants: 22,
  },
  {
    id: 6,
    sessionId: "AVBE2024F",
    createdBy: "Jennifer Brown",
    createdAt: "2024-01-10",
    status: "Active",
    participants: 15,
  },
  {
    id: 7,
    sessionId: "AVBE2024G",
    createdBy: "David Martinez",
    createdAt: "2024-01-09",
    status: "Completed",
    participants: 28,
  },
  {
    id: 8,
    sessionId: "AVBE2024H",
    createdBy: "Lisa Thompson",
    createdAt: "2024-01-08",
    status: "Active",
    participants: 19,
  },
  {
    id: 9,
    sessionId: "AVBE2024I",
    createdBy: "James Garcia",
    createdAt: "2024-01-07",
    status: "Completed",
    participants: 24,
  },
  {
    id: 10,
    sessionId: "AVBE2024J",
    createdBy: "Amanda Rodriguez",
    createdAt: "2024-01-06",
    status: "Active",
    participants: 16,
  },
  {
    id: 11,
    sessionId: "AVBE2024K",
    createdBy: "Christopher Lee",
    createdAt: "2024-01-05",
    status: "Completed",
    participants: 21,
  },
  {
    id: 12,
    sessionId: "AVBE2024L",
    createdBy: "Michelle White",
    createdAt: "2024-01-04",
    status: "Active",
    participants: 27,
  },
  {
    id: 13,
    sessionId: "AVBE2024M",
    createdBy: "Daniel Harris",
    createdAt: "2024-01-03",
    status: "Completed",
    participants: 14,
  },
  {
    id: 14,
    sessionId: "AVBE2024N",
    createdBy: "Stephanie Clark",
    createdAt: "2024-01-02",
    status: "Active",
    participants: 32,
  },
  {
    id: 15,
    sessionId: "AVBE2024O",
    createdBy: "Kevin Lewis",
    createdAt: "2024-01-01",
    status: "Completed",
    participants: 20,
  },
  {
    id: 16,
    sessionId: "AVBE2024P",
    createdBy: "Nicole Walker",
    createdAt: "2023-12-31",
    status: "Active",
    participants: 23,
  },
  {
    id: 17,
    sessionId: "AVBE2024Q",
    createdBy: "Brian Hall",
    createdAt: "2023-12-30",
    status: "Completed",
    participants: 17,
  },
  {
    id: 18,
    sessionId: "AVBE2024R",
    createdBy: "Laura Allen",
    createdAt: "2023-12-29",
    status: "Active",
    participants: 26,
  },
  {
    id: 19,
    sessionId: "AVBE2024S",
    createdBy: "Ryan Young",
    createdAt: "2023-12-28",
    status: "Completed",
    participants: 11,
  },
  {
    id: 20,
    sessionId: "AVBE2024T",
    createdBy: "Ashley King",
    createdAt: "2023-12-27",
    status: "Active",
    participants: 29,
  },
  {
    id: 21,
    sessionId: "AVBE2024U",
    createdBy: "Jason Wright",
    createdAt: "2023-12-26",
    status: "Completed",
    participants: 13,
  },
  {
    id: 22,
    sessionId: "AVBE2024V",
    createdBy: "Kimberly Scott",
    createdAt: "2023-12-25",
    status: "Active",
    participants: 31,
  },
  {
    id: 23,
    sessionId: "AVBE2024W",
    createdBy: "Andrew Green",
    createdAt: "2023-12-24",
    status: "Completed",
    participants: 18,
  },
  {
    id: 24,
    sessionId: "AVBE2024X",
    createdBy: "Rebecca Adams",
    createdAt: "2023-12-23",
    status: "Active",
    participants: 22,
  },
  {
    id: 25,
    sessionId: "AVBE2024Y",
    createdBy: "Timothy Baker",
    createdAt: "2023-12-22",
    status: "Completed",
    participants: 25,
  },
  {
    id: 26,
    sessionId: "AVBE2024Z",
    createdBy: "Melissa Nelson",
    createdAt: "2023-12-21",
    status: "Active",
    participants: 19,
  },
  {
    id: 27,
    sessionId: "AVBE2025A",
    createdBy: "Brandon Carter",
    createdAt: "2023-12-20",
    status: "Completed",
    participants: 24,
  },
  {
    id: 28,
    sessionId: "AVBE2025B",
    createdBy: "Samantha Mitchell",
    createdAt: "2023-12-19",
    status: "Active",
    participants: 16,
  },
  {
    id: 29,
    sessionId: "AVBE2025C",
    createdBy: "Justin Perez",
    createdAt: "2023-12-18",
    status: "Completed",
    participants: 28,
  },
  {
    id: 30,
    sessionId: "AVBE2025D",
    createdBy: "Heather Roberts",
    createdAt: "2023-12-17",
    status: "Active",
    participants: 21,
  },
  {
    id: 31,
    sessionId: "AVBE2025E",
    createdBy: "Tyler Turner",
    createdAt: "2023-12-16",
    status: "Completed",
    participants: 15,
  },
  {
    id: 32,
    sessionId: "AVBE2025F",
    createdBy: "Megan Phillips",
    createdAt: "2023-12-15",
    status: "Active",
    participants: 27,
  },
]

type TestSession = {
  id: number
  sessionId: string
  createdBy: string
  createdAt: string
  status: string
  participants: number
}

type Participant = {
  id: number
  name: string
  phoneNumber: string
  connectionStatus: "Connected" | "Disconnected"
  submissionStatus: "Submitted" | "In Progress" | "Not Started"
  tokenUsage: number
}

const generateParticipants = (count: number): Participant[] => {
  const names = [
    "Alice Johnson",
    "Bob Smith",
    "Carol Williams",
    "David Brown",
    "Emma Davis",
    "Frank Miller",
    "Grace Wilson",
    "Henry Moore",
    "Ivy Taylor",
    "Jack Anderson",
    "Karen Thomas",
    "Leo Jackson",
    "Mia White",
    "Noah Harris",
    "Olivia Martin",
    "Paul Garcia",
    "Quinn Martinez",
    "Rachel Robinson",
    "Sam Clark",
    "Tina Lewis",
    "Uma Lee",
    "Victor Walker",
    "Wendy Hall",
    "Xavier Allen",
    "Yuki Young",
    "Zara King",
    "Aaron Wright",
    "Bella Scott",
    "Chris Green",
    "Diana Adams",
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length],
    phoneNumber: `+82 10-${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    connectionStatus: Math.random() > 0.2 ? "Connected" : "Disconnected",
    submissionStatus: Math.random() > 0.6 ? "Submitted" : Math.random() > 0.3 ? "In Progress" : "Not Started",
    tokenUsage: Math.floor(8000 + Math.random() * 12000),
  }))
}

interface TestSessionsContentProps {
  onViewDetails?: (session: TestSession) => void
}

export function TestSessionsContent({ onViewDetails }: TestSessionsContentProps) {
  const [testSessions, setTestSessions] = useState<TestSession[]>(initialTestSessions)
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)
  const [isDeleteSessionOpen, setIsDeleteSessionOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsSession, setDetailsSession] = useState<TestSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantPage, setParticipantPage] = useState(1)
  const participantPageSize = 10

  const filteredSessions =
    statusFilter === "All" ? testSessions : testSessions.filter((session) => session.status === statusFilter)

  const totalSessions = filteredSessions.length
  const totalPages = Math.ceil(totalSessions / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalSessions)
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex)

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleOpenDeleteSession = (session: TestSession) => {
    setSelectedSession(session)
    setIsDeleteSessionOpen(true)
  }

  const handleConfirmDeleteSession = () => {
    if (!selectedSession) return
    setTestSessions((prev) => prev.filter((session) => session.id !== selectedSession.id))
    setIsDeleteSessionOpen(false)
    setSelectedSession(null)
  }

  const handleViewDetails = (session: TestSession) => {
    if (onViewDetails) {
      onViewDetails(session);
    }
  };

  const totalParticipants = participants.length
  const totalParticipantPages = Math.ceil(totalParticipants / participantPageSize)
  const participantStartIndex = (participantPage - 1) * participantPageSize
  const participantEndIndex = Math.min(participantStartIndex + participantPageSize, totalParticipants)
  const paginatedParticipants = participants.slice(participantStartIndex, participantEndIndex)

  const submittedCount = participants.filter((p) => p.submissionStatus === "Submitted").length
  const avgTokenUsage =
    participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + p.tokenUsage, 0) / participants.length)
      : 0

  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">진행 중</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">완료</Badge>
  }

  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col gap-4 p-6" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Page Header */}
      <div>
        <h1
          className="text-gray-900"
          style={{
            fontSize: "24px",
            fontWeight: 600,
            lineHeight: "32px",
          }}
        >
          테스트 세션
        </h1>
        <p
          className="text-gray-500 mt-1"
          style={{
            fontSize: "14px",
            fontWeight: 400,
          }}
        >
          플랫폼의 모든 테스트 세션을 관리하고 모니터링합니다.
        </p>
      </div>

      {/* Main Card */}
      <Card className="flex-1 flex flex-col border border-gray-200 shadow-sm">
        <CardHeader className="py-3 px-6 flex flex-row items-center justify-between">
          <CardTitle
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            모든 테스트 세션
          </CardTitle>
          {/* Filter Dropdown */}
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px] h-9 border-[#E5E5E5]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">전체</SelectItem>
              <SelectItem value="Active">진행 중</SelectItem>
              <SelectItem value="Completed">완료</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-0 px-6 pb-4 flex-1 flex flex-col">
          <ScrollArea style={{ height: "520px" }}>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="border-b border-[#E5E5E5]">
                  <TableHead
                    className="text-[#6B7280]"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "160px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    세션 ID
                  </TableHead>
                  <TableHead
                    className="text-[#6B7280]"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "200px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    생성자
                  </TableHead>
                  <TableHead
                    className="text-[#6B7280] text-center"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "140px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    생성일
                  </TableHead>
                  <TableHead
                    className="text-[#6B7280] text-center"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "120px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    상태
                  </TableHead>
                  <TableHead
                    className="text-[#6B7280] text-center"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "140px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    참가자
                  </TableHead>
                  <TableHead
                    className="text-[#6B7280] text-center"
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      width: "80px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    작업
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session) => (
                  <TableRow key={session.id} className="border-b border-[#E5E5E5]">
                    <TableCell
                      className="text-[#1A1A1A]"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        width: "160px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {session.sessionId}
                    </TableCell>
                    <TableCell
                      className="text-[#1A1A1A]"
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        width: "200px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {session.createdBy}
                    </TableCell>
                    <TableCell
                      className="text-[#6B7280] text-center"
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        width: "140px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {session.createdAt}
                    </TableCell>
                    <TableCell className="text-center" style={{ width: "120px" }}>
                      <Badge
                        variant="secondary"
                        className={
                          session.status === "Active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : session.status === "Cancelled"
                              ? "bg-red-100 text-red-700 hover:bg-red-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                        }}
                      >
                        {session.status === "Active" ? "진행 중" : session.status === "Completed" ? "완료" : session.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-[#6B7280] text-center"
                      style={{
                        fontSize: "14px",
                        fontWeight: 400,
                        width: "140px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {session.participants}명
                    </TableCell>
                    <TableCell className="text-center" style={{ width: "80px" }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => handleViewDetails(session)}
                          >
                            <Eye className="h-4 w-4" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                            onClick={() => handleOpenDeleteSession(session)}
                          >
                            <Trash2 className="h-4 w-4" />
                            세션 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div
            className="flex items-center justify-between pt-4 mt-auto border-t border-[#E5E5E5]"
            style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
          >
            <p className="text-[#6B7280]" style={{ fontSize: "14px", fontWeight: 400 }}>
              총 {totalSessions}개의 세션 중 {startIndex + 1}–{endIndex} 표시
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={
                    currentPage === page
                      ? "h-8 min-w-8 bg-blue-600 hover:bg-blue-700 text-white"
                      : "h-8 min-w-8 text-[#6B7280] hover:text-[#1A1A1A]"
                  }
                  style={{ fontSize: "14px", fontWeight: 500 }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteSessionOpen} onOpenChange={setIsDeleteSessionOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              테스트 세션 삭제
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              이 작업은 되돌릴 수 없습니다.
              <br />
              테스트 세션과 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-[#E5E5E5]">
                <p
                  className="text-[#1A1A1A]"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  }}
                >
                  {selectedSession.sessionId}
                </p>
                <p
                  className="text-[#6B7280]"
                  style={{
                    fontSize: "13px",
                    fontWeight: 400,
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  }}
                >
                  생성자: {selectedSession.createdBy} • {selectedSession.participants}명
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteSessionOpen(false)}
              style={{
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmDeleteSession}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              세션 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent
          side="right"
          className="w-[720px] max-w-full pt-6 px-8 pb-10 flex flex-col"
          style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
        >
          <SheetHeader className="space-y-1 items-start p-0 mb-6 text-left">
            <SheetTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
              테스트 세션 상세 정보
            </SheetTitle>
            <SheetDescription style={{ fontSize: "14px", color: "#6B7280" }}>
              이 테스트 세션의 전체 정보와 실시간 진행 상황을 확인하세요.
            </SheetDescription>
          </SheetHeader>

          <Card className="border border-[#E5E5E5] shadow-sm mb-6">
            <CardContent className="p-5">
              <div className="grid grid-cols-4 gap-6 mb-5">
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    세션 ID
                  </p>
                  <p className="text-sm" style={{ fontWeight: 500, color: "#1A1A1A" }}>
                    {detailsSession?.sessionId}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    생성자
                  </p>
                  <p className="text-sm" style={{ fontWeight: 400, color: "#1A1A1A" }}>
                    {detailsSession?.createdBy}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    생성일
                  </p>
                  <p className="text-sm" style={{ fontWeight: 400, color: "#1A1A1A" }}>
                    {detailsSession?.createdAt} 14:30:00
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    상태
                  </p>
                  <Badge
                    variant="secondary"
                    className={
                      detailsSession?.status === "Active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }
                    style={{ fontSize: "12px", fontWeight: 500 }}
                  >
                    {detailsSession?.status === "Active" ? "진행 중" : detailsSession?.status === "Completed" ? "완료" : detailsSession?.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    참가자
                  </p>
                  <p className="text-sm" style={{ fontWeight: 400, color: "#1A1A1A" }}>
                    {detailsSession?.participants}명
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    제출
                  </p>
                  <p className="text-sm" style={{ fontWeight: 400, color: "#1A1A1A" }}>
                    {submittedCount}/{totalParticipants}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#6B7280]" style={{ fontWeight: 500 }}>
                    평균 토큰 사용량
                  </p>
                  <p className="text-sm" style={{ fontWeight: 400, color: "#1A1A1A" }}>
                    {avgTokenUsage.toLocaleString()} 토큰
                  </p>
                </div>
                <div></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">참가자</h3>
            <div className="flex-1 border border-[#E5E5E5] rounded-lg overflow-hidden flex flex-col">
              <ScrollArea className="flex-1" style={{ maxHeight: "340px" }}>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b border-[#E5E5E5] bg-[#F9FAFB]">
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "150px" }}
                      >
                        이름
                      </TableHead>
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "150px" }}
                      >
                        전화번호
                      </TableHead>
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "130px" }}
                      >
                        연결 상태
                      </TableHead>
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "130px" }}
                      >
                        제출 상태
                      </TableHead>
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "100px" }}
                      >
                        토큰 사용량
                      </TableHead>
                      <TableHead
                        className="text-[#6B7280]"
                        style={{ fontSize: "13px", fontWeight: 500, width: "80px" }}
                      >
                        작업
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParticipants.map((participant) => (
                      <TableRow key={participant.id} className="border-b border-[#E5E5E5]">
                        <TableCell className="text-[#1A1A1A]" style={{ fontSize: "14px", fontWeight: 500 }}>
                          {participant.name}
                        </TableCell>
                        <TableCell className="text-[#6B7280]" style={{ fontSize: "14px", fontWeight: 400 }}>
                          {participant.phoneNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              participant.connectionStatus === "Connected"
                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                : "bg-red-100 text-red-700 hover:bg-red-100"
                            }
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            {participant.connectionStatus === "Connected" ? "연결됨" : "연결 끊김"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              participant.submissionStatus === "Submitted"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                : participant.submissionStatus === "In Progress"
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                            }
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            {participant.submissionStatus === "Submitted" ? "제출됨" : participant.submissionStatus === "In Progress" ? "진행 중" : "시작 안 함"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#6B7280]" style={{ fontSize: "14px", fontWeight: 400 }}>
                          {participant.tokenUsage.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            style={{ fontSize: "13px", fontWeight: 500 }}
                          >
                            상세 보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalParticipantPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5E5] bg-white">
                  <p className="text-[#6B7280]" style={{ fontSize: "14px", fontWeight: 400 }}>
                    총 {totalParticipants}명의 참가자 중 {participantStartIndex + 1}–{participantEndIndex} 표시
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setParticipantPage((prev) => Math.max(prev - 1, 1))}
                      disabled={participantPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalParticipantPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={participantPage === page ? "default" : "ghost"}
                        size="sm"
                        className={
                          participantPage === page
                            ? "h-8 min-w-8 bg-blue-600 hover:bg-blue-700 text-white"
                            : "h-8 min-w-8 text-[#6B7280] hover:text-[#1A1A1A]"
                        }
                        style={{ fontSize: "14px", fontWeight: 500 }}
                        onClick={() => setParticipantPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setParticipantPage((prev) => Math.min(prev + 1, totalParticipantPages))}
                      disabled={participantPage === totalParticipantPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
export default TestSessionsContent;

