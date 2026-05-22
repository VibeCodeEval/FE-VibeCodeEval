/** 응시 화면 contentMd(마크다운) → 상세 모달 필드 분리 */

export type ParsedProblemContentMd = {
  description: string
  inputExample: string
  outputExample: string
  constraints: string
}

const EMPTY_INPUT = "등록된 예시가 없습니다."
const EMPTY_OUTPUT = "등록된 예시가 없습니다."
const EMPTY_DESCRIPTION = "등록된 설명이 없습니다."

function extractFirstCodeBlockAfterHeading(contentMd: string, headingRe: RegExp): string {
  const headingMatch = headingRe.exec(contentMd)
  if (!headingMatch) return ""

  const after = contentMd.slice(headingMatch.index + headingMatch[0].length)
  const fenceMatch = after.match(/```[^\n]*\n([\s\S]*?)```/)
  return fenceMatch?.[1]?.trim() ?? ""
}

function extractSectionText(contentMd: string, headingRe: RegExp): string {
  const headingMatch = headingRe.exec(contentMd)
  if (!headingMatch) return ""

  const start = headingMatch.index + headingMatch[0].length
  const rest = contentMd.slice(start)
  const nextHeading = rest.search(/\n##\s+/)
  const sectionBody = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest
  return sectionBody.replace(/```[\s\S]*?```/g, "").trim()
}

/**
 * BOJ/프로젝트 초기 데이터 형식(## 문제, ## 입력, ## 출력, ## 예제 입력 N) 기준 파싱
 */
export function parseProblemContentMd(contentMd: string | null | undefined): ParsedProblemContentMd {
  const raw = (contentMd ?? "").trim()
  if (!raw) {
    return {
      description: EMPTY_DESCRIPTION,
      inputExample: EMPTY_INPUT,
      outputExample: EMPTY_OUTPUT,
      constraints: "정보 없음",
    }
  }

  const inputExample =
    extractFirstCodeBlockAfterHeading(raw, /##\s*예제\s*입력\s*\d*/i) ||
    extractFirstCodeBlockAfterHeading(raw, /##\s*입력\s*예시/i) ||
    extractFirstCodeBlockAfterHeading(raw, /##\s*입력\s*예제/i) ||
    EMPTY_INPUT

  const outputExample =
    extractFirstCodeBlockAfterHeading(raw, /##\s*예제\s*출력\s*\d*/i) ||
    extractFirstCodeBlockAfterHeading(raw, /##\s*출력\s*예시/i) ||
    extractFirstCodeBlockAfterHeading(raw, /##\s*출력\s*예제/i) ||
    EMPTY_OUTPUT

  const problemSection = extractSectionText(raw, /##\s*문제\b/i)
  const firstSectionEnd = raw.search(/\n##\s+/)
  const leading =
    firstSectionEnd >= 0 && !/^##\s*문제\b/m.test(raw.slice(0, 20))
      ? raw.slice(0, firstSectionEnd).trim()
      : ""

  const description =
    problemSection ||
    leading ||
    raw.split(/\n##\s+(?:입력|출력|예제)/)[0]?.trim() ||
    EMPTY_DESCRIPTION

  const inputRules = extractSectionText(raw, /##\s*입력\b/i)
  const outputRules = extractSectionText(raw, /##\s*출력\b/i)
  const constraintParts = [inputRules, outputRules].filter(Boolean)
  const constraints = constraintParts.length > 0 ? constraintParts.join("\n\n") : "정보 없음"

  return {
    description,
    inputExample: inputExample || EMPTY_INPUT,
    outputExample: outputExample || EMPTY_OUTPUT,
    constraints,
  }
}

export function formatAssignmentLimits(
  limits: { timeMs: number; memoryMb: number } | undefined
): string {
  if (!limits) return ""
  return `시간 제한 ${limits.timeMs}ms · 메모리 ${limits.memoryMb}MB`
}
