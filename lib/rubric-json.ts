/** scores.rubric_json 파싱·접근 유틸 (관리자 평가 리포트용) */

export type RubricJsonRecord = Record<string, unknown>

export type ParseRubricJsonResult =
  | { ok: true; data: RubricJsonRecord; raw: string }
  | { ok: false; raw: string; error?: string }

export function parseRubricJson(
  input: string | RubricJsonRecord | null | undefined
): ParseRubricJsonResult | null {
  if (input == null) return null
  if (typeof input === "object" && !Array.isArray(input)) {
    return { ok: true, data: input as RubricJsonRecord, raw: JSON.stringify(input, null, 2) }
  }
  const raw = String(input).trim()
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, data: parsed as RubricJsonRecord, raw }
    }
    return { ok: false, raw, error: "object가 아님" }
  } catch (e) {
    return { ok: false, raw, error: e instanceof Error ? e.message : "parse 실패" }
  }
}

export function isRecord(v: unknown): v is RubricJsonRecord {
  return v != null && typeof v === "object" && !Array.isArray(v)
}

export function hasPresentValue(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim().length > 0
  if (typeof v === "number") return !Number.isNaN(v)
  if (Array.isArray(v)) return v.length > 0
  if (isRecord(v)) return Object.keys(v).length > 0
  return true
}

export function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === "string") {
    const t = v.trim()
    return t.length > 0 ? t : null
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return null
}

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((item) => {
      if (typeof item === "string") return item.trim()
      if (item != null && typeof item === "object") return JSON.stringify(item)
      return item != null ? String(item) : ""
    })
    .filter((s) => s.length > 0)
}

export function asRecordArray(v: unknown): RubricJsonRecord[] {
  if (!Array.isArray(v)) return []
  return v.filter(isRecord)
}

/** rubric 최상위 또는 중첩에서 숫자 점수 조회 */
export function pickScore(data: RubricJsonRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const n = asNumber(data[key])
    if (n !== null) return n
  }
  return null
}

export function pickNestedNumber(obj: unknown, ...path: string[]): number | null {
  let cur: unknown = obj
  for (const key of path) {
    if (!isRecord(cur)) return null
    cur = cur[key]
  }
  return asNumber(cur)
}

export function pickNestedString(obj: unknown, ...path: string[]): string | null {
  let cur: unknown = obj
  for (const key of path) {
    if (!isRecord(cur)) return null
    cur = cur[key]
  }
  return asString(cur)
}

export interface HolisticAnalysisSection {
  title: string
  body: string
}

const HOLISTIC_SECTION_PATTERN =
  /\[(합의 요약|종합 분석|점수 근거|R4 맥락 유지)\]/g

export function splitHolisticFlowAnalysis(text: string): HolisticAnalysisSection[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const markers: { index: number; title: string }[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(HOLISTIC_SECTION_PATTERN.source, "g")
  while ((match = re.exec(trimmed)) !== null) {
    markers.push({ index: match.index, title: match[1] })
  }

  if (markers.length === 0) {
    return [{ title: "종합 분석", body: trimmed }]
  }

  const sections: HolisticAnalysisSection[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index
    const headerEnd = start + markers[i].title.length + 2
    const end = i + 1 < markers.length ? markers[i + 1].index : trimmed.length
    const body = trimmed.slice(headerEnd, end).trim()
    if (body) sections.push({ title: markers[i].title, body })
  }
  return sections
}

export function collectDebateEntries(data: RubricJsonRecord): RubricJsonRecord[] {
  for (const key of ["debate_log", "debate_rebuttals", "debate_initial_opinions"] as const) {
    const arr = asRecordArray(data[key])
    if (arr.length > 0) return arr
  }
  return []
}

export function isVerdictDebateEntry(entry: RubricJsonRecord): boolean {
  return asString(entry.agent)?.toLowerCase() === "verdict"
}

/** debate 항목의 라운드 번호 (데이터에 있는 값만, 1 이상 정수) */
export function pickDebateRoundNumber(entry: RubricJsonRecord): number | null {
  const raw = entry.round ?? entry.round_number ?? entry.roundNumber
  const n = asNumber(raw)
  if (n === null || n <= 0) return null
  return Math.trunc(n)
}

export interface GroupedDebateEntries {
  /** 데이터에 실제 존재하는 라운드 번호 (오름차순, 고정 개수 없음) */
  roundNumbers: number[]
  byRound: Map<number, RubricJsonRecord[]>
  verdicts: RubricJsonRecord[]
}

export function groupDebateEntriesByRound(entries: RubricJsonRecord[]): GroupedDebateEntries {
  const verdicts = entries.filter(isVerdictDebateEntry)
  const opinions = entries.filter((e) => !isVerdictDebateEntry(e))
  const byRound = new Map<number, RubricJsonRecord[]>()

  for (const entry of opinions) {
    const round = pickDebateRoundNumber(entry)
    if (round === null) continue
    const list = byRound.get(round) ?? []
    list.push(entry)
    byRound.set(round, list)
  }

  const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b)

  return { roundNumbers, byRound, verdicts }
}

export function rubricHasStructuredFields(data: RubricJsonRecord): boolean {
  if (asString(data.grade)) return true
  if (pickScore(data, "total_score", "totalScore") !== null) return true
  if (pickScore(data, "prompt_score", "promptScore") !== null) return true
  if (
    pickScore(
      data,
      "correctness_score",
      "code_correctness_score",
      "performance_score",
      "code_performance_score"
    ) !== null
  ) {
    return true
  }
  if (pickScore(data, "holistic_flow_score") !== null) return true
  if (isRecord(data.weights) && Object.keys(data.weights).length > 0) return true
  if (asString(data.holistic_flow_analysis)) return true
  if (isRecord(data.code_eval_report) || isRecord(data.codeEvalReport)) return true
  if (collectDebateEntries(data).length > 0) return true
  if (isRecord(data.turn_scores) || isRecord(data.turnScores)) return true
  if (isRecord(data.code_quality_metrics) || isRecord(data.codeQualityMetrics)) return true
  return false
}

export function formatWeightLabel(value: unknown, label: string): string | null {
  const n = asNumber(value)
  if (n === null) return null
  const pct = n <= 1 ? n * 100 : n
  return `${label}: ${pct.toFixed(0)}%`
}

export function formatRubricJsonPretty(data: RubricJsonRecord | string): string {
  if (typeof data === "string") return data
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
