"use client"

import type React from "react"

import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveCodeDraft, getCodeDraft, submitCode, SubmissionStatus } from "@/lib/api/submissions"

const DRAFT_SAVE_DEBOUNCE_MS = 3000

const SUPPORTED_LANGUAGES = ["python", "java", "cpp", "javascript"] as const

const defaultCodeTemplates: Record<string, string> = {
  python: `# 언어를 선택하시고
# 코드를 여기에 작성하세요.

def compress_string(s):
    # 여기에 코드를 작성하세요
    pass
`,
  java: `// 언어를 선택하시고
// 코드를 여기에 작성하세요.

public class Solution {
    public String compressString(String s) {
        // 여기에 코드를 작성하세요
        return "";
    }
}
`,
  cpp: `// 언어를 선택하시고
// 코드를 여기에 작성하세요.

#include <string>
using namespace std;

string compressString(string s) {
    // 여기에 코드를 작성하세요
    return "";
}
`,
  javascript: `// 언어를 선택하시고
// 코드를 여기에 작성하세요.

function compressString(s) {
    // 여기에 코드를 작성하세요
    return "";
}
`,
}

function createDefaultLanguageCodes(): Record<string, string> {
  return {
    python: defaultCodeTemplates.python,
    java: defaultCodeTemplates.java,
    cpp: defaultCodeTemplates.cpp,
    javascript: defaultCodeTemplates.javascript,
  }
}

/** BE draft language → Select value */
function normalizeDraftLanguage(raw: string | null | undefined): string {
  const value = (raw ?? "python").trim().toLowerCase()
  if (value.startsWith("python")) return "python"
  if (value.startsWith("java")) return "java"
  if (value === "cpp" || value === "c++" || value.startsWith("cpp")) return "cpp"
  if (value === "javascript" || value === "js" || value.startsWith("javascript")) return "javascript"
  return "python"
}

// 제출 상태 레이블 매핑
const STATUS_LABEL: Record<SubmissionStatus, string> = {
  PENDING:              "제출 완료 — 채점 대기 중",
  JUDGING:              "채점 중…",
  ACCEPTED:             "✅ 정답",
  WRONG_ANSWER:         "❌ 오답",
  TIME_LIMIT_EXCEEDED:  "⏱ 시간 초과",
  MEMORY_LIMIT_EXCEEDED:"💾 메모리 초과",
  RUNTIME_ERROR:        "🔥 런타임 오류",
  COMPILE_ERROR:        "🔨 컴파일 오류",
  SYSTEM_ERROR:         "⚠️ 시스템 오류",
}

const STATUS_COLOR: Record<SubmissionStatus, string> = {
  PENDING:              "text-[#6B7280] bg-[#F3F4F6]",
  JUDGING:              "text-foreground bg-muted",
  ACCEPTED:             "text-[#059669] bg-[#ECFDF5]",
  WRONG_ANSWER:         "text-[#DC2626] bg-[#FEF2F2]",
  TIME_LIMIT_EXCEEDED:  "text-[#D97706] bg-[#FFFBEB]",
  MEMORY_LIMIT_EXCEEDED:"text-[#D97706] bg-[#FFFBEB]",
  RUNTIME_ERROR:        "text-[#DC2626] bg-[#FEF2F2]",
  COMPILE_ERROR:        "text-[#DC2626] bg-[#FEF2F2]",
  SYSTEM_ERROR:         "text-[#6B7280] bg-[#F3F4F6]",
}

interface CodeEditorSectionProps {
  isReadOnly?: boolean;
  examId?: number | null;
  /** 제출 완료 후 submissionId를 부모에 전달 (SSE 구독 트리거) */
  onSubmitted?: (submissionId: number) => void;
}

/** 부모(헤더 제출 확인 모달 등)에서 POST 제출을 트리거할 때 사용 */
export type CodeEditorSectionHandle = {
  /** POST /api/exams/{examId}/submissions — 성공 시 true */
  submit: () => Promise<boolean>;
};

