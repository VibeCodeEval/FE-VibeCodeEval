import type { AdminActivityLogType } from "@/lib/api/admin"

export type AdminActivityLogStatusLabel = "방 생성" | "시험 시작" | "평가 완료" | "시험 종료"

export const ADMIN_ACTIVITY_LOG_TYPE_LABEL: Record<AdminActivityLogType, AdminActivityLogStatusLabel> = {
  ROOM_CREATED: "방 생성",
  EXAM_STARTED: "시험 시작",
  EVALUATION_COMPLETED: "평가 완료",
  EXAM_ENDED: "시험 종료",
}

export const adminActivityLogStatusColors: Record<
  AdminActivityLogStatusLabel,
  { bg: string; text: string; marker: string }
> = {
  "방 생성": { bg: "#EBF0FA", text: "#4A74E0", marker: "#4A74E0" },
  "시험 시작": { bg: "#F0EBFA", text: "#7A5AF8", marker: "#7A5AF8" },
  "평가 완료": { bg: "#E8F5EF", text: "#4AA785", marker: "#4AA785" },
  "시험 종료": { bg: "#FBEAEC", text: "#D6455D", marker: "#D6455D" },
}

const FILTER_TO_TYPE: Record<string, AdminActivityLogType | undefined> = {
  "전체 상태": undefined,
  "방 생성": "ROOM_CREATED",
  "시험 시작": "EXAM_STARTED",
  "평가 완료": "EVALUATION_COMPLETED",
  "시험 종료": "EXAM_ENDED",
}

export function mapActivityLogFilterToType(filter: string): AdminActivityLogType | undefined {
  return FILTER_TO_TYPE[filter]
}

export function getActivityLogStatusLabel(type: AdminActivityLogType): AdminActivityLogStatusLabel {
  return ADMIN_ACTIVITY_LOG_TYPE_LABEL[type]
}

export function getActivityLogColors(type: AdminActivityLogType) {
  return adminActivityLogStatusColors[getActivityLogStatusLabel(type)]
}

/** 대시보드 타임라인 dot 색상 (Tailwind bg-* 클래스) */
export function getActivityLogDotClass(type: AdminActivityLogType): string {
  switch (type) {
    case "EXAM_STARTED":
      return "bg-purple-500"
    case "EVALUATION_COMPLETED":
      return "bg-green-500"
    case "ROOM_CREATED":
      return "bg-blue-500"
    case "EXAM_ENDED":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function formatActivityLogDateTime(iso: string): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function getActivityLogDateKey(iso: string): string {
  if (!iso) return "-"
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return iso.split("T")[0] ?? iso
  }
}
