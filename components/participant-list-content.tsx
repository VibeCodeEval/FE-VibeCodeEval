"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation";
import { ArrowLeft, Eye, ChevronLeft, ChevronRight } from "lucide-react"

type TrendLevel = "High" | "Average" | "Low"

interface ParticipantDetail {
  id: string
  name: string
  avgScore: number
  trend: TrendLevel
}

interface ParticipantListContentProps {
  entryCode: string
}

const sampleParticipants: ParticipantDetail[] = [
  { id: "1", name: "Alice Johnson", avgScore: 92, trend: "High" },
  { id: "2", name: "Bob Smith", avgScore: 84, trend: "Average" },
  { id: "3", name: "Carol Davis", avgScore: 70, trend: "Low" },
  { id: "4", name: "David Lee", avgScore: 88, trend: "High" },
  { id: "5", name: "Emma Wilson", avgScore: 91, trend: "High" },
  { id: "6", name: "Frank Brown", avgScore: 76, trend: "Average" },
  { id: "7", name: "Grace Kim", avgScore: 68, trend: "Low" },
  { id: "8", name: "Henry Chen", avgScore: 85, trend: "Average" },
  { id: "9", name: "Ivy Martinez", avgScore: 94, trend: "High" },
  { id: "10", name: "Jack Thompson", avgScore: 72, trend: "Low" },
  { id: "11", name: "Karen White", avgScore: 89, trend: "High" },
  { id: "12", name: "Leo Garcia", avgScore: 78, trend: "Average" },
  { id: "13", name: "Mia Robinson", avgScore: 65, trend: "Low" },
  { id: "14", name: "Nathan Clark", avgScore: 90, trend: "High" },
  { id: "15", name: "Olivia Hall", avgScore: 82, trend: "Average" },
  { id: "16", name: "Peter Young", avgScore: 71, trend: "Low" },
  { id: "17", name: "Quinn Adams", avgScore: 87, trend: "High" },
  { id: "18", name: "Rachel King", avgScore: 79, trend: "Average" },
  { id: "19", name: "Sam Wright", avgScore: 67, trend: "Low" },
  { id: "20", name: "Tina Scott", avgScore: 93, trend: "High" },
  { id: "21", name: "Uma Patel", avgScore: 81, trend: "Average" },
  { id: "22", name: "Victor Lopez", avgScore: 69, trend: "Low" },
  { id: "23", name: "Wendy Hill", avgScore: 86, trend: "High" },
  { id: "24", name: "Xavier Moore", avgScore: 77, trend: "Average" },
  { id: "25", name: "Yuki Tanaka", avgScore: 64, trend: "Low" },
  { id: "26", name: "Zara Nelson", avgScore: 95, trend: "High" },
  { id: "27", name: "Aaron Baker", avgScore: 80, trend: "Average" },
  { id: "28", name: "Bella Carter", avgScore: 66, trend: "Low" },
  { id: "29", name: "Chris Evans", avgScore: 91, trend: "High" },
  { id: "30", name: "Diana Foster", avgScore: 83, trend: "Average" },
  { id: "31", name: "Eric Green", avgScore: 73, trend: "Low" },
  { id: "32", name: "Fiona Hughes", avgScore: 88, trend: "High" },
  { id: "33", name: "George Irving", avgScore: 75, trend: "Average" },
  { id: "34", name: "Hannah James", avgScore: 62, trend: "Low" },
  { id: "35", name: "Ian Kelly", avgScore: 90, trend: "High" },
  { id: "36", name: "Julia Lewis", avgScore: 84, trend: "Average" },
  { id: "37", name: "Kevin Morgan", avgScore: 70, trend: "Low" },
  { id: "38", name: "Luna Nash", avgScore: 92, trend: "High" },
  { id: "39", name: "Mark Owen", avgScore: 78, trend: "Average" },
  { id: "40", name: "Nina Price", avgScore: 68, trend: "Low" },
  { id: "41", name: "Oscar Quinn", avgScore: 89, trend: "High" },
  { id: "42", name: "Paula Reed", avgScore: 81, trend: "Average" },
  { id: "43", name: "Quentin Stone", avgScore: 63, trend: "Low" },
  { id: "44", name: "Rosa Turner", avgScore: 94, trend: "High" },
  { id: "45", name: "Steve Underwood", avgScore: 76, trend: "Average" },
  { id: "46", name: "Tara Vance", avgScore: 69, trend: "Low" },
  { id: "47", name: "Ulysses Ward", avgScore: 87, trend: "High" },
  { id: "48", name: "Vera Xavier", avgScore: 82, trend: "Average" },
  { id: "49", name: "Will York", avgScore: 71, trend: "Low" },
  { id: "50", name: "Xena Zhang", avgScore: 96, trend: "High" },
  { id: "51", name: "Yosef Ali", avgScore: 79, trend: "Average" },
  { id: "52", name: "Zoe Brooks", avgScore: 65, trend: "Low" },
  { id: "53", name: "Adam Cole", avgScore: 91, trend: "High" },
  { id: "54", name: "Beth Davis", avgScore: 85, trend: "Average" },
]