export const CodeEditorSection = forwardRef<CodeEditorSectionHandle, CodeEditorSectionProps>(function CodeEditorSection(
  {
  isReadOnly = false,
  examId,
  onSubmitted,
}: CodeEditorSectionProps,
  ref
) {
  const [language, setLanguage] = useState("python")
  const [languageCodes, setLanguageCodes] = useState<Record<string, string>>({})
  const [code, setCode] = useState("")
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 })

  const applyDefaultTemplate = useCallback(() => {
    const defaults = createDefaultLanguageCodes()
    setLanguage("python")
    setLanguageCodes(defaults)
    setCode(defaults.python)
  }, [])

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmissionStatus | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const lineNumberRef = useRef<HTMLDivElement | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  // 시험 화면 진입 시 서버 draft 1회 로드 (Strict Mode remount 대응 — ref로 skip하지 않음)
  useEffect(() => {
    if (!examId) {
      applyDefaultTemplate()
      setDraftHydrated(true)
      return
    }

    if (isReadOnly) {
      applyDefaultTemplate()
      setDraftHydrated(true)
      return
    }

    let cancelled = false
    setDraftHydrated(false)

    getCodeDraft(examId)
      .then((draft) => {
        if (cancelled) return

        const restored = draft?.codeInline?.trim()
        if (restored) {
          const lang = normalizeDraftLanguage(draft?.language)
          const safeLang = SUPPORTED_LANGUAGES.includes(lang as (typeof SUPPORTED_LANGUAGES)[number])
            ? lang
            : "python"
          setLanguage(safeLang)
          setCode(restored)
          setLanguageCodes({
            ...createDefaultLanguageCodes(),
            [safeLang]: restored,
          })
          return
        }

        applyDefaultTemplate()
      })
      .catch(() => {
        if (!cancelled) applyDefaultTemplate()
      })
      .finally(() => {
        if (!cancelled) setDraftHydrated(true)
      })

    return () => {
      cancelled = true
    }
  }, [examId, isReadOnly, applyDefaultTemplate])

  const handleLanguageChange = (newLanguage: string) => {
    setLanguageCodes((prev) => {
      const updated = { ...prev, [language]: code }
      const newCode =
        updated[newLanguage] ||
        defaultCodeTemplates[newLanguage] ||
        defaultCodeTemplates.python
      setCode(newCode)
      return updated
    })
    setLanguage(newLanguage)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    updateCursorPosition(e.target)
  }

  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const text = textarea.value.substring(0, textarea.selectionStart)
    const lines = text.split("\n")
    const line = lines.length
    const col = lines[lines.length - 1].length + 1
    setCursorPosition({ line, col })
  }

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  /** 코드 제출 — 에디터 버튼·부모 ref 동시 사용 */
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!examId) {
      setSubmitError("시험 정보가 없습니다.")
      return false
    }
    if (!code.trim()) {
      setSubmitError("코드를 작성해주세요.")
      return false
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitStatus("PENDING")

    try {
      const result = await submitCode(examId, { lang: language, code })
      setSubmitStatus(result.status)
      onSubmitted?.(result.submissionId)
      return true
    } catch (err: any) {
      setSubmitError(err.message || "코드 제출에 실패했습니다.")
      setSubmitStatus(null)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [examId, language, code, onSubmitted])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => handleSubmit(),
    }),
    [handleSubmit]
  )

  // 자동 제출용 코드 스냅샷 (debounce) — draft 로드 완료 후에만 저장
  useEffect(() => {
    if (!examId || isReadOnly || !draftHydrated || !code.trim()) return

    const timer = window.setTimeout(() => {
      saveCodeDraft(examId, { lang: language, code }).catch(() => {
        // 초안 저장 실패는 시험 UX를 막지 않음
      })
    }, DRAFT_SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [examId, isReadOnly, draftHydrated, language, code])

  const MIN_LINES = 15;
  const actualLineCount = code.split("\n").length || 1;
  const lineCount = Math.max(MIN_LINES, actualLineCount);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl border border-app-border flex flex-col flex-1 min-h-0">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <span className="text-sm font-medium text-[#1F2937]">Code Editor</span>
        <div className="flex shrink-0 items-center">
          <Select value={language} onValueChange={handleLanguageChange} disabled={isReadOnly}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 제출 상태 배너 */}
      {(submitStatus || submitError) && (
        <div
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
            submitError
              ? "text-[#DC2626] bg-[#FEF2F2]"
              : submitStatus
              ? STATUS_COLOR[submitStatus]
              : ""
          }`}
        >
          {submitError ? (
            <span>⚠️ {submitError}</span>
          ) : submitStatus ? (
            <>
              <span>{STATUS_LABEL[submitStatus]}</span>
              {(submitStatus === "PENDING" || submitStatus === "JUDGING") && (
                <svg className="animate-spin w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Editor Content */}
      <div className="flex flex-1 min-h-0">
        {/* Line Numbers */}
        <div
          ref={lineNumberRef}
          className="bg-[#F9FAFB] border-r border-[#E5E7EB] px-3 py-4 select-none overflow-hidden"
        >
          <div className="font-mono text-sm text-[#9CA3AF] leading-6 text-right">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>
        </div>

        {/* Code Area */}
        <textarea
          key={examId != null ? `code-editor-${examId}` : "code-editor"}
          value={code}
          onChange={handleTextChange}
          onClick={(e) => updateCursorPosition(e.currentTarget)}
          onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
          onScroll={handleEditorScroll}
          rows={15}
          readOnly={isReadOnly || (!draftHydrated && !!examId)}
          disabled={isReadOnly || (!draftHydrated && !!examId)}
          placeholder={!draftHydrated && examId ? "저장된 코드를 불러오는 중…" : undefined}
          className={`flex-1 p-4 font-mono text-sm text-[#1F2937] bg-white resize-none focus:outline-none leading-6 ${
            isReadOnly ? "cursor-not-allowed opacity-75" : ""
          }`}
          spellCheck={false}
        />
      </div>

      {/* Editor Footer */}
      <div className="px-4 py-2 border-t border-[#E5E7EB] bg-[#F9FAFB]">
        <span className="text-xs text-[#6B7280] font-mono">
          Ln {cursorPosition.line}, Col {cursorPosition.col}
        </span>
      </div>
    </div>
  )
})
