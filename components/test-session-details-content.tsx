"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link";
import { getBoard, formatBoardSubmissionLabelKo, type ExamineeBoardEntry } from "@/lib/api/admin";
import { adminParticipantEvaluationHref } from "@/lib/paths/admin-participant-evaluation";

// Participant type
type Participant = {
  id: number
  name: string
  phoneNumber: string
  connectionStatus: string
  /** 제출 레코드 존재 여부 (요약 통계용) */
  hasSubmission: boolean
  /** 제출·채점 상태 표시 문구 */
  submissionStatusLabel: string
  tokenUsage: number
}

interface TestSessionDetailsContentProps {
  session: {
    id: number
    sessionId: string
    createdBy: string
    createdAt: string
    status: string
    participants: number
  }
  onBack: () => void
}

export default function TestSessionDetailsContent({ session, onBack }: TestSessionDetailsContentProps) {
  const router = useRouter()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const board = await getBoard(session.id);
      const mapped: Participant[] = board.map((p: ExamineeBoardEntry) => ({
        id: p.examParticipantId,
        name: p.name,
        phoneNumber: p.phoneMasked,
        connectionStatus: p.state === "ENTRANCE" ? "Connected" : "Pending",
        hasSubmission: p.submitted,
        submissionStatusLabel: formatBoardSubmissionLabelKo(p),
        tokenUsage: p.tokenUsed || 0,
      }));
      setParticipants(mapped);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
    // 30초마다 자동 갱신 (실시간성 확보)
    const timer = setInterval(fetchParticipants, 30000);
    return () => clearInterval(timer);
  }, [session.id]);

  // Pagination calculations
  const totalPages = participants.length > 0 ? Math.ceil(participants.length / itemsPerPage) : 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentParticipants = participants.slice(startIndex, endIndex)

  // Calculate summary stats
  const submissions = participants.filter((p) => p.hasSubmission).length
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

  const getConnectionBadge = (status: string) => {
    if (status === "Connected") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">연결됨</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기 중</Badge>
  }

  const getSubmissionBadge = (label: string) => {
    if (label === "시작 안 함") {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">시작 안 함</Badge>
    }
    if (label === "진행 중") {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">진행 중</Badge>
    }
    if (label === "제출 실패") {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">제출 실패</Badge>
    }
    if (label.startsWith("채점 완료")) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{label}</Badge>
    }
    if (label === "제출·채점 중") {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{label}</Badge>
    }
    if (label === "제출됨") {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">제출됨</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{label}</Badge>
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] p-6 gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors w-fit"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          테스트 세션으로 돌아가기
        </button>

        {/* Title and Subtitle */}
        <div className="mt-2">
          <h1
            className="text-gray-900"
            style={{
              fontSize: "24px",
              fontWeight: 600,
              lineHeight: "32px",
            }}
          >
            테스트 세션 상세 정보
          </h1>
          <p
            className="text-gray-500 mt-1"
            style={{
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            이 테스트 세션의 전체 정보와 실시간 진행 상황을 확인하세요.
          </p>
        </div>
      </div>

      {/* Session Overview Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="py-4 px-6">
          <CardTitle
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            세션 개요
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">세션 ID</p>
              <p className="text-sm font-medium text-gray-900">{session.sessionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">생성자</p>
              <p className="text-sm font-medium text-gray-900">{session.createdBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">생성일</p>
              <p className="text-sm font-medium text-gray-900">{session.createdAt}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">상태</p>
              <div className="mt-0.5">{getStatusBadge(session.status)}</div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">참가자</p>
              <p className="text-sm font-medium text-gray-900">{session.participants}명</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">제출</p>
              <p className="text-sm font-medium text-gray-900">
                {submissions}/{session.participants}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">평균 토큰 사용량</p>
              <p className="text-sm font-medium text-gray-900">{avgTokenUsage.toLocaleString()} 토큰</p>
            </div>
            <div></div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Card */}
      <Card className="border border-gray-200 shadow-sm flex-1 flex flex-col">
        <CardHeader className="py-4 px-6">
          <div>
            <CardTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              참가자
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">이 테스트 세션에 등록된 모든 참가자입니다.</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col">
          {/* Participants Table */}
          <div className="flex-1">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "180px" }}>이름</TableHead>
                  <TableHead style={{ width: "160px" }}>전화번호</TableHead>
                  <TableHead style={{ width: "140px" }} className="text-center">
                    연결 상태
                  </TableHead>
                  <TableHead style={{ width: "140px" }} className="text-center">
                    제출 상태
                  </TableHead>
                  <TableHead style={{ width: "120px" }} className="text-center">
                    토큰 사용량
                  </TableHead>
                  <TableHead style={{ width: "100px" }} className="text-right">
                    작업
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium" style={{ width: "180px", fontSize: "14px", color: "#1A1A1A" }}>
                      {participant.name}
                    </TableCell>
                    <TableCell style={{ width: "160px", fontSize: "14px", color: "#6B7280" }}>
                      {participant.phoneNumber}
                    </TableCell>
                    <TableCell style={{ width: "140px" }} className="text-center">
                      {getConnectionBadge(participant.connectionStatus)}
                    </TableCell>
                    <TableCell style={{ width: "140px" }} className="text-center">
                      {getSubmissionBadge(participant.submissionStatusLabel)}
                    </TableCell>
                    <TableCell style={{ width: "120px", fontSize: "14px", color: "#6B7280" }} className="text-center">
                      {participant.tokenUsage.toLocaleString()}
                    </TableCell>
                    <TableCell style={{ width: "100px" }} className="text-right">
                      <Link
                        href={adminParticipantEvaluationHref({
                          resultsSegment: session.id,
                          participantId: participant.id,
                          from: "master",
                          participantName: participant.name,
                          sessionId: session.id,
                        })}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 h-8"
                          style={{ fontSize: "14px", fontWeight: 500 }}
                        >
                          상세 보기
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                총 {participants.length}명의 참가자 중 {startIndex + 1}–{Math.min(endIndex, participants.length)} 표시
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 ${
                      currentPage === page
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