// Summary data - in real app this would be fetched based on entryCode
const summaryData = {
  entryCode: "AIV-2024-001",
  totalParticipants: 54,
  completed: 54,
}

function TrendBadge({ trend }: { trend: TrendLevel }) {
  const styles = {
    High: "bg-[#DCFCE7] text-[#16A34A]",
    Average: "bg-[#FEF3C7] text-[#D97706]",
    Low: "bg-[#FEE2E2] text-[#DC2626]",
  }

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[trend]}`}>{trend}</span>
}

export function ParticipantListContent({ entryCode }: ParticipantListContentProps) {
  // Use the passed entryCode or fallback to sample data
  const pathname = usePathname();

  // URL (/admin/results/AIV-2024-001) 에서 마지막 세그먼트를 추출
  const displayEntryCode = useMemo(() => {
    if (!pathname) {
      return entryCode || summaryData.totalParticipants.toString(); // <- fallback은 아래에서 다시 정리
    }

    const segments = pathname.split("/");
    const fromPath = decodeURIComponent(segments[segments.length - 1] || "");

    // 1순위: props로 받은 entryCode
    // 2순위: URL에서 파싱한 값
    // 3순위: 없으면 샘플 데이터/기본값
    return entryCode || fromPath || summaryData.entryCode;
  }, [pathname, entryCode]);

  const pageSize = 10
  const [page, setPage] = useState(1)

  const totalParticipants = sampleParticipants.length
  const totalPages = Math.ceil(totalParticipants / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageParticipants = sampleParticipants.slice(startIndex, endIndex)

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top Header Bar */}
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">참가자 목록 (입장 코드 요약)</h1>
          <p className="text-sm text-[#6B7280]">해당 입장 코드의 참가자 점수 및 성과를 확인합니다.</p>
        </div>
      </header>

      {/* Main Content Panel */}
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {/* Back Link */}
        <div className="mb-4 shrink-0">
          <Link
            href="/admin/results"
            className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#3B82F6]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            평가 결과로 돌아가기
          </Link>
        </div>

        {/* Summary Card */}
        <div className="mb-6 shrink-0 rounded-xl border border-[#E5E5E5] bg-white px-12 py-6 shadow-sm">
          <div className="flex items-center gap-16">
            {/* Entry Code */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">입장 코드</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{displayEntryCode}</span>
            </div>

            {/* Total Participants */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">총 참가자 수</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{summaryData.totalParticipants}</span>
            </div>

            {/* Completed */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">완료 인원</span>
              <span className="text-lg font-semibold text-[#1A1A1A]">{summaryData.completed}</span>
            </div>
          </div>
        </div>

        {/* Participant Table Container - Restructured for pagination inside card */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
          {/* Table Header */}
          <div className="grid shrink-0 grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-[#E5E5E5] bg-[#F9FAFB] px-12 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">참가자</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">평균 점수</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">성과 추이</span>
            <span className="text-center text-xs font-semibold uppercase tracking-wide text-[#6B7280]">상세 보기</span>
          </div>

          {/* Table Body - Uses pageParticipants instead of full array */}
          <div className="flex-1 overflow-y-auto px-12">
            {pageParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 py-4 ${
                  index !== pageParticipants.length - 1 ? "border-b border-[#E5E5E5]" : ""
                }`}
              >
                <span className="text-sm font-medium text-[#1A1A1A]">{participant.name}</span>
                <span className="text-center text-sm font-medium text-[#1A1A1A]">{participant.avgScore}%</span>
                <div className="flex justify-center">
                  <TrendBadge trend={participant.trend} />
                </div>
                <div className="flex justify-center">
                  <Link
                    href={{
                      // 참가자 상세 페이지 경로 (id 사용)
                      pathname: `/admin/results/participants/${encodeURIComponent(participant.id)}`,
                      // 여기에 우리가 넘기고 싶은 값들 추가
                      query: {
                        entryCode: entryCode,              // 상단 카드에 보여줄 Entry Code
                        participantName: participant.name, // 상단 카드에 보여줄 이름
                        from: "results",                   // 기존에 쓰던 from 값 유지하고 싶으면 같이 전달
                      },
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border-[#3B82F6] bg-white px-3 py-1.5 text-sm text-[#3B82F6] hover:bg-[#EFF6FF]"
                  >
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                    상세 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-[#E5E5E5] bg-white px-12 py-3">
            <p className="text-sm text-[#6B7280]">
              총 {totalParticipants}명 중 {startIndex + 1}–{Math.min(endIndex, totalParticipants)}명 표시
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === 1
                    ? "border-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed"
                    : "border-[#E5E5E5] text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                이전
              </button>
              <span className="px-2 text-sm text-[#6B7280]">
                {page} / {totalPages} 페이지
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  page === totalPages
                    ? "border-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed"
                    : "border-[#E5E5E5] text-[#374151] hover:bg-[#F3F4F6]"
                }`}
              >
                다음
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
