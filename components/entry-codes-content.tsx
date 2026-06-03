"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { createExam, getExams, deleteExam, getEntryCodes, startExam, endExam, extendExam, Exam, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { getEffectiveExamState, isAdminExamEnded } from "@/lib/admin-users-participant-status"
import { getExamSortTimestamp } from "@/lib/master-test-sessions"
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

// 백엔드 응답의 다양한 필드명(entryCode/accessCode/code/inviteCode)에서 입장 코드를 추출
const pickEntryCode = (source: unknown): string | undefined => {
  if (!source || typeof source !== "object") return undefined

  const record = source as Record<string, unknown>
  const candidates = ["entryCode", "accessCode", "code", "inviteCode"]
  for (const key of candidates) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value
    }
  }

  return undefined
}

/** 시험 시작 버튼(0) → 종료 버튼(1) → 종료됨(2). UI 버튼 분기와 동일한 state 기준 */
function getExamEntryCodesActionPriority(state: string): number {
  const normalized = (state ?? "").trim().toUpperCase()
  if (["ENDED", "COMPLETED", "CLOSED", "FINISHED", "DONE"].includes(normalized)) {
    return 2
  }
  if (["RUNNING", "IN_PROGRESS", "ACTIVE"].includes(normalized)) {
    return 1
  }
  return 0
}

/** 관리자 시험 목록 자동 갱신 주기 (BE 자동 시작 스케줄러 10초 + 여유) */
const EXAM_LIST_POLL_INTERVAL_MS = 15_000

const EXPIRES_AT_PAST_ERROR_MESSAGE = "만료일은 현재 이후여야 합니다."
const STARTS_AT_PAST_ERROR_MESSAGE = "시작 시각은 현재 이후여야 합니다."
const ENDS_AT_BEFORE_STARTS_AT_ERROR_MESSAGE = "종료 시각은 시작 시각보다 이후여야 합니다."
const TITLE_REQUIRED_FALLBACK_MESSAGE = "시험 제목은 필수입니다."

/** datetime-local 입력값을 로컬 시각 Date로 변환 */
function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute] = timePart.split(":").map(Number)
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) {
    return null
  }

  const date = new Date(year, month - 1, day, hour, minute)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null
  }

  return Number.isNaN(date.getTime()) ? null : date
}

/** 종료/만료 시각이 현재 이후인지 확인 (datetime-local 입력값 기준) */
function isFutureDateTime(value: string): boolean {
  const date = parseDateTimeLocal(value)
  return date !== null && date > new Date()
}

/** createExam 400 응답이 만료일(종료 시각) 검증 실패인지 여부 */
function isExpiresAtValidationApiError(error: LoginFailedError, endsAt: string): boolean {
  if (error.status !== 400) return false
  if (error.fieldErrors?.endsAt) return true
  const message = error.message ?? ""
  if (message.includes("만료일") || message.includes("현재 이후")) return true
  // BE가 공통 400 메시지만 내려줄 때, 과거 종료 시각이면 만료일 검증 실패로 처리
  return !isFutureDateTime(endsAt)
}

/** createExam 400 응답에서 공통 오류 영역에 표시할 메시지 (필드 우선순위: title > endsAt > startsAt > message) */
function resolveCreateExamValidationMessage(
  error: LoginFailedError,
  endsAt: string,
  title: string,
): string | null {
  if (error.status !== 400) return null

  const fields = error.fieldErrors ?? {}

  if (fields.title) return fields.title
  if (!title.trim()) return TITLE_REQUIRED_FALLBACK_MESSAGE

  if (fields.endsAt) return fields.endsAt
  if (isExpiresAtValidationApiError(error, endsAt)) {
    return EXPIRES_AT_PAST_ERROR_MESSAGE
  }

  if (fields.startsAt) return fields.startsAt

  return error.message || null
}

/** 상태 우선 정렬 후, 같은 그룹 내에서는 시작/생성 시각 내림차순(기존 시각 기준) */
function sortExamsForEntryCodes<T extends Exam>(exams: T[]): T[] {
  return [...exams].sort((a, b) => {
    const byAction =
      getExamEntryCodesActionPriority(getEffectiveExamState(a)) -
      getExamEntryCodesActionPriority(getEffectiveExamState(b))
    if (byAction !== 0) return byAction
    return getExamSortTimestamp(b) - getExamSortTimestamp(a)
  })
}

type FetchExamsOptions = {
  /** true면 로딩/토스트/페이지 리셋 없이 목록만 갱신 (백그라운드 폴링) */
  silent?: boolean
  /** true면 조회 성공 후 1페이지로 이동 */
  resetPage?: boolean
}

