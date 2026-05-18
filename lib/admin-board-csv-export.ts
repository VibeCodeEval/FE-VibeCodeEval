import {
  formatBoardSubmissionLabelKo,
  type ExamineeBoardEntry,
} from "@/lib/api/admin"
import { computeParticipantLetterGrade } from "@/lib/admin-board-analytics"

export interface BoardCsvRowInput {
  entry: ExamineeBoardEntry
  examLabel: string
}

function toNumericScore(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

/** 채점·미채점 구분 — 없으면 "–", 0점은 "0.0" */
export function formatCsvScoreDisplay(value: number | null | undefined): string {
  const n = toNumericScore(value)
  if (n === null) return "–"
  return n.toFixed(1)
}

/** Excel에서 앞자리 0·한글 깨짐 방지용 텍스트 셀 */
export function formatCsvExcelTextCell(value: string): string {
  return `="${String(value).replace(/"/g, '""')}"`
}

/** RFC 4180 — 쉼표·줄바꿈·따옴표 포함 값 이스케이프 */
export function escapeCsvCell(value: string): string {
  const str = String(value ?? "")
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface KeyValueCsvRow {
  label: string
  value: string
  /** 값을 Excel 문자열 수식(="051700")으로보낼지 */
  excelTextValue?: boolean
}

/** 항목/값 2열 key-value CSV 본문 (BOM은 downloadUtf8Csv에서 추가) */
export function buildKeyValueCsvBody(rows: KeyValueCsvRow[]): string {
  const lines = [
    `${escapeCsvCell("항목")},${escapeCsvCell("값")}`,
    ...rows.map(({ label, value, excelTextValue }) => {
      const valueCell = excelTextValue ? formatCsvExcelTextCell(value) : escapeCsvCell(value)
      return `${escapeCsvCell(label)},${valueCell}`
    }),
  ]
  return lines.join("\n")
}

export function buildParticipantEvaluationCsvFilename(
  examLabel: string,
  participantName: string
): string {
  const examSeg = sanitizeCsvFilenameSegment(examLabel)
  const nameSeg = sanitizeCsvFilenameSegment(participantName)
  return `participant-evaluation-${examSeg}-${nameSeg}.csv`
}

export function sanitizeCsvFilenameSegment(name: string): string {
  const sanitized = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim()
  return sanitized.length > 0 ? sanitized : "session"
}

export function buildBoardParticipantsCsvBody(
  rows: BoardCsvRowInput[],
  options?: { includeScores?: boolean }
): string {
  const includeScores = options?.includeScores ?? false
  const header = includeScores
    ? "이름,시험,제출상태,등급,총점,프롬프트 점수,성능 점수,정답률 점수"
    : "이름,시험,제출상태,등급"

  const lines = rows.map(({ entry, examLabel }) => {
    const grade = computeParticipantLetterGrade(entry)
    const status = formatBoardSubmissionLabelKo(entry)
    const examCell = formatCsvExcelTextCell(examLabel)
    const name = entry.name || "–"

    const cells = [name, examCell, status, grade]
    if (includeScores) {
      cells.push(
        formatCsvScoreDisplay(entry.totalScore),
        formatCsvScoreDisplay(entry.promptScore),
        formatCsvScoreDisplay(entry.perfScore),
        formatCsvScoreDisplay(entry.correctnessScore)
      )
    }
    return cells.join(",")
  })

  return `${header}\n${lines.join("\n")}`
}

export function downloadUtf8Csv(filename: string, csvBody: string): void {
  const csvContent = "\uFEFF" + csvBody
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
