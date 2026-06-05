import { MarkdownContent, MARKDOWN_CONTENT_CLASS } from "@/components/markdown-content"

/**
 * 문제 본문(contentMd) 표시 — 사용자 시험 화면(problem-section)과 동일한 스타일
 * @deprecated MARKDOWN_CONTENT_CLASS 사용 권장; 하위 호환용 유지
 */
export const PROBLEM_CONTENT_MD_CLASS = MARKDOWN_CONTENT_CLASS

type ProblemContentMdViewProps = {
  contentMd: string | null | undefined
  className?: string
  emptyLabel?: string
  /** 모달 등 긴 본문용 내부 스크롤 */
  scrollable?: boolean
  maxHeight?: string
}

export function ProblemContentMdView({
  contentMd,
  className = "",
  emptyLabel = "등록된 문제 본문이 없습니다.",
  scrollable = false,
  maxHeight,
}: ProblemContentMdViewProps) {
  const text = contentMd?.trim()

  if (!text) {
    return <p className="text-sm text-[#6B7280]">{emptyLabel}</p>
  }

  return (
    <div
      className={[scrollable ? "overflow-y-auto" : "", className].filter(Boolean).join(" ")}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <MarkdownContent content={text} />
    </div>
  )
}
