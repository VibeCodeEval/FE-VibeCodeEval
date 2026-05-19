/**
 * AI 피드백·루브릭 텍스트 표시용 — Markdown 장식만 제거하고 plain text 유지
 * (react-markdown 미사용, inline code 백틱은 유지)
 */

const INLINE_CODE_PATTERN = /(`[^`\n]+`)/g

function cleanupMarkdownProse(prose: string): string {
  let s = prose

  // # heading (줄 시작)
  s = s.replace(/^#{1,6}\s+/gm, "")

  // **bold** / __bold__ (여러 겹이면 반복 제거)
  let prev = ""
  while (prev !== s) {
    prev = s
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "$1")
    s = s.replace(/__([^_\n]+)__/g, "$1")
  }

  // 닫히지 않은 잔여 마커
  s = s.replace(/\*\*/g, "")
  s = s.replace(/__/g, "")

  return s
}

/**
 * AI 피드백 문자열에서 bold/heading 등 Markdown 흔적만 제거합니다.
 * inline code (`...`)·줄바꿈·번호 목록은 유지합니다.
 */
export function cleanupAiFeedbackText(text: string): string {
  if (!text) return text

  const parts = text.split(INLINE_CODE_PATTERN)
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part
      return cleanupMarkdownProse(part)
    })
    .join("")
}
