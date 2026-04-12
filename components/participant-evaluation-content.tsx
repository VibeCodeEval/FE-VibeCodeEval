"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, User, Code, CheckCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { getExams, getBoard } from "@/lib/api/admin"

interface ParticipantEvaluationContentProps {
  entryCode: string
  participantName?: string   // 선택적 — URL query 또는 board에서 로드
  participantId: string
  onBack?: () => void;
}

interface ToastItem {
  id: string
  title: string
  description: string
}

const participantData = {
  name: "Alice Johnson",
  entryCode: "AJ-2024-001",
  avgScore: 92,
  status: "Submitted" as const,
  testDate: "2024-02-11",
  duration: "32 minutes",
  trend: "High" as const,
  language: "Python",
  promptScore: 86,
  performanceScore: 81,
  correctnessScore: 89,
}

const dummyCode = `def solution(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

def optimize_query(data: List[Dict], filters: Dict) -> List[Dict]:
    result = data
    for key, value in filters.items():
        result = [item for item in result if item.get(key) == value]
    return result

class DataProcessor:
    def __init__(self, config: Dict):
        self.config = config
        self.cache = {}
    
    def process(self, input_data: Any) -> Any:
        cache_key = hash(str(input_data))
        if cache_key in self.cache:
            return self.cache[cache_key]
        result = self._transform(input_data)
        self.cache[cache_key] = result
        return result`

const feedbackData = {
  strengths: [
    "깔끔하고 읽기 쉬운 코드 구조",
    "O(n) 시간 복잡도를 위한 해시 맵의 효율적인 사용",
    "독스트링을 통한 좋은 문서화",
    "코드 전반에 걸친 적절한 타입 힌트",
  ],
  weaknesses: [
    "빈 입력에 대한 엣지 케이스 처리 누락",
    "데이터 타입에 대한 입력 검증 없음",
    "캐시 무효화 전략이 구현되지 않음",
  ],
  suggestions: [
    "엣지 케이스를 위한 단위 테스트 추가",
    "메모이제이션을 위해 functools.lru_cache 사용 고려",
    "커스텀 예외를 사용한 적절한 오류 처리 구현",
  ],
  performanceNotes: [
    "해시 맵 접근 방식이 이 문제에 최적입니다",
    "제너레이터를 사용하면 메모리 사용량을 줄일 수 있습니다",
    "대용량 데이터셋에 대해 지연 평가 고려",
  ],
}

const testCaseResults = [
  {
    id: "1",
    testCase: "Basic Input",
    expected: "[0, 1]",
    submitted: "[0, 1]",
    result: "Passed" as const,
    execTime: "12ms",
    memory: "14.2 MB",
    tokens: 128,
  },
  {
    id: "2",
    testCase: "Empty Array",
    expected: "[]",
    submitted: "[]",
    result: "Passed" as const,
    execTime: "8ms",
    memory: "13.8 MB",
    tokens: 64,
  },
  {
    id: "3",
    testCase: "Large Input",
    expected: "[999, 1000]",
    submitted: "[999, 1000]",
    result: "Passed" as const,
    execTime: "45ms",
    memory: "28.4 MB",
    tokens: 256,
  },
  {
    id: "4",
    testCase: "Negative Numbers",
    expected: "[2, 4]",
    submitted: "[2, 3]",
    result: "Failed" as const,
    execTime: "15ms",
    memory: "14.6 MB",
    tokens: 128,
  },
  {
    id: "5",
    testCase: "Duplicate Values",
    expected: "[1, 3]",
    submitted: "[1, 3]",
    result: "Passed" as const,
    execTime: "11ms",
    memory: "14.1 MB",
    tokens: 96,
  },
  {
    id: "6",
    testCase: "Single Element",
    expected: "[]",
    submitted: "[]",
    result: "Passed" as const,
    execTime: "6ms",
    memory: "13.5 MB",
    tokens: 48,
  },
]

function StatusBadge({ status }: { status: "Submitted" | "In Progress" | "Not Started" }) {
  const badgeStyles: Record<string, string> = {
    Submitted: "bg-[#DCFCE7] text-[#16A34A]",
    "In Progress": "bg-[#E0EDFF] text-[#3B82F6] font-semibold",
    "Not Started": "bg-[#F3F4F6] text-[#6B7280]",
  }
  const statusText: Record<string, string> = {
    Submitted: "제출됨",
    "In Progress": "진행 중",
    "Not Started": "시작 안 함",
  }
  return <span className={"rounded-full px-3 py-1 text-xs font-medium " + badgeStyles[status]}>{statusText[status]}</span>
}

