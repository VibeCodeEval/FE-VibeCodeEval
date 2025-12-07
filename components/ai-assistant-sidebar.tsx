"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: number
  role: "assistant" | "user"
  content: string
}

interface AiAssistantSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AiAssistantSidebar({ isOpen, onToggle }: AiAssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "무엇을 도와드릴까요? 도움이 필요하시면 말씀해주세요!",
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newUserMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
    }

    const newAssistantMessage: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: "네, 알겠습니다. 문자열 압축 문제에 대해 도움을 드릴게요. 어떤 부분이 어려우신가요?",
    }

    setMessages([...messages, newUserMessage, newAssistantMessage])
    setInputValue("")
  }

  return (
    <>
      {/* Collapsed Tab */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="bg-[#2563EB] text-white px-2 py-6 rounded-l-lg shadow-lg flex flex-col items-center gap-2 hover:bg-[#1D4ED8] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-medium" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
            AI Assistant
          </span>
        </div>
      </button>

      {/* Expanded Sidebar */}
      <aside
        className={`fixed right-0 top-[73px] h-[calc(100vh-73px)] w-[400px] bg-white border-l border-[#D0D0D0] shadow-lg transition-transform duration-300 ease-in-out z-30 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1F2937]">AI 어시스턴트</span>
          </div>
          <button onClick={onToggle} className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
            <ChevronRight className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "assistant" ? "bg-[#2563EB]" : "bg-[#6B7280]"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[280px] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  message.role === "assistant"
                    ? "bg-[#F3F4F6] text-[#1F2937] rounded-tl-sm"
                    : "bg-[#2563EB] text-white rounded-tr-sm"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="메시지를 입력하세요…"
              rows={1}
              className="flex-1 bg-white border-[#D0D0D0] resize-none whitespace-normal break-words"
            />
            <Button onClick={handleSend} size="icon" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-2">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-2 text-center">AI가 힌트를 제공할 수 있습니다. 토큰이 차감됩니다.</p>
        </div>
      </aside>
    </>
  )
}
