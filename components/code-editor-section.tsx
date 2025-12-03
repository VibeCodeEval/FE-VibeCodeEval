"use client"

import type React from "react"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const defaultCode = `# 언어를 선택하시고
# 코드를 여기에 작성하세요.

def compress_string(s):
    # 여기에 코드를 작성하세요
    pass
`

export function CodeEditorSection() {
  const [language, setLanguage] = useState("python")
  const [code, setCode] = useState(defaultCode)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 })

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

  const lineNumbers = code.split("\n").map((_, i) => i + 1)

  return (
    <div className="bg-white rounded-xl border border-[#D0D0D0] flex flex-col flex-1 min-h-0">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <span className="text-sm font-medium text-[#1F2937]">Code Editor</span>
        <Select value={language} onValueChange={setLanguage}>
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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Line Numbers */}
        <div className="bg-[#F9FAFB] border-r border-[#E5E7EB] px-3 py-4 select-none overflow-hidden">
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
          className="flex-1 p-4 font-mono text-sm text-[#1F2937] bg-white resize-none focus:outline-none leading-6"
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
