"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveChatMessage, updateTokenUsage, ChatError, NetworkError } from "@/lib/api/chat"
import { useToast } from "@/components/ui/use-toast"

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
  onTokensUpdate: (delta: number) => void // delta: 이번 요청에서 증가한 토큰 수
}

export function AiAssistantSidebar({ 
  isOpen, 
  onToggle, 
  examId, 
  participantId, 
  usedTokens, 
  onTokensUpdate 
}: AiAssistantSidebarProps) {
  const { toast } = useToast()
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
    
    // 사용자 메시지를 먼저 UI에 추가
    const newUserMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: userMessageContent,
    }
    
    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")
    setIsSending(true)

    try {
      // 1. /api/chat/messages 호출
      const response = await saveChatMessage({
        sessionId: null, // 세션 ID는 백엔드에서 자동 생성/조회
        examId: examId,
        participantId: participantId,
        turn: currentTurn,
        role: "user", // BE에서는 "user" 또는 "USER" 모두 허용하지만, 일관성을 위해 소문자 사용
        content: userMessageContent,
        tokenCount: null, // 사용자 메시지 토큰은 백엔드에서 계산
        meta: null,
      })

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
      // 하지만 Mock 응답의 경우 항상 같은 값을 반환하므로, 실제로는 "이번 요청에서 사용한 토큰 수(delta)"를 계산해야 함
      
      // 이번 요청에서 사용한 토큰 수(delta) 계산
      // 실제 백엔드 응답: totalCount는 전체 누적 토큰이므로, 현재 usedTokens와의 차이를 계산
      // Mock 응답: totalCount가 항상 고정값이므로, tokenCount(이번 AI 응답 토큰) + 사용자 메시지 토큰(대략 30)을 사용
      let tokensDelta = 0;
      
      if (response.totalCount !== null && response.totalCount !== undefined) {
        // 실제 백엔드 응답인 경우: 전체 누적 토큰에서 현재 사용량을 빼서 증가량 계산
        tokensDelta = response.totalCount - usedTokens;
        
        // 만약 계산된 delta가 0 이하이거나 비정상적으로 작으면, Mock 응답이거나 이미 반영된 것으로 간주
        // 이 경우 tokenCount(이번 AI 응답 토큰) + 사용자 메시지 토큰(대략 30)을 사용
        if (tokensDelta <= 0 && response.tokenCount !== null) {
          tokensDelta = response.tokenCount + 30; // AI 응답 토큰 + 사용자 메시지 토큰(대략)
        }
      } else if (response.tokenCount !== null) {
        // totalCount가 없지만 tokenCount가 있는 경우: AI 응답 토큰 + 사용자 메시지 토큰(대략 30)
        tokensDelta = response.tokenCount + 30;
      }
      
      // delta가 0보다 크면 토큰 업데이트 수행
      if (tokensDelta > 0) {
        try {
          // 5. /api/chat/tokens/update 호출
          // BE의 UpdateTokenUsageRequest는 tokens 필드에 "증가량"을 받음 (addTokenUsed 메서드 확인)
          await updateTokenUsage({
            examId: examId,
            participantId: participantId,
            tokens: tokensDelta, // 증가량 전달
          })

          // 6. 프론트에서 토큰 상태 업데이트 (delta를 전달하여 부모에서 prev + delta로 누적)
          onTokensUpdate(tokensDelta)
        } catch (tokenError) {
          console.error("[AiAssistantSidebar] 토큰 업데이트 실패:", tokenError)
          
          // 토큰 업데이트 실패해도 UI는 업데이트 (일관성 유지)
          // TODO: 토큰 동기화 실패 시 재시도 로직 고려
          onTokensUpdate(tokensDelta)
          
          toast({
            variant: "destructive",
            title: "토큰 업데이트 실패",
            description: "토큰 사용량 업데이트에 실패했습니다. 화면에 표시된 값이 실제와 다를 수 있습니다.",
          })
        }
      } else {
        // delta가 0 이하인 경우에도, 최소한 AI 응답 토큰은 사용되었다고 가정
        // (Mock 응답의 경우 항상 50 + 30 = 80을 사용)
        const fallbackDelta = response.tokenCount !== null ? response.tokenCount + 30 : 80;
        
        try {
          await updateTokenUsage({
            examId: examId,
            participantId: participantId,
            tokens: fallbackDelta,
          })
          onTokensUpdate(fallbackDelta)
        } catch (tokenError) {
          console.error("[AiAssistantSidebar] 토큰 업데이트 실패 (fallback):", tokenError)
          onTokensUpdate(fallbackDelta)
        }
      }
    } catch (error) {
      console.error("[AiAssistantSidebar] 메시지 전송 실패:", error)
      
      // 에러 발생 시 사용자 메시지 제거 (롤백)
      setMessages((prev) => prev.filter((msg) => msg.id !== newUserMessage.id))
      
      let errorMessage = "메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요."
      
      if (error instanceof ChatError) {
        errorMessage = error.message
      } else if (error instanceof NetworkError) {
        errorMessage = error.message
      }
      
      toast({
        variant: "destructive",
        title: "전송 실패",
        description: errorMessage,
      })
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