export function EntryCodesContent() {

  // 시험 생성 모달 상태
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false)
  const [examTitle, setExamTitle] = useState("")
  const [examStartsAt, setExamStartsAt] = useState("")
  const [examEndsAt, setExamEndsAt] = useState("")
  const [examStartsAtError, setExamStartsAtError] = useState("")
  const [createExamValidationError, setCreateExamValidationError] = useState("")
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

  // 시험 연장 모달 상태
  const [isExtendExamModalOpen, setIsExtendExamModalOpen] = useState(false)
  const [selectedExamForExtend, setSelectedExamForExtend] = useState<Exam | null>(null)
  const [extendMinutes, setExtendMinutes] = useState("30")
  const [isExtendingExam, setIsExtendingExam] = useState(false)

  const { toast } = useToast()

  const fetchExamsInFlightRef = useRef(false)

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

  // 시험 조회 핸들러 (getExams + 입장 코드 병렬 조회)
  const handleFetchExams = useCallback(
    async (options: FetchExamsOptions = {}) => {
      const silent = options.silent ?? false
      const resetPage = options.resetPage ?? !silent

      if (fetchExamsInFlightRef.current) {
        return
      }
      fetchExamsInFlightRef.current = true

      try {
        if (!silent) {
          setIsLoadingExams(true)
          setExamError(null)
        }

        const examsData = await getExams()

        const examsWithEntryCodes = await Promise.all(
          examsData.map(async (exam) => {
            try {
              const entryCodes = await getEntryCodes(exam.id)
              const activeEntryCode = entryCodes.find((ec) => ec.isActive) || entryCodes[0]
              return {
                ...exam,
                entryCode: activeEntryCode?.code || pickEntryCode(exam),
              }
            } catch (entryCodeError) {
              console.warn(`Failed to fetch entry codes for exam ${exam.id}:`, entryCodeError)
              return {
                ...exam,
                entryCode: pickEntryCode(exam),
              }
            }
          })
        )

        setExams(sortExamsForEntryCodes(examsWithEntryCodes))
        if (resetPage) {
          setCurrentExamPage(1)
        }
      } catch (error) {
        console.error("Failed to fetch exams", error)
        if (silent) {
          return
        }
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
      } finally {
        if (!silent) {
          setIsLoadingExams(false)
        }
        fetchExamsInFlightRef.current = false
      }
    },
    [toast]
  )

  // 최초 로드
  useEffect(() => {
    void handleFetchExams({ resetPage: true })
  }, [handleFetchExams])

  // BE 자동 시작 등 상태 변경 반영 — 시험 생성 모달 작성 중에는 건너뜀
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (isCreateExamOpen) {
        return
      }
      void handleFetchExams({ silent: true, resetPage: false })
    }, EXAM_LIST_POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [handleFetchExams, isCreateExamOpen])

  // 시험 생성 핸들러
  const handleCreateExam = async () => {
    setExamStartsAtError("")
    setCreateExamValidationError("")

    if (!examStartsAt || !examEndsAt) {
      toast({
        title: "입력 오류",
        description: "시작 시각과 종료 시각을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    let shouldBlockSubmit = false

    if (!isFutureDateTime(examStartsAt)) {
      setExamStartsAtError(STARTS_AT_PAST_ERROR_MESSAGE)
      shouldBlockSubmit = true
    }

    const startDate = parseDateTimeLocal(examStartsAt)
    const endDate = parseDateTimeLocal(examEndsAt)

    if (!isFutureDateTime(examEndsAt)) {
      setCreateExamValidationError(EXPIRES_AT_PAST_ERROR_MESSAGE)
      if (!isFutureDateTime(examStartsAt)) {
        shouldBlockSubmit = true
      }
    } else if (startDate && endDate && startDate >= endDate) {
      setCreateExamValidationError(ENDS_AT_BEFORE_STARTS_AT_ERROR_MESSAGE)
      shouldBlockSubmit = true
    }

    if (shouldBlockSubmit) {
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
      const responseEntryCode = pickEntryCode(createdExam)
      let createdExamWithEntryCode: Exam = {
        ...createdExam,
        entryCode: responseEntryCode,
      }

      // 생성 직후 entry-codes API에서 실제 활성 코드를 한번 더 조회해 반영
      try {
        const createdExamEntryCodes = await getEntryCodes(createdExam.id)
        const activeEntryCode = createdExamEntryCodes.find((ec) => ec.isActive) || createdExamEntryCodes[0]
        createdExamWithEntryCode = {
          ...createdExam,
          entryCode: activeEntryCode?.code || responseEntryCode,
        }
      } catch (entryCodeError) {
        console.warn(`Failed to fetch entry codes right after exam creation (examId=${createdExam.id}):`, entryCodeError)
      }

      console.log("Exam created:", createdExamWithEntryCode)

      // 시험 목록에 새로 생성된 시험 추가
      setExams((prev) => {
        if (prev === null) {
          return [createdExamWithEntryCode]
        }
        return sortExamsForEntryCodes([createdExamWithEntryCode, ...prev])
      })

      // 모달 닫기
      setIsCreateExamOpen(false)

      // 폼 필드 초기화
      setExamTitle("")
      setExamStartsAt("")
      setExamEndsAt("")
      setExamStartsAtError("")
      setCreateExamValidationError("")

      // 성공 토스트 표시
      toast({
        title: "시험 생성 성공",
        description: `"${createdExamWithEntryCode.title}" 시험이 성공적으로 생성되었습니다.`,
      })
    } catch (error) {
      console.error("Failed to create exam", error)
      if (error instanceof LoginFailedError) {
        const validationMessage = resolveCreateExamValidationMessage(
          error,
          examEndsAt,
          examTitle,
        )
        if (error.fieldErrors?.startsAt) {
          setExamStartsAtError(error.fieldErrors.startsAt)
        } else if (validationMessage) {
          setCreateExamValidationError(validationMessage)
        } else {
          toast({
            title: "시험 생성 실패",
            description: error.message,
            variant: "destructive",
          })
        }
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
      await handleFetchExams({ resetPage: true })

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
      await handleFetchExams({ resetPage: true })

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

  // 시험 연장 핸들러
  const handleExtendExam = (exam: Exam) => {
    setSelectedExamForExtend(exam)
    setExtendMinutes("30")
    setIsExtendExamModalOpen(true)
  }

  // 시험 연장 확인 핸들러
  const handleConfirmExtendExam = async () => {
    if (!selectedExamForExtend) return
    const mins = parseInt(extendMinutes, 10)
    if (!mins || mins <= 0) {
      toast({
        title: "입력 오류",
        description: "연장 시간은 1분 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }

    setIsExtendingExam(true)
    try {
      await extendExam(selectedExamForExtend.id, mins)
      await handleFetchExams({ resetPage: true })
      setIsExtendExamModalOpen(false)
      setSelectedExamForExtend(null)
      toast({
        title: "시험 연장 성공",
        description: `"${selectedExamForExtend.title}" 시험이 ${mins}분 연장되었습니다.`,
      })
    } catch (error) {
      console.error("Failed to extend exam", error)
      toast({
        title: "시험 연장 실패",
        description: error instanceof Error ? error.message : "시험 연장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsExtendingExam(false)
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
        return sortExamsForEntryCodes(newList)
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
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">코드 관리</h1>
          <p className="text-sm text-[#6B7280]">참가자 시험 입장 코드를 관리합니다</p>
        </div>
        <div className="flex gap-2 lg:mr-8 xl:mr-12 2xl:mr-16">
          <button
            onClick={() => setIsCreateExamOpen(true)}
            className="rounded-full bg-[#3B82F6] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
          >
            시험 생성
          </button>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 sm:p-6">
        {/* 시험 목록 카드 영역 (상단) */}
        {examError && (
          <div className="mb-3">
            <p className="text-sm text-red-500">{examError}</p>
          </div>
        )}

        {exams && exams.length > 0 && (
          <div className="mb-6 flex-1 space-y-4">
            {visibleExams.map((exam) => {
              const effectiveState = getEffectiveExamState(exam)
              const examEnded = isAdminExamEnded(exam)
              const isInProgress =
                !examEnded &&
                (effectiveState === "RUNNING" || effectiveState === "IN_PROGRESS")
              const examStateLabel = examEnded ? "종료" : getExamStateLabel(effectiveState)
              return (
                <div
                  key={exam.id}
                  className="flex flex-col gap-4 rounded-xl border border-[#E5E5E5] bg-white px-4 py-4 shadow-sm sm:px-6 xl:flex-row xl:items-center xl:justify-between"
                >
                  {/* Left side: 제목, 입장 코드, 상태, 시작일, 종료일 — xl 이상에서 기존 한 줄 */}
                  <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center xl:gap-x-2">
                    {/* 제목 */}
                    <span className="min-w-0 truncate text-base font-semibold text-[#1A1A1A] xl:w-48 xl:shrink-0">
                      {exam.title}
                    </span>
                    {/* 구분자 */}
                    <span className="hidden shrink-0 px-3 text-[#9CA3AF] xl:inline">|</span>
                    {/* 입장 코드 */}
                    <div className="flex min-w-0 w-full items-center gap-2 xl:w-56 xl:shrink-0 xl:justify-center">
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
                    <span className="hidden shrink-0 px-3 text-[#9CA3AF] xl:inline">|</span>
                    {/* 상태 배지 */}
                    <div className="flex w-full shrink-0 justify-start xl:w-20 xl:justify-center">
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
                    <span className="hidden shrink-0 px-3 text-[#9CA3AF] xl:inline">|</span>
                    {/* 시작일 */}
                    <div className="min-w-0 w-full shrink-0 text-left xl:w-48 xl:text-center">
                      <span className="block truncate whitespace-nowrap text-xs text-[#9CA3AF]">
                        시작: {formatExamDateTime(exam.startsAt)}
                      </span>
                    </div>
                    {/* 구분자 */}
                    <span className="hidden shrink-0 px-3 text-[#9CA3AF] xl:inline">|</span>
                    {/* 종료일 */}
                    <div className="min-w-0 w-full shrink-0 text-left xl:w-48 xl:text-center">
                      <span className="block truncate whitespace-nowrap text-xs text-[#9CA3AF]">
                        종료: {formatExamDateTime(exam.endsAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right side: 시험 시작/종료 버튼, More menu */}
                  <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3 xl:w-auto xl:flex-nowrap">
                    {examEnded ? (
                      <span className="text-sm text-[#9CA3AF]">종료됨</span>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleEndExam(exam)}
                        disabled={isEndingExam && selectedExamForEnd?.id === exam.id}
                        className="shrink-0 whitespace-nowrap rounded-full border border-red-600 bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isEndingExam && selectedExamForEnd?.id === exam.id ? "종료 중..." : "시험 종료"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        disabled={isStartingExam && selectedExamForStart?.id === exam.id}
                        className="shrink-0 whitespace-nowrap rounded-full border border-[#3B82F6] bg-white px-4 py-1.5 text-sm font-medium text-[#3B82F6] transition-colors hover:bg-[#E0EDFF] disabled:cursor-not-allowed disabled:opacity-50"
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
                      <DropdownMenuContent align="end" className="w-36">
                        {isInProgress && (
                          <DropdownMenuItem onClick={() => handleExtendExam(exam)}>
                            시간 연장
                          </DropdownMenuItem>
                        )}
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
          <div className="mt-4 flex shrink-0 flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Showing X-Y of N */}
            <span className="min-w-0 text-sm text-[#6B7280]">
              총 {exams.length}개의 시험 목록 중 {examDisplayStart}–{examDisplayEnd} 표시
            </span>

            {/* Right side: Pagination controls */}
            <div className="flex flex-wrap items-center justify-end gap-1">
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
        <DialogContent className="flex max-h-[min(90dvh,90vh)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험을 시작하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {selectedExamForStart
                ? `"${selectedExamForStart.title}" 시험을 시작하시겠습니까?\n시험이 시작되면 참여자들이 시험에 입장할 수 있습니다.`
                : "시험을 시작하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsStartExamModalOpen(false)} disabled={isStartingExam}>
              취소
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleConfirmStartExam} disabled={isStartingExam}>
              {isStartingExam ? "시작 중..." : "시험 시작"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Exam Confirmation Modal */}
      <Dialog open={isEndExamModalOpen} onOpenChange={setIsEndExamModalOpen}>
        <DialogContent className="flex max-h-[min(90dvh,90vh)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험을 종료하시겠습니까?</DialogTitle>
            <DialogDescription className="whitespace-pre-line pt-2 text-[#6B7280]">
              {selectedExamForEnd
                ? `"${selectedExamForEnd.title}" 시험을 종료하시겠습니까?\n시험을 종료하면 더 이상 응시자가 코드를 제출하거나 수정할 수 없습니다.\n이 작업은 되돌릴 수 없습니다.`
                : "시험을 종료하시겠습니까?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEndExamModalOpen(false)} disabled={isEndingExam}>
              취소
            </Button>
            <Button 
              onClick={handleConfirmEndExam} 
              disabled={isEndingExam} 
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              {isEndingExam ? "종료 중..." : "시험 종료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exam Confirmation Modal */}
      <Dialog open={isDeleteExamModalOpen} onOpenChange={setIsDeleteExamModalOpen}>
        <DialogContent className="flex max-h-[min(90dvh,90vh)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-md">
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
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDeleteExamModalOpen(false)} disabled={isDeletingExam}>
              취소
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleConfirmDeleteExam} disabled={isDeletingExam} variant="destructive">
              {isDeletingExam ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Exam Modal */}
      <Dialog open={isExtendExamModalOpen} onOpenChange={setIsExtendExamModalOpen}>
        <DialogContent className="flex max-h-[min(90dvh,90vh)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험 시간 연장</DialogTitle>
            <DialogDescription className="pt-2 text-[#6B7280]">
              {selectedExamForExtend
                ? `"${selectedExamForExtend.title}" 시험의 종료 시각을 연장합니다.`
                : "시험 시간을 연장합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 gap-4 py-4">
            <div className="min-w-0 space-y-2">
              <label htmlFor="extend-minutes" className="text-sm font-medium text-[#1A1A1A]">
                연장 시간 (분)
              </label>
              <Input
                id="extend-minutes"
                type="number"
                min="1"
                placeholder="30"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(e.target.value)}
                disabled={isExtendingExam}
                className="w-full min-w-0"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsExtendExamModalOpen(false)}
              disabled={isExtendingExam}
            >
              취소
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleConfirmExtendExam} disabled={isExtendingExam}>
              {isExtendingExam ? "연장 중..." : "연장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Exam Modal */}
      <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
        <DialogContent className="flex max-h-[min(90dvh,90vh)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>시험 생성</DialogTitle>
            <DialogDescription className="pt-2 text-[#6B7280]">
              새로운 시험을 생성합니다. 제목과 시작/종료 시각을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 gap-4 py-4">
            <div className="min-w-0 space-y-2">
              <label htmlFor="exam-title" className="text-sm font-medium text-[#1A1A1A]">
                제목
              </label>
              <Input
                id="exam-title"
                type="text"
                placeholder="시험 제목을 입력하세요"
                value={examTitle}
                onChange={(e) => {
                  setExamTitle(e.target.value)
                  if (createExamValidationError) {
                    setCreateExamValidationError("")
                  }
                }}
                disabled={isSubmitting}
                className="w-full min-w-0"
              />
            </div>
            <div className="min-w-0 space-y-2">
              <label htmlFor="exam-starts-at" className="text-sm font-medium text-[#1A1A1A]">
                시작 시각
              </label>
              <Input
                id="exam-starts-at"
                type="datetime-local"
                value={examStartsAt}
                onChange={(e) => {
                  const nextExamStartsAt = e.target.value
                  setExamStartsAt(e.target.value)
                  if (examStartsAtError && isFutureDateTime(nextExamStartsAt)) {
                    setExamStartsAtError("")
                  }
                  if (createExamValidationError === ENDS_AT_BEFORE_STARTS_AT_ERROR_MESSAGE) {
                    const nextStartDate = parseDateTimeLocal(nextExamStartsAt)
                    const endDate = parseDateTimeLocal(examEndsAt)
                    if (nextStartDate && endDate && nextStartDate < endDate) {
                      setCreateExamValidationError("")
                    }
                  }
                }}
                disabled={isSubmitting}
                className="w-full min-w-0 max-w-full"
              />
              {examStartsAtError && (
                <p className="text-sm text-red-500">{examStartsAtError}</p>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <label htmlFor="exam-ends-at" className="text-sm font-medium text-[#1A1A1A]">
                종료 시각
              </label>
              <Input
                id="exam-ends-at"
                type="datetime-local"
                value={examEndsAt}
                onChange={(e) => {
                  const nextExamEndsAt = e.target.value
                  setExamEndsAt(nextExamEndsAt)
                  if (createExamValidationError && isFutureDateTime(nextExamEndsAt)) {
                    const nextStartDate = parseDateTimeLocal(examStartsAt)
                    const nextEndDate = parseDateTimeLocal(nextExamEndsAt)
                    if (nextStartDate && nextEndDate && nextStartDate < nextEndDate) {
                      setCreateExamValidationError("")
                    }
                  }
                }}
                disabled={isSubmitting}
                className="w-full min-w-0 max-w-full"
              />
              {createExamValidationError && (
                <p className="text-sm text-red-500">{createExamValidationError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setIsCreateExamOpen(false)
                setExamTitle("")
                setExamStartsAt("")
                setExamEndsAt("")
                setExamStartsAtError("")
                setCreateExamValidationError("")
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleCreateExam}
              disabled={isSubmitting || !examStartsAt || !examEndsAt}
            >
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