function TrendBadge({ trend }: { trend: "High" | "Average" | "Low" }) {
  const badgeStyles: Record<string, string> = {
    High: "bg-[#DCFCE7] text-[#16A34A]",
    Average: "bg-[#FEF3C7] text-[#D97706]",
    Low: "bg-[#FEE2E2] text-[#DC2626]",
  }
  const trendText: Record<string, string> = {
    High: "높음",
    Average: "보통",
    Low: "낮음",
  }
  return <span className={"rounded-full px-3 py-1 text-xs font-medium " + badgeStyles[trend]}>{trendText[trend]}</span>
}

function LanguageBadge({ language }: { language: string }) {
  return <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151]">{language}</span>
}

function TestResultBadge({ result }: { result: "Passed" | "Failed" }) {
  const badgeStyles: Record<string, string> = {
    Passed: "bg-[#DCFCE7] text-[#16A34A]",
    Failed: "bg-[#FEE2E2] text-[#DC2626]",
  }
  const resultText: Record<string, string> = {
    Passed: "통과",
    Failed: "실패",
  }
  return <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + badgeStyles[result]}>{resultText[result]}</span>
}

function generateParticipantCSV(): string {
  const header = "Metric,Value"
  const rows = [
    "Name," + participantData.name,
    "Entry Code," + participantData.entryCode,
    "Average Score," + participantData.avgScore + "%",
    "Status," + participantData.status,
    "Test Date," + participantData.testDate,
    "Duration," + participantData.duration,
    "Trend," + participantData.trend,
    "Language," + participantData.language,
    "Prompt Score," + participantData.promptScore + "%",
    "Performance Score," + participantData.performanceScore + "%",
    "Correctness Score," + participantData.correctnessScore + "%",
  ]
  return [header, ...rows].join("\n")
}

