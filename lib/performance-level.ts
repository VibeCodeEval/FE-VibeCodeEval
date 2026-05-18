/** 보드·상세 화면 공통 — 총점 기준 성과 수준 (80 / 50 구간) */
export type BoardPerformanceLevel = "high" | "medium" | "low" | "unscored"

export interface BoardPerformanceLevelDisplay {
  level: BoardPerformanceLevel
  label: string
  badgeClass: string
}

const THRESHOLD_HIGH = 80
const THRESHOLD_MEDIUM = 50

export function resolveBoardPerformanceLevel(
  totalScore: number | null | undefined
): BoardPerformanceLevelDisplay {
  if (totalScore === null || totalScore === undefined || Number.isNaN(Number(totalScore))) {
    return {
      level: "unscored",
      label: "미채점",
      badgeClass: "bg-[#F3F4F6] text-[#6B7280]",
    }
  }
  const n = Number(totalScore)
  if (n >= THRESHOLD_HIGH) {
    return {
      level: "high",
      label: "높음",
      badgeClass: "bg-[#DCFCE7] text-[#16A34A]",
    }
  }
  if (n >= THRESHOLD_MEDIUM) {
    return {
      level: "medium",
      label: "보통",
      badgeClass: "bg-[#FEF3C7] text-[#D97706]",
    }
  }
  return {
    level: "low",
    label: "낮음",
    badgeClass: "bg-[#FEE2E2] text-[#DC2626]",
  }
}
