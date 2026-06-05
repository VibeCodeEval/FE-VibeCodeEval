/**
 * MASTER 플랫폼 전역 설정 — UI 헬퍼 및 타입 (API는 admin.ts)
 */

export type {
  MasterPlatformSettings,
  UpdateMasterPlatformSettingsPayload,
} from "@/lib/api/admin"

export {
  getMasterPlatformSettings,
  updateMasterPlatformSettings,
} from "@/lib/api/admin"

export const RETENTION_DAY_OPTIONS = [
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "6개월", days: 180 },
  { label: "1년", days: 365 },
] as const

export function daysToRetentionLabel(days: number): string {
  const found = RETENTION_DAY_OPTIONS.find((o) => o.days === days)
  return found?.label ?? `${days}일`
}

const RETENTION_LABEL_DAYS_PATTERN = /^(\d+)\s*일?\s*$/

export function retentionLabelToDays(label: string): number {
  const found = RETENTION_DAY_OPTIONS.find((o) => o.label === label)
  if (found) {
    return found.days
  }

  const trimmed = label.trim()
  const parsed = trimmed.match(RETENTION_LABEL_DAYS_PATTERN)
  if (parsed) {
    const days = Number.parseInt(parsed[1], 10)
    if (Number.isFinite(days) && days > 0) {
      return days
    }
  }

  return 90
}