function downloadCSV() {
  const csvContent = generateParticipantCSV()
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "participants.csv"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ParticipantEvaluationContent({ entryCode, participantName: participantNameProp, participantId, onBack }: ParticipantEvaluationContentProps) {
  const router = useRouter()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // 실제 참가자 정보 (board에서 로드)
  const [boardParticipantName, setBoardParticipantName] = useState<string | null>(null)
  const [tokenUsed, setTokenUsed] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState<boolean | null>(null)
  const [isLoadingBoard, setIsLoadingBoard] = useState(true)

  useEffect(() => {
    async function loadParticipantFromBoard() {
      setIsLoadingBoard(true)
      try {
        const exams = await getExams()
        const matched = exams.find((e) => e.entryCode === entryCode)
        if (!matched) {
          setIsLoadingBoard(false)
          return
        }
        const board = await getBoard(matched.id)
        const entry = board.find((p) => p.examParticipantId.toString() === participantId)
        if (entry) {
          setBoardParticipantName(entry.name)
          setTokenUsed(entry.tokenUsed)
          setSubmitted(entry.submitted)
        }
      } catch (e) {
        console.error("Failed to load participant from board", e)
      } finally {
        setIsLoadingBoard(false)
      }
    }
    loadParticipantFromBoard()
  }, [entryCode, participantId])

  // 이름 우선순위: prop > board > fallback
  const displayName = participantNameProp || boardParticipantName || participantData.name

  const showToast = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleExport = () => {
    downloadCSV()
    showToast("Participant results exported successfully.", "File: participants.csv")
  }


  const handleBackClick = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    e.preventDefault();
    if (onBack) {
      onBack();       // 🔹 page.tsx 에서 만들어준 분기 로직 실행
    } else {
      router.back();  // 🔹 혹시 onBack이 없을 때 기본 동작
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">참가자 평가 상세</h1>
          <p className="text-sm text-[#6B7280]">
            이 참가자의 평가 결과와 제출 세부 정보를 모두 확인할 수 있습니다.
          </p>
        </div>
      </header>

      {/* Main Content Panel - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Back Link */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#4B5563]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            이전 페이지로 돌아가기
          </button>
        </div>

        {/* Summary Cards - Row 1 */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">참가자</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0EDFF]">
                <User className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              </div>
              <span className="text-base font-semibold text-[#1A1A1A]">
                {isLoadingBoard ? "..." : displayName}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">입장 코드</span>
            <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">{entryCode}</p>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">토큰 사용량</span>
            <p className="mt-3 text-lg font-semibold text-[#1A1A1A]">
              {isLoadingBoard ? "..." : tokenUsed !== null ? tokenUsed.toLocaleString() : "–"}
            </p>
          </div>
        </div>

        {/* Summary Cards - Row 2 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">참가자 ID</span>
            <p className="mt-3 text-base font-semibold text-[#1A1A1A]">{participantId}</p>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">성과 수준</span>
            <div className="mt-3">
              <TrendBadge trend={participantData.trend} />
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">제출 상태</span>
            <div className="mt-3">
              {isLoadingBoard ? (
                <span className="text-sm text-[#6B7280]">...</span>
              ) : submitted !== null ? (
                <StatusBadge status={submitted ? "Submitted" : "In Progress"} />
              ) : (
                <StatusBadge status={participantData.status} />
              )}
            </div>
          </div>
        </div>

        {/* Evaluation Breakdown Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">평가 점수 세부 내역</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">{participantData.promptScore}%</p>
              <p className="mt-1 text-sm font-medium text-[#374151]">프롬프트 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">이해 및 문제 해석 능력</p>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">{participantData.performanceScore}%</p>
              <p className="mt-1 text-sm font-medium text-[#374151]">성능 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">실행 효율 및 최적화</p>
            </div>
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-[#1A1A1A]">{participantData.correctnessScore}%</p>
              <p className="mt-1 text-sm font-medium text-[#374151]">정답률 점수</p>
              <p className="mt-1 text-xs text-[#6B7280]">솔루션 정확도 및 테스트 결과 일치율</p>
            </div>
          </div>
        </div>

        {/* Submitted Code Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">제출한 코드</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-[#374151]">코드 구현</span>
                </div>
                <LanguageBadge language={participantData.language} />
              </div>
              <div className="max-h-[400px] flex-1 overflow-y-auto p-4">
                <pre className="text-xs leading-relaxed text-[#374151]">
                  <code>{dummyCode}</code>
                </pre>
              </div>
            </div>
            <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#E5E5E5] px-5 py-3">
                <span className="text-sm font-medium text-[#374151]">AI 피드백 요약</span>
              </div>
              <div className="max-h-[400px] flex-1 overflow-y-auto p-5">
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#16A34A]">강점</h4>
                  <ul className="space-y-1">
                    {feedbackData.strengths.map((item, index) => (
                      <li key={index} className="text-sm text-[#374151]">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#DC2626]">약점</h4>
                  <ul className="space-y-1">
                    {feedbackData.weaknesses.map((item, index) => (
                      <li key={index} className="text-sm text-[#374151]">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#3B82F6]">개선 제안</h4>
                  <ul className="space-y-1">
                    {feedbackData.suggestions.map((item, index) => (
                      <li key={index} className="text-sm text-[#374151]">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#D97706]">
                    성능 관련 메모
                  </h4>
                  <ul className="space-y-1">
                    {feedbackData.performanceNotes.map((item, index) => (
                      <li key={index} className="text-sm text-[#374151]">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Case Results Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">테스트 케이스 결과</h2>
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
            <div className="px-6 pt-4 pb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">전체 테스트 케이스</span>
            </div>
            <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-6 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">테스트 케이스</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">기대 출력값</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">제출된 출력값</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">결과</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                실행 시간
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">메모리 사용량</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">토큰 수</span>
            </div>
            <div className="px-6">
              {testCaseResults.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className={
                    "grid grid-cols-[1.5fr_1.5fr_1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 py-3 " +
                    (index !== testCaseResults.length - 1 ? "border-b border-[#E5E5E5]" : "")
                  }
                >
                  <span className="text-sm text-[#374151]">{testCase.testCase}</span>
                  <span className="font-mono text-xs text-[#6B7280]">{testCase.expected}</span>
                  <span className="font-mono text-xs text-[#6B7280]">{testCase.submitted}</span>
                  <div className="flex justify-center">
                    <TestResultBadge result={testCase.result} />
                  </div>
                  <span className="text-center text-sm text-[#6B7280]">{testCase.execTime}</span>
                  <span className="text-center text-sm text-[#6B7280]">{testCase.memory}</span>
                  <span className="text-center text-sm text-[#6B7280]">{testCase.tokens}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              결과 내보내기 (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex w-[360px] items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
              <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A]">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
