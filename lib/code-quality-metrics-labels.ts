/** 코드 품질 메트릭 화면 표시용 라벨 (값/계산 로직과 무관) */

import { asNumber, asString, isRecord } from "@/lib/rubric-json"

const CODE_QUALITY_METRIC_LABELS: Record<string, string> = {
  "radon_cc.avg_cc": "평균 순환 복잡도",
  "radon_cc.max_cc": "최대 순환 복잡도",
  "radon_cc.junior_grade": "주니어 기준 초과 여부",
  "reference_radon_cc.avg_cc": "기준 평균 순환 복잡도",
  "reference_radon_cc.max_cc": "기준 최대 순환 복잡도",
  "delta_cc_vs_reference.delta_cc_pct": "기준 대비 복잡도 증가율(%)",
  "delta_cc_vs_reference.v1_avg_cc": "기준 평균 순환 복잡도",
  "delta_cc_vs_reference.v2_avg_cc": "제출 평균 순환 복잡도",
  "delta_cc_vs_reference.v1_max_cc": "기준 최대 순환 복잡도",
  "delta_cc_vs_reference.v2_max_cc": "제출 최대 순환 복잡도",
  "delta_cc.delta_cc_pct": "이전 코드 대비 복잡도 증가율(%)",
  "delta_cc.v1_avg_cc": "이전 평균 순환 복잡도",
  "delta_cc.v2_avg_cc": "현재 평균 순환 복잡도",
  "delta_cc.v1_max_cc": "이전 최대 순환 복잡도",
  "delta_cc.v2_max_cc": "현재 최대 순환 복잡도",
  "v2_metrics.radon_cc.avg_cc": "현재 평균 순환 복잡도",
  "v2_metrics.radon_cc.max_cc": "현재 최대 순환 복잡도",
  has_v1: "이전 코드 존재 여부",
  junior_grade: "주니어 기준 초과 여부",
  ast_applicable: "AST 패턴 검사 적용 여부",
  ast_pattern_matched: "AST 패턴 일치 여부",
}

export function formatCodeQualityMetricLabel(metricKey: string): string {
  return CODE_QUALITY_METRIC_LABELS[metricKey] ?? metricKey
}

function formatFunctionComplexityRecord(record: Record<string, unknown>): string | null {
  const name = asString(record.name) ?? asString(record.function)
  const complexity = asNumber(record.complexity ?? record.cc)
  if (name && complexity !== null) {
    return `${name}: 복잡도 ${complexity}`
  }
  if (name) return name
  return null
}

function parseFunctionComplexityLine(item: unknown): string | null {
  if (item == null) return null

  if (typeof item === "string") {
    const trimmed = item.trim()
    if (!trimmed) return null
    if (trimmed.startsWith("{")) {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (isRecord(parsed)) return formatFunctionComplexityRecord(parsed)
      } catch {
        /* 원문 fallback */
      }
    }
    return trimmed
  }

  if (isRecord(item)) {
    return formatFunctionComplexityRecord(item)
  }

  return String(item)
}

/** functions 배열을 사람이 읽기 쉬운 줄 목록으로 변환 (중복 제거) */
export function collectFunctionComplexityDisplayLines(...sources: unknown[]): string[] {
  const seen = new Set<string>()
  const lines: string[] = []

  for (const source of sources) {
    if (!Array.isArray(source)) continue
    for (const item of source) {
      const line = parseFunctionComplexityLine(item)
      if (!line || seen.has(line)) continue
      seen.add(line)
      lines.push(line)
    }
  }

  return lines
}
