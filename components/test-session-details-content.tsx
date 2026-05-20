"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { getBoard, getExams, formatBoardSubmissionLabelKo, type Exam } from "@/lib/api/admin"
import { masterParticipantEvaluationHref } from "@/lib/paths/master-participant-evaluation"
import { AdminPageHeader } from "@/components/admin-page-header"
import {
  getExamDisplayDate,
  getMasterSessionStatusLabel,
  mapExamToTestSession,
  mapMasterParticipantExamStatus,
} from "@/lib/master-test-sessions"

type Participant = {
  id: number
  name: string
  phoneNumber: string
  examStatus: string
  hasSubmission: boolean
  submissionStatusLabel: string
  tokenUsage: number
}

interface TestSessionDetailsContentProps {
  examId: number | null
  onBack: () => void
}

export default function TestSessionDetailsContent({ examId, onBack }: TestSessionDetailsContentProps) {
  const [exam, setExam] = useState<Exam | null>(null)
  const [examLoading, setExamLoading] = useState(true)
  const [examError, setExamError] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsError, setParticipantsError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadExam = useCallback(async () => {
    if (examId == null) {
      setExam(null)
      setExamLoading(false)
      setExamError(false)
      return
    }

    setExamLoading(true)
    setExamError(false)
    try {
      const exams = await getExams()
      const found = exams.find((e) => e.id === examId) ?? null
      setExam(found)
      if (!found) setExamError(true)
    } catch (e) {
      console.error("[TestSessionDetails] Failed to load exam:", e)
      setExam(null)
      setExamError(true)
    } finally {
      setExamLoading(false)
    }
  }, [examId])

  const loadParticipants = useCallback(async () => {
    if (examId == null || !Number.isFinite(examId) || examId <= 0) {
      setParticipants([])
      return
    }

    setParticipantsLoading(true)
    setParticipantsError(false)
    try {
      const board = await getBoard(examId)
      const examState = exam?.state
      const mapped: Participant[] = board.map((p) => {
        const submissionStatusLabel = formatBoardSubmissionLabelKo(p)
        return {
          id: p.examParticipantId,
          name: p.name || "-",
          phoneNumber: p.phoneMasked || "-",
          examStatus: mapMasterParticipantExamStatus(examState, {
            submitted: p.submitted,
            submissionStatus: p.submissionStatus,
            submissionStatusLabel,
            state: p.state,
          }),
          hasSubmission: p.submitted === true,
          submissionStatusLabel,
          tokenUsage: p.tokenUsed ?? 0,
        }
      })
      setParticipants(mapped)
    } catch (e) {
      console.error("[TestSessionDetails] Failed to fetch board:", e)
      setParticipants([])
      setParticipantsError(true)
    } finally {
      setParticipantsLoading(false)
    }
  }, [examId, exam?.state])

  useEffect(() => {
    void loadExam()
  }, [loadExam])

  useEffect(() => {
    if (exam && examId != null) {
      void loadParticipants()
      const timer = setInterval(() => {
        void loadParticipants()
      }, 30000)
      return () => clearInterval(timer)
    }
    return undefined
  }, [exam, examId, loadParticipants])

  if (examId == null) {
    return (
      <div className="flex h-full flex-1 flex-col">
        <AdminPageHeader
          title="테스트 세션 상세 정보"
          description="이 테스트 세션의 전체 정보와 실시간 진행 상황을 확인하세요."
        />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-[#6B7280]">세션을 찾을 수 없습니다.</p>
        </main>
      </div>
    )
  }

  const sessionMeta = exam ? mapExamToTestSession(exam) : null
  const statusLabel = exam ? getMasterSessionStatusLabel(exam.state) : "-"
  const displaySessionId = sessionMeta?.sessionId ?? "-"
  const displayCreatedAt = exam ? getExamDisplayDate(exam) : "-"
  const participantTotal = exam?.participantCount ?? participants.length
  const submissions = participants.filter((p) => p.hasSubmission).length
  const avgTokenUsage =
    participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + p.tokenUsage, 0) / participants.length)
      : 0

  const totalPages = participants.length > 0 ? Math.ceil(participants.length / itemsPerPage) : 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentParticipants = participants.slice(startIndex, endIndex)

  const getStatusBadge = (label: string) => {
    if (label === "진행 중") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">진행 중</Badge>
    }
    if (label === "대기 중") {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기 중</Badge>
    }
    if (label === "완료") {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">완료</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{label}</Badge>
  }

  const getExamStatusBadge = (status: string) => {
    if (status === "종료됨") {
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">종료됨</Badge>
    }
    if (status === "응시 완료") {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">응시 완료</Badge>
    }
    if (status === "응시 중") {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">응시 중</Badge>
    }
    if (status === "대기 중") {
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">대기 중</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{status}</Badge>
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

  const getPageNumbers = () => {
    const pages: number[] = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AdminPageHeader
        title="테스트 세션 상세 정보"
        description="이 테스트 세션의 전체 정보와 실시간 진행 상황을 확인하세요."
      />

      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#4B5563]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          테스트 세션으로 돌아가기
        </button>

        {examLoading ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">세션 정보를 불러오는 중…</p>
        ) : examError || !exam ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">세션을 찾을 수 없습니다.</p>
        ) : (
          <>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="px-6 py-4">
                <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
                  세션 개요
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="mb-6 grid grid-cols-4 gap-6">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">세션 ID</p>
                    <p className="text-sm font-medium text-gray-900">{displaySessionId}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">생성자</p>
                    <p className="text-sm font-medium text-gray-900">Admin</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">생성일</p>
                    <p className="text-sm font-medium text-gray-900">{displayCreatedAt}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">상태</p>
                    <div className="mt-0.5">{getStatusBadge(statusLabel)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">참가자</p>
                    <p className="text-sm font-medium text-gray-900">{participantTotal}명</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">제출</p>
                    <p className="text-sm font-medium text-gray-900">
                      {participantsError ? "–" : `${submissions}/${participantTotal}`}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-500">평균 토큰 사용량</p>
                    <p className="text-sm font-medium text-gray-900">
                      {participantsError ? "–" : `${avgTokenUsage.toLocaleString()} 토큰`}
                    </p>
                  </div>
                  <div />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-1 flex-col border border-gray-200 shadow-sm">
              <CardHeader className="px-6 py-4">
                <div>
                  <CardTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
                    참가자
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    이 테스트 세션에 등록된 모든 참가자입니다.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-6 pb-6 pt-0">
                {participantsError ? (
                  <p className="py-8 text-center text-sm text-[#DC2626]">
                    참가자 정보를 불러오지 못했습니다.
                  </p>
                ) : participantsLoading && participants.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6B7280]">
                    참가자 목록을 불러오는 중…
                  </p>
                ) : participants.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#6B7280]">
                    등록된 참가자가 없습니다.
                  </p>
                ) : (
                  <>
                    <div className="flex-1">
                      <Table className="w-full table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead style={{ width: "180px" }}>이름</TableHead>
                            <TableHead style={{ width: "160px" }}>전화번호</TableHead>
                            <TableHead style={{ width: "140px" }} className="text-center">
                              응시 상태
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
                              <TableCell
                                className="font-medium"
                                style={{ width: "180px", fontSize: "14px", color: "#1A1A1A" }}
                              >
                                {participant.name}
                              </TableCell>
                              <TableCell style={{ width: "160px", fontSize: "14px", color: "#6B7280" }}>
                                {participant.phoneNumber}
                              </TableCell>
                              <TableCell style={{ width: "140px" }} className="text-center">
                                {getExamStatusBadge(participant.examStatus)}
                              </TableCell>
                              <TableCell style={{ width: "140px" }} className="text-center">
                                {getSubmissionBadge(participant.submissionStatusLabel)}
                              </TableCell>
                              <TableCell
                                style={{ width: "120px", fontSize: "14px", color: "#6B7280" }}
                                className="text-center"
                              >
                                {participant.tokenUsage.toLocaleString()}
                              </TableCell>
                              <TableCell style={{ width: "100px" }} className="text-right">
                                <Link
                                  href={masterParticipantEvaluationHref({
                                    examId: examId!,
                                    participantId: participant.id,
                                    participantName: participant.name,
                                  })}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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

                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between border-t pt-4">
                        <p className="text-sm text-gray-500">
                          총 {participants.length}명의 참가자 중 {startIndex + 1}–
                          {Math.min(endIndex, participants.length)} 표시
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
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
