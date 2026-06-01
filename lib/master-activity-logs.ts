import type { MasterActivityLogType } from "@/lib/api/admin"

export type MasterActivityLogStatusLabel =
  | "가입 번호 발급"
  | "비활성화"
  | "재활성화"
  | "관리자 가입 완료"
  | "계정 삭제"
  | "비밀번호 재설정"
  | "전역 설정 변경"

export const MASTER_ACTIVITY_LOG_TYPE_LABEL: Record<MasterActivityLogType, MasterActivityLogStatusLabel> = {
  ADMIN_SIGNUP_CODE_ISSUED: "가입 번호 발급",
  ADMIN_SIGNUP_CODE_DEACTIVATED: "비활성화",
  ADMIN_SIGNUP_CODE_REACTIVATED: "재활성화",
  ADMIN_SIGNED_UP: "관리자 가입 완료",
  ADMIN_ACCOUNT_DELETED: "계정 삭제",
  ADMIN_PASSWORD_RESET: "비밀번호 재설정",
  PLATFORM_SETTINGS_UPDATED: "전역 설정 변경",
}

export const masterActivityLogStatusColors: Record<
  MasterActivityLogStatusLabel,
  { bg: string; text: string; marker: string }
> = {
  "가입 번호 발급": { bg: "#EBF0FA", text: "#4A74E0", marker: "#4A74E0" },
  "비활성화": { bg: "#FBEAEC", text: "#D6455D", marker: "#D6455D" },
  "재활성화": { bg: "#E8F5EF", text: "#4AA785", marker: "#4AA785" },
  "관리자 가입 완료": { bg: "#F0EBFA", text: "#7A5AF8", marker: "#7A5AF8" },
  "계정 삭제": { bg: "#FEF2F2", text: "#DC2626", marker: "#DC2626" },
  "비밀번호 재설정": { bg: "#FFF7ED", text: "#EA580C", marker: "#EA580C" },
  "전역 설정 변경": { bg: "#F3F4F6", text: "#6B7280", marker: "#6B7280" },
}

const FILTER_TO_TYPE: Record<string, MasterActivityLogType | undefined> = {
  "전체 상태": undefined,
  "가입 번호 발급": "ADMIN_SIGNUP_CODE_ISSUED",
  "비활성화": "ADMIN_SIGNUP_CODE_DEACTIVATED",
  "재활성화": "ADMIN_SIGNUP_CODE_REACTIVATED",
  "관리자 가입 완료": "ADMIN_SIGNED_UP",
  "계정 삭제": "ADMIN_ACCOUNT_DELETED",
  "비밀번호 재설정": "ADMIN_PASSWORD_RESET",
  "전역 설정 변경": "PLATFORM_SETTINGS_UPDATED",
}

export const MASTER_ACTIVITY_LOG_FILTER_OPTIONS = [
  "전체 상태",
  "가입 번호 발급",
  "비활성화",
  "재활성화",
  "관리자 가입 완료",
  "계정 삭제",
  "비밀번호 재설정",
  "전역 설정 변경",
] as const

export function mapMasterActivityLogFilterToType(filter: string): MasterActivityLogType | undefined {
  return FILTER_TO_TYPE[filter]
}

export function getMasterActivityLogStatusLabel(type: MasterActivityLogType): MasterActivityLogStatusLabel {
  return MASTER_ACTIVITY_LOG_TYPE_LABEL[type]
}

export function getMasterActivityLogColors(type: MasterActivityLogType) {
  return masterActivityLogStatusColors[getMasterActivityLogStatusLabel(type)]
}

export function formatMasterActivityLogDateTime(iso: string): string {
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

export function getMasterActivityLogDateKey(iso: string): string {
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

export function formatMasterActivityLogDateHeader(dateKey: string): string {
  if (dateKey === "-") return dateKey
  const parts = dateKey.split(". ")
  if (parts.length >= 3) {
    const year = parts[0].replace(/\./g, "")
    const month = parts[1].replace(/\./g, "")
    const day = parts[2].replace(/\./g, "")
    return `${year}년 ${parseInt(month, 10)}월 ${parseInt(day, 10)}일`
  }
  return dateKey
}
