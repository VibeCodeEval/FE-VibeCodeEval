"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface CodeEditorSectionProps {
  isReadOnly?: boolean;
}

export function CodeEditorSection({ isReadOnly = false }: CodeEditorSectionProps) {
  const [language, setLanguage] = useState("python")
  // 각 언어별로 작성한 코드를 저장
  const [languageCodes, setLanguageCodes] = useState<Record<string, string>>({
    python: defaultCodeTemplates.python,
    java: defaultCodeTemplates.java,
    cpp: defaultCodeTemplates.cpp,
    javascript: defaultCodeTemplates.javascript,
  })
  const [code, setCode] = useState(defaultCodeTemplates.python)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 })

  const lineNumberRef = useRef<HTMLDivElement | null>(null);

  const handleLanguageChange = (newLanguage: string) => {
    // 현재 언어의 코드를 저장하고, 새 언어의 코드를 불러오기
    setLanguageCodes((prev) => {
      const updated = {
        ...prev,
        [language]: code,
      }
      // 새 언어의 저장된 코드를 불러오기 (없으면 기본 템플릿 사용)
      const newCode = updated[newLanguage] || defaultCodeTemplates[newLanguage] || defaultCodeTemplates.python
      setCode(newCode)
      return updated
    })
    // 새 언어로 변경
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

  const MIN_LINES = 15;

  const actualLineCount = code.split("\n").length || 1;
  const lineCount = Math.max(MIN_LINES, actualLineCount);

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] flex flex-col flex-1 min-h-0">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <span className="text-sm font-medium text-[#1F2937]">Code Editor</span>
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
          value={code}
          onChange={handleTextChange}
          onClick={(e) => updateCursorPosition(e.currentTarget)}
          onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
          onScroll={handleEditorScroll}
          rows={15}
          readOnly={isReadOnly}
          disabled={isReadOnly}
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
}
