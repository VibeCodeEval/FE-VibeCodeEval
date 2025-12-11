"use client"

import { useState, useEffect } from "react"
import { Copy, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createExam, getExams, createEntryCode, deleteExam, getEntryCodes, startExam, endExam, Exam, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"


// 시험 날짜/시간 포맷팅 함수
const formatExamDateTime = (value: string): string => {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

// 시험 상태를 한글 라벨로 변환
const getExamStateLabel = (state: string): string => {
  switch (state) {
    case "WAITING":
      return "대기 중"
    case "RUNNING":
    case "IN_PROGRESS": // 하위 호환성
      return "진행 중"
    case "ENDED":
    case "COMPLETED": // 하위 호환성
      return "종료"
    default:
      return state
  }
}

export function EntryCodesContent() {

  // 시험 생성 모달 상태
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false)
  const [examTitle, setExamTitle] = useState("")
  const [examStartsAt, setExamStartsAt] = useState("")
  const [examEndsAt, setExamEndsAt] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 시험 조회 상태
  const [exams, setExams] = useState<Exam[] | null>(null)
  const [isLoadingExams, setIsLoadingExams] = useState(false)
  const [examError, setExamError] = useState<string | null>(null)

  // 시험 시작 모달 상태
  const [isStartExamModalOpen, setIsStartExamModalOpen] = useState(false)
  const [selectedExamForStart, setSelectedExamForStart] = useState<Exam | null>(null)

  // 시험 삭제 모달 상태
  const [isDeleteExamModalOpen, setIsDeleteExamModalOpen] = useState(false)
  const [selectedExamForDelete, setSelectedExamForDelete] = useState<Exam | null>(null)
  const [isDeletingExam, setIsDeletingExam] = useState(false)

  // 시험 시작 로딩 상태
  const [isStartingExam, setIsStartingExam] = useState(false)

  // 시험 종료 모달 상태
  const [isEndExamModalOpen, setIsEndExamModalOpen] = useState(false)
  const [selectedExamForEnd, setSelectedExamForEnd] = useState<Exam | null>(null)
  const [isEndingExam, setIsEndingExam] = useState(false)

  const { toast } = useToast()

  // 시험 목록 페이지네이션
  const [currentExamPage, setCurrentExamPage] = useState(1)
  const examPageSize = 8

  const examTotalPages = exams ? Math.ceil(exams.length / examPageSize) : 0
  const examStartIndex = (currentExamPage - 1) * examPageSize
  const examEndIndex = currentExamPage * examPageSize
  const visibleExams = exams ? exams.slice(examStartIndex, examEndIndex) : []

  // 시험 목록 Display values (1-based for UI)
  const examDisplayStart = exams && exams.length > 0 ? examStartIndex + 1 : 0
  const examDisplayEnd = exams ? Math.min(examEndIndex, exams.length) : 0

  // 시험 조회 핸들러
  const handleFetchExams = async () => {
    try {
      setIsLoadingExams(true)
      setExamError(null)
      
      // 1. 시험 목록 가져오기
      const examsData = await getExams()
      
      // 2. 각 시험에 대해 입장 코드 가져오기 (병렬 처리)
      const examsWithEntryCodes = await Promise.all(
        examsData.map(async (exam) => {
          try {
            // 각 시험의 입장 코드 목록 가져오기
            const entryCodes = await getEntryCodes(exam.id)
            // 첫 번째 활성 입장 코드를 사용하거나, 없으면 첫 번째 코드 사용
            const activeEntryCode = entryCodes.find((ec) => ec.isActive) || entryCodes[0]
            return {
              ...exam,
              entryCode: activeEntryCode?.code || undefined,
            }
          } catch (entryCodeError) {
            // 입장 코드 조회 실패 시 해당 시험의 입장 코드는 undefined로 유지
            console.warn(`Failed to fetch entry codes for exam ${exam.id}:`, entryCodeError)
            return {
              ...exam,
              entryCode: undefined,
            }
          }
        })
      )
      
      setExams(examsWithEntryCodes)
      // 시험 목록을 새로 가져올 때 페이지를 1로 리셋
      setCurrentExamPage(1)
    } catch (error) {
      console.error("Failed to fetch exams", error)
      if (error instanceof LoginFailedError) {
        setExamError(error.message)
        toast({
          title: "시험 목록 조회 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        setExamError(error.message)
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setExamError("시험 목록을 불러오는 데 실패했습니다.")
        toast({
          title: "오류",
          description: "시험 목록을 불러오는 데 실패했습니다.",
          variant: "destructive",
        })
      }
      // 에러 발생 시에도 기존 데이터는 유지
    } finally {
      setIsLoadingExams(false)
    }
  }

  // 페이지 로드 시 자동으로 시험 목록 조회
  useEffect(() => {
    handleFetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 시험 생성 핸들러
  const handleCreateExam = async () => {
    // 입력값 검증
    if (!examTitle.trim() || !examStartsAt || !examEndsAt) {
      toast({
        title: "입력 오류",
        description: "제목, 시작 시각, 종료 시각을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    // 시작 시각이 종료 시각보다 이전인지 확인
    if (new Date(examStartsAt) >= new Date(examEndsAt)) {
      toast({
        title: "입력 오류",
        description: "종료 시각은 시작 시각보다 이후여야 합니다.",
        variant: "destructive",
      })
      return
    }

    // datetime-local 형식 ("YYYY-MM-DDTHH:mm")을 백엔드 형식 ("YYYY-MM-DDTHH:mm:ss")으로 변환
    const normalizeDateTime = (value: string): string => {
      if (value && value.length === 16) {
        return `${value}:00`
      }
      return value
    }

    const payload = {
      title: examTitle.trim(),
      startsAt: normalizeDateTime(examStartsAt),
      endsAt: normalizeDateTime(examEndsAt),
    }

    setIsSubmitting(true)
    try {
      const createdExam = await createExam(payload)
      console.log("Exam created:", createdExam)

      // 시험 생성 후 자동으로 입장 코드 생성
      let entryCodeValue: string | undefined = undefined
      try {
        const entryCodeResponse = await createEntryCode({
          label: undefined,
          examId: createdExam.id,
          problemSetId: 0,
          expiresAt: undefined,
          maxUses: 0,
        })
        entryCodeValue = entryCodeResponse.code
        console.log("Entry code created:", entryCodeValue)
      } catch (entryCodeError) {
        console.error("Failed to create entry code", entryCodeError)
        // 입장 코드 생성 실패해도 시험 생성은 성공으로 처리
        toast({
          title: "입장 코드 생성 실패",
          description: "시험은 생성되었지만 입장 코드 생성에 실패했습니다. 나중에 수동으로 생성해주세요.",
          variant: "destructive",
        })
      }

      // 입장 코드가 포함된 시험 객체 생성
      const examWithEntryCode: Exam = {
        ...createdExam,
        entryCode: entryCodeValue,
      }

      // 시험 목록에 새로 생성된 시험 추가
      setExams((prev) => {
        if (prev === null) {
          return [examWithEntryCode]
        }
        return [examWithEntryCode, ...prev]
      })

      // 모달 닫기
      setIsCreateExamOpen(false)

      // 폼 필드 초기화
      setExamTitle("")
      setExamStartsAt("")
      setExamEndsAt("")

      // 성공 토스트 표시
      toast({
        title: "시험 생성 성공",
        description: `"${createdExam.title}" 시험이 성공적으로 생성되었습니다.`,
      })
    } catch (error) {
      console.error("Failed to create exam", error)
      if (error instanceof LoginFailedError) {
        toast({
          title: "시험 생성 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "오류",
          description: "시험 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 시험 시작 핸들러
  const handleStartExam = (exam: Exam) => {
    setSelectedExamForStart(exam)
    setIsStartExamModalOpen(true)
  }

  // 시험 시작 확인 핸들러
  const handleConfirmStartExam = async () => {
    if (!selectedExamForStart) return

    setIsStartingExam(true)
    try {
      // 1) 시험 시작 API 호출
      await startExam(selectedExamForStart.id)

      // 2) 최신 시험 목록 재조회
      // handleFetchExams() 내부에서 이미 setExams()를 호출하므로
      // startAt / status 등을 DB 기준으로 통째로 갱신됨
      await handleFetchExams()

      // 모달 닫기
      setIsStartExamModalOpen(false)
      setSelectedExamForStart(null)

      // 성공 토스트 표시
      toast({
        title: "시험 시작 성공",
        description: `"${selectedExamForStart.title}" 시험이 시작되었습니다.`,
      })
    } catch (error) {
      console.error("Failed to start exam", error)
      if (error instanceof LoginFailedError) {
        toast({
          title: "시험 시작 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "오류",
          description: "시험 시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } finally {
      setIsStartingExam(false)
    }
  }

  // 시험 종료 핸들러
  const handleEndExam = (exam: Exam) => {
    setSelectedExamForEnd(exam)
    setIsEndExamModalOpen(true)
  }

  // 시험 종료 확인 핸들러
  const handleConfirmEndExam = async () => {
    if (!selectedExamForEnd) return

    setIsEndingExam(true)
    try {
      // 1) 시험 종료 API 호출
      await endExam(selectedExamForEnd.id)

      // 2) 최신 시험 목록 재조회
      // handleFetchExams() 내부에서 이미 setExams()를 호출하므로
      // endAt / status 등을 DB 기준으로 통째로 갱신됨
      await handleFetchExams()

      // 모달 닫기
      setIsEndExamModalOpen(false)
      setSelectedExamForEnd(null)

      // 성공 토스트 표시
      toast({
        title: "시험 종료 성공",
        description: `"${selectedExamForEnd.title}" 시험이 종료되었습니다.`,
      })
    } catch (error) {
      console.error("Failed to end exam", error)
      if (error instanceof LoginFailedError) {
        toast({
          title: "시험 종료 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "오류",
          description: "시험 종료 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } finally {
      setIsEndingExam(false)
    }
  }

  // 시험 삭제 핸들러
  const handleDeleteExam = (exam: Exam) => {
    setSelectedExamForDelete(exam)
    setIsDeleteExamModalOpen(true)
  }

  // 시험 삭제 확인 핸들러
  const handleConfirmDeleteExam = async () => {
    if (!selectedExamForDelete) return

    setIsDeletingExam(true)
    try {
      await deleteExam(selectedExamForDelete.id)
      
      // 시험 목록에서 삭제된 시험 제거
      setExams((prev) => {
        if (prev === null) return null
        const newList = prev.filter((exam) => exam.id !== selectedExamForDelete.id)
        // 삭제 후 페이지 조정
        const newTotalPages = Math.ceil(newList.length / examPageSize)
        if (currentExamPage > newTotalPages && newTotalPages > 0) {
          setCurrentExamPage(newTotalPages)
        } else if (newList.length === 0) {
          setCurrentExamPage(1)
        }
        return newList
      })

      // 성공 토스트 표시
      toast({
        title: "시험 삭제 성공",
        description: `"${selectedExamForDelete.title}" 시험이 삭제되었습니다.`,
      })

      // 모달 닫기
      setIsDeleteExamModalOpen(false)
      setSelectedExamForDelete(null)
    } catch (error) {
      console.error("Failed to delete exam", error)
      if (error instanceof LoginFailedError) {
        toast({
          title: "시험 삭제 실패",
          description: error.message,
          variant: "destructive",
        })
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "오류",
          description: "시험 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeletingExam(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">코드 관리</h1>
          <p className="text-sm text-[#6B7280]">참가자 시험 입장 코드를 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateExamOpen(true)}
            className="rounded-full bg-[#3B82F6] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
          >
            시험 생성
          </button>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        {/* 시험 목록 카드 영역 (상단) */}
        {examError && (
          <div className="mb-3">
            <p className="text-sm text-red-500">{examError}</p>
          </div>
        )}

        {exams && exams.length > 0 && (
          <div className="mb-6 flex-1 space-y-4">
            {visibleExams.map((exam) => {
              const isInProgress = exam.state === "RUNNING" || exam.state === "IN_PROGRESS"
              const examStateLabel = getExamStateLabel(exam.state)
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-6 py-4 shadow-sm"
                >
                  {/* Left side: 제목, 입장 코드, 상태, 시작일, 종료일 (가로 정렬, 한 줄, 고정 열 정렬, 중앙 정렬) */}
                  <div className="flex items-center gap-x-2 flex-1 min-w-0">
                    {/* 제목 */}
                    <span className="text-base font-semibold text-[#1A1A1A] w-48 shrink-0 truncate">
                      {exam.title}
                    </span>
                    {/* 구분자 */}
                    <span className="px-3 text-[#9CA3AF] shrink-0">|</span>
                    {/* 입장 코드: 고정 너비로 정렬, 중앙 정렬 */}
                    <div className="w-56 shrink-0 flex items-center justify-center gap-2 min-w-0">
                      {exam.entryCode ? (
                        <>
                          <span className="text-xs text-[#9CA3AF] truncate">
                            입장 코드: <span className="font-medium text-[#1A1A1A]">{exam.entryCode}</span>
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(exam.entryCode!)
                              toast({
                                description: "입장 코드가 복사되었습니다.",
                              })
                            }}
                            className="p-1 text-[#9CA3AF] transition-colors hover:opacity-70 hover:text-[#6B7280] shrink-0"
                            title="입장 코드 복사"
                          >
                            <Copy className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[#9CA3AF] truncate">입장 코드 없음</span>
                      )}
                    </div>
                    {/* 구분자 */}
                    <span className="px-3 text-[#9CA3AF] shrink-0">|</span>
                    {/* 상태 배지: 고정 너비로 정렬, 중앙 정렬 */}
                    <div className="w-20 shrink-0 flex justify-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap text-center ${
                          isInProgress
                            ? "bg-[#E0EDFF] font-semibold text-[#3B82F6]"
                            : "bg-[#F3F4F6] font-medium text-[#6B7280]"
                        }`}
                      >
                        {examStateLabel}
                      </span>
                    </div>
                    {/* 구분자 */}
                    <span className="px-3 text-[#9CA3AF] shrink-0">|</span>
                    {/* 시작일: 고정 너비로 정렬, 중앙 정렬 */}
                    <div className="w-48 shrink-0 text-center">
                      <span className="text-xs text-[#9CA3AF] truncate block">
                        시작: {formatExamDateTime(exam.startsAt)}
                      </span>
                    </div>
                    {/* 구분자 */}
                    <span className="px-3 text-[#9CA3AF] shrink-0">|</span>
                    {/* 종료일: 고정 너비로 정렬, 중앙 정렬 */}
                    <div className="w-48 shrink-0 text-center">
                      <span className="text-xs text-[#9CA3AF] truncate block">
                        종료: {formatExamDateTime(exam.endsAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right side: 시험 시작/종료 버튼, More menu */}
                  <div className="flex items-center gap-3">
                    {exam.state === "ENDED" || exam.state === "COMPLETED" ? (
                      <span className="text-sm text-[#9CA3AF]">종료됨</span>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleEndExam(exam)}
                        disabled={isEndingExam && selectedExamForEnd?.id === exam.id}
                        className="rounded-full border border-red-600 bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEndingExam && selectedExamForEnd?.id === exam.id ? "종료 중..." : "시험 종료"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        disabled={isStartingExam && selectedExamForStart?.id === exam.id}
                        className="rounded-full border border-[#3B82F6] bg-white px-4 py-1.5 text-sm font-medium text-[#3B82F6] transition-colors hover:bg-[#E0EDFF] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStartingExam && selectedExamForStart?.id === exam.id ? "시작 중..." : "시험 시작 >"}
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]">
                          <MoreVertical className="h-5 w-5" strokeWidth={1.5} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => handleDeleteExam(exam)}
                          className="text-red-600 focus:text-red-600"
                        >
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 시험 목록 페이지네이션 */}
        {exams && exams.length > 0 && (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E5E7EB] pt-4">
            {/* Left side: Showing X-Y of N */}
            <span className="text-sm text-[#6B7280]">
              총 {exams.length}개의 시험 목록 중 {examDisplayStart}–{examDisplayEnd} 표시
            </span>

            {/* Right side: Pagination controls */}
            <div className="flex items-center gap-1">
              {/* Prev button */}
              <button
                onClick={() => setCurrentExamPage((p) => Math.max(1, p - 1))}
                disabled={currentExamPage === 1}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>

              {/* Page number buttons */}
              {Array.from({ length: examTotalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentExamPage(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors ${
                    page === currentExamPage
                      ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                      : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#E0EDFF]"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={() => setCurrentExamPage((p) => Math.min(examTotalPages, p + 1))}
                disabled={currentExamPage === examTotalPages || examTotalPages === 0}
                className="flex h-8 items-center gap-1 rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#6B7280] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {exams && exams.length === 0 && !examError && (
          <div className="mb-4">
            <p className="text-sm text-[#6B7280]">등록된 시험이 없습니다.</p>
          </div>
        )}

      </div>

      {/* Start Exam Confirmation Modal */}
      <Dialog open={isStartExamModalOpen} onOpenChange={setIsStartExamModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험을 시작하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {selectedExamForStart
                ? `"${selectedExamForStart.title}" 시험을 시작하시겠습니까?\n시험이 시작되면 참여자들이 시험에 입장할 수 있습니다.`
                : "시험을 시작하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setIsStartExamModalOpen(false)} disabled={isStartingExam}>
              취소
            </Button>
            <Button onClick={handleConfirmStartExam} disabled={isStartingExam}>
              {isStartingExam ? "시작 중..." : "시험 시작"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Exam Confirmation Modal */}
      <Dialog open={isEndExamModalOpen} onOpenChange={setIsEndExamModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험을 종료하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {selectedExamForEnd
                ? `"${selectedExamForEnd.title}" 시험을 종료하시겠습니까?\n시험을 종료하면 더 이상 응시자가 코드를 제출하거나 수정할 수 없습니다.\n이 작업은 되돌릴 수 없습니다.`
                : "시험을 종료하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setIsEndExamModalOpen(false)} disabled={isEndingExam}>
              취소
            </Button>
            <Button 
              onClick={handleConfirmEndExam} 
              disabled={isEndingExam} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isEndingExam ? "종료 중..." : "시험 종료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exam Confirmation Modal */}
      <Dialog open={isDeleteExamModalOpen} onOpenChange={setIsDeleteExamModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험 삭제</DialogTitle>
            <DialogDescription className="pt-2 text-[#6B7280]">
              정말로 이 시험을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없으며, 시험과 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          {selectedExamForDelete && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-[#E5E5E5]">
                <p className="text-[#1A1A1A] text-sm font-semibold">{selectedExamForDelete.title}</p>
                <p className="text-[#6B7280] text-xs mt-1">
                  시작: {formatExamDateTime(selectedExamForDelete.startsAt)} • 종료: {formatExamDateTime(selectedExamForDelete.endsAt)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button variant="outline" onClick={() => setIsDeleteExamModalOpen(false)} disabled={isDeletingExam}>
              취소
            </Button>
            <Button onClick={handleConfirmDeleteExam} disabled={isDeletingExam} variant="destructive">
              {isDeletingExam ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Exam Modal */}
      <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험 생성</DialogTitle>
            <DialogDescription className="pt-2 text-[#6B7280]">
              새로운 시험을 생성합니다. 제목과 시작/종료 시각을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="exam-title" className="text-sm font-medium text-[#1A1A1A]">
                제목
              </label>
              <Input
                id="exam-title"
                type="text"
                placeholder="시험 제목을 입력하세요"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                disabled={isSubmitting}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="exam-starts-at" className="text-sm font-medium text-[#1A1A1A]">
                시작 시각
              </label>
              <Input
                id="exam-starts-at"
                type="datetime-local"
                value={examStartsAt}
                onChange={(e) => setExamStartsAt(e.target.value)}
                disabled={isSubmitting}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="exam-ends-at" className="text-sm font-medium text-[#1A1A1A]">
                종료 시각
              </label>
              <Input
                id="exam-ends-at"
                type="datetime-local"
                value={examEndsAt}
                onChange={(e) => setExamEndsAt(e.target.value)}
                disabled={isSubmitting}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateExamOpen(false)
                setExamTitle("")
                setExamStartsAt("")
                setExamEndsAt("")
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleCreateExam} disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
