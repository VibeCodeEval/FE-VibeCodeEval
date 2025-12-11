"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveChatMessage, updateTokenUsage } from "@/lib/api/chat"

interface Message {
  id: number
  role: "assistant" | "user"
  content: string
}

interface AiAssistantSidebarProps {
  isOpen: boolean
  onToggle: () => void
  examId: number
  participantId: number
  usedTokens: number
  onTokensUpdate: (delta: number) => void
}

export function AiAssistantSidebar({ 
  isOpen, 
  onToggle, 
  examId, 
  participantId, 
  usedTokens, 
  onTokensUpdate 
}: AiAssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "무엇을 도와드릴까요? 도움이 필요하시면 말씀해주세요!",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(1) // turn은 1부터 시작

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessageContent = inputValue.trim()
    
    // 사용자 메시지를 먼저 UI에 추가 (optimistic UI)
    const newUserMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: userMessageContent,
    }
    
    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")
    setIsSending(true)

    try {
      // Swagger 스펙에 맞게 payload 구성
      const payload = {
        sessionId: undefined, // 세션 ID는 백엔드에서 자동 생성/조회 (선택 필드)
        examId: examId,
        participantId: participantId,
        turn: currentTurn,
        role: "USER", // Swagger 예시는 "USER" (대문자)
        content: userMessageContent,
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[saveChatMessage] payload', payload);
      }

      // 1. /api/chat/messages 호출
      const response = await saveChatMessage(payload)

      // 2. AI 응답을 UI에 추가
      const newAssistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: response.content || "응답을 받지 못했습니다.",
      }
      
      setMessages((prev) => [...prev, newAssistantMessage])
      
      // 3. turn 증가 (다음 사용자 메시지를 위해)
      setCurrentTurn((prev) => prev + 1)

      // 4. 토큰 사용량 처리
      // response.totalCount는 전체 누적 토큰 수 (사용자 질문 토큰 + AI 응답 토큰)
      // 이번 요청에서 사용한 토큰 수(delta) 계산
      let tokensDelta = 0;
      
      if (response.totalCount !== null && response.totalCount !== undefined) {
        // 실제 백엔드 응답인 경우: 전체 누적 토큰에서 현재 사용량을 빼서 증가량 계산
        tokensDelta = response.totalCount - usedTokens;
        
        // 만약 계산된 delta가 0 이하이면, Mock 응답이거나 이미 반영된 것으로 간주
        // 이 경우 tokenCount(이번 AI 응답 토큰) + 사용자 메시지 토큰(대략 30)을 사용
        if (tokensDelta <= 0 && response.tokenCount !== null) {
          tokensDelta = response.tokenCount + 30; // AI 응답 토큰 + 사용자 메시지 토큰(대략)
        }
      } else if (response.tokenCount !== null) {
        // totalCount가 없지만 tokenCount가 있는 경우: AI 응답 토큰 + 사용자 메시지 토큰(대략 30)
        tokensDelta = response.tokenCount + 30;
      } else {
        // 둘 다 없는 경우 기본값 사용 (Mock 응답의 경우)
        tokensDelta = 80; // Mock 응답의 기본값
      }
      
      // delta가 0보다 크면 토큰 업데이트 수행
      if (tokensDelta > 0) {
        try {
          const tokenUpdatePayload = {
            examId: examId,
            participantId: participantId,
            tokens: tokensDelta, // 증가량 전달
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('[updateChatTokens] payload', tokenUpdatePayload);
          }

          // 5. /api/chat/tokens/update 호출
          await updateTokenUsage(tokenUpdatePayload)

          // 6. 프론트에서 토큰 상태 업데이트 (delta를 전달하여 부모에서 prev + delta로 누적)
          onTokensUpdate(tokensDelta)
        } catch (tokenError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("[AiAssistantSidebar] 토큰 업데이트 실패:", tokenError)
          }
          
          // 토큰 업데이트 실패해도 UI는 업데이트 (일관성 유지)
          onTokensUpdate(tokensDelta)
        }
      }
    } catch (error) {
      // saveChatMessage는 이제 throw를 하지 않으므로, 이 블록은 거의 실행되지 않습니다.
      // 하지만 예상치 못한 에러에 대비해 안전하게 처리합니다.
      if (process.env.NODE_ENV === 'development') {
        console.warn("[AiAssistantSidebar] 예상치 못한 에러 발생:", error)
      }
      
      // 에러가 발생해도 UI는 유지하고, 조용히 Mock 응답을 표시
      // saveChatMessage가 항상 Mock 응답을 반환하므로, 여기서는 로딩 상태만 정리
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

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
        className={`fixed right-0 top-[73px] h-[calc(100vh-73px)] w-[400px] bg-white border-l border-[#D0D0D0] shadow-2xl transition-transform duration-300 ease-in-out z-30 flex flex-col ${
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="메시지를 입력하세요…"
              rows={1}
              className="flex-1 bg-white border-[#D0D0D0] resize-none whitespace-normal break-words"
              disabled={isSending}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-2 text-center">AI가 힌트를 제공할 수 있습니다. 토큰이 차감됩니다.</p>
        </div>
      </aside>
    </>
  )
}
