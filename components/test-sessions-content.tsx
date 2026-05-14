"use client"

import { useState, useEffect } from "react"
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
import { deleteExam, getBoard, getExams, type Exam, type ExamineeBoardEntry, formatBoardSubmissionLabelKo } from "@/lib/api/admin";

function submissionBadgeClassName(label: string): string {
  if (label === "시작 안 함") return "bg-gray-100 text-gray-700 hover:bg-gray-100"
  if (label === "진행 중") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
  if (label === "제출 실패") return "bg-red-100 text-red-700 hover:bg-red-100"
  if (label.startsWith("채점 완료")) return "bg-green-100 text-green-700 hover:bg-green-100"
  if (label === "제출·채점 중") return "bg-amber-100 text-amber-800 hover:bg-amber-100"
  if (label === "제출됨") return "bg-blue-100 text-blue-700 hover:bg-blue-100"
  return "bg-gray-100 text-gray-700 hover:bg-gray-100"
}

export interface TestSession {
  id: number
  sessionId: string     // BE의 title을 sessionId로 매핑 (필요시)
  createdBy: string
  createdAt: string
  status: string
  participants: number
}

interface Participant {
  id: number
  name: string
  phoneNumber: string
  connectionStatus: string
  /** 제출 레코드 존재 */
  hasSubmission: boolean
  /** 표시용 한글 상태 */
  submissionStatusLabel: string
  tokenUsage: number
}

interface TestSessionsContentProps {
  onViewDetails?: (session: TestSession) => void
}

export function TestSessionsContent({ onViewDetails }: TestSessionsContentProps) {
  const [testSessions, setTestSessions] = useState<TestSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null)
  const [isDeleteSessionOpen, setIsDeleteSessionOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsSession, setDetailsSession] = useState<TestSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false)
  const [participantPage, setParticipantPage] = useState(1)
  const participantPageSize = 10

  // 1. 시험 목록 조회 (Exams)
  const fetchExams = async () => {
    setIsLoading(true)
    try {
      const exams = await getExams()
      const mapped: TestSession[] = exams.map((exam: Exam) => ({
        id: exam.id,
        sessionId: exam.title,
        createdBy: "Admin",
        createdAt: exam.startsAt ? exam.startsAt.split("T")[0] : "-",
        status: ["RUNNING", "IN_PROGRESS"].includes(exam.state) ? "Active" : "Completed",
        participants: exam.participantCount,
      }))
      setTestSessions(mapped)
    } catch (error) {
      console.error("Failed to fetch exams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 2. 특정 시험의 참가자 현황 조회 (Board)
  const fetchParticipants = async (examId: number) => {
    setIsParticipantsLoading(true)
    try {
      const board = await getBoard(examId)
      const mapped: Participant[] = board.map((participant: ExamineeBoardEntry) => ({
        id: participant.examParticipantId,
        name: participant.name,
        phoneNumber: participant.phoneMasked,
        connectionStatus: participant.state === "ENTRANCE" ? "Connected" : "Disconnected",
        hasSubmission: participant.submitted,
        submissionStatusLabel: formatBoardSubmissionLabelKo(participant),
        tokenUsage: participant.tokenUsed || 0,
      }))
      setParticipants(mapped)
    } catch (error) {
      console.error("Failed to fetch participants:", error)
    } finally {
      setIsParticipantsLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

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

  const handleConfirmDeleteSession = async () => {
    if (!selectedSession) return
    
    try {
      await deleteExam(selectedSession.id)
      setTestSessions((prev) => prev.filter((session) => session.id !== selectedSession.id))
    } catch (error) {
      console.error("Failed to delete exam:", error)
    } finally {
      setIsDeleteSessionOpen(false)
      setSelectedSession(null)
    }
  }

  const handleViewDetailsAction = (session: TestSession) => {
    setDetailsSession(session);
    setIsDetailsOpen(true);
    fetchParticipants(session.id);
    if (onViewDetails) {
      onViewDetails(session);
    }
  };

  const totalParticipants = participants.length
  const totalParticipantPages = Math.ceil(totalParticipants / participantPageSize)
  const participantStartIndex = (participantPage - 1) * participantPageSize
  const participantEndIndex = Math.min(participantStartIndex + participantPageSize, totalParticipants)
  const paginatedParticipants = participants.slice(participantStartIndex, participantEndIndex)

  const submittedCount = participants.filter((p) => p.hasSubmission).length
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
    if (totalPages === 0) return [1];
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
                            onClick={() => handleViewDetailsAction(session)}
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
                            className={submissionBadgeClassName(participant.submissionStatusLabel)}
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            {participant.submissionStatusLabel}
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
