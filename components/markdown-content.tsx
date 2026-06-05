"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

/** 마크다운 본문 공통 타이포·블록 스타일 (문제 본문, 이후 AI 채팅 등 재사용) */
export const MARKDOWN_CONTENT_CLASS =
  "markdown-content text-sm leading-relaxed text-[#4B5563] [&_h1]:mt-0 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-[#1F2937] [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[#1F2937] [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#374151] [&_h4]:mt-3 [&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-[#374151] [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_li>p]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D1D5DB] [&_blockquote]:pl-4 [&_blockquote]:text-[#6B7280] [&_a]:text-[#2563EB] [&_a]:underline [&_a]:break-words [&_hr]:my-4 [&_hr]:border-[#E5E7EB] [&_strong]:font-semibold [&_strong]:text-[#1F2937] [&_em]:italic"

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-[#E5E7EB]">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#F9FAFB]">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-[#E5E7EB]">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-[#E5E7EB] last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="whitespace-nowrap px-3 py-2 font-semibold text-[#374151]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="whitespace-pre-wrap break-words px-3 py-2 align-top text-[#4B5563]">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] p-3 font-mono text-xs leading-relaxed text-[#1F2937]">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className={`block whitespace-pre-wrap break-words ${className ?? ""}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-[0.85em] text-[#1F2937]"
        {...props}
      >
        {children}
      </code>
    )
  },
}

export type MarkdownContentProps = {
  /** 마크다운 원문 (서버·AI 등 비신뢰 입력) */
  content: string
  /** 래퍼 추가 클래스 */
  className?: string
}

/**
 * react-markdown + remark-gfm 기반 렌더링.
 * raw HTML(rehype-raw) 및 dangerouslySetInnerHTML 미사용.
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={[MARKDOWN_CONTENT_CLASS, className].filter(Boolean).join(" ")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
