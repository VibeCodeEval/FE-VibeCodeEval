"use client"

import { useState, useCallback, useEffect, useRef, type WheelEvent } from "react"
import { ChevronLeft, ChevronRight, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChatSocket } from "@/hooks/use-chat-socket"
import { updateTokenUsage, getChatHistory } from "@/lib/api/chat"

interface Message {
  id: number
  role: "assistant" | "user"
  content: string
}

const MESSAGE_BUBBLE_BASE_CLASS =
  "min-w-0 max-w-[280px] break-words rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap"

/** 공용 Textarea(min-h-16) 오버라이드 — 내용에 따라 늘어나되 최대 15줄, 이후 내부 스크롤 */
const CHAT_INPUT_CLASS =
  "!min-h-9 max-h-[15lh] min-w-0 flex-1 resize-none overflow-y-auto leading-5 break-words border-[#D0D0D0] bg-white [overflow-wrap:anywhere] whitespace-pre-wrap"

interface AiAssistantSidebarProps {
  isOpen: boolean
  onToggle: () => void
  examId: number
  participantId: number
  onTokensUpdate: (delta: number) => void
}

export function AiAssistantSidebar({
  isOpen,
  onToggle,
  examId,
  participantId,
  onTokensUpdate,
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
  const [currentTurn, setCurrentTurn] = useState(1)
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)

  // 메시지 목록 컨테이너 내부 스크롤 (scrollIntoView는 페이지 전체 스크롤을 유발할 수 있음)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  // ── 채팅 히스토리 초기 로드 ────────────────────────────────────────────────
  useEffect(() => {
    if (isHistoryLoaded) return;

    getChatHistory(examId, participantId)
      .then((history) => {
        if (!history || history.messages.length === 0) return;

        const restored: Message[] = history.messages.map((msg) => ({
          id: msg.id,
          role: (msg.role.toLowerCase() === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.content,
        }));

        // 환영 메시지(id=1) 뒤에 히스토리 삽입
        setMessages([
          {
            id: 1,
            role: "assistant",
            content: "이전 대화를 불러왔습니다. 이어서 질문하셔도 됩니다!",
          },
          ...restored,
        ]);

        // 마지막 turn 번호로 currentTurn 동기화
        const lastTurn = history.messages.at(-1)?.turn ?? 0;
        setCurrentTurn(lastTurn + 1);
      })
      .catch((err) => {
        // 404(히스토리 없음)은 정상 — 초기 메시지 유지
        if (process.env.NODE_ENV === "development") {
          console.warn("[AiAssistantSidebar] getChatHistory 로드 실패:", err);
        }
      })
      .finally(() => {
        setIsHistoryLoaded(true);
      });
  // examId/participantId는 마운트 후 변경되지 않으므로 의도적으로 한 번만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메시지 목록 컨테이너 내부만 하단으로 스크롤 (scrollIntoView 사용 금지)
  useEffect(() => {
    const container = messagesScrollRef.current
    if (!container) return
    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    })
  }, [messages, isSending])

  // 메시지 목록 위에서 휠 시 페이지 스크롤로 전파되지 않도록 (목록이 스크롤 가능할 때만)
  const handleMessagesWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget
    if (container.scrollHeight > container.clientHeight) {
      event.stopPropagation()
    }
  }, [])

  // ── WebSocket 메시지 수신 핸들러 ─────────────────────────────────────────────
  // usedTokens를 의존성에서 제거: 변경 시 useChatSocket 이펙트가 재실행되어 WS 재연결됨
  // tokenCount는 현재 턴의 토큰 수이므로 response에서 직접 사용
  const handleMessageReceived = useCallback((newMessage: Message, response: any) => {
    setMessages((prev) => [...prev, newMessage]);
    setIsSending(false);
    setCurrentTurn((prev) => prev + 1);

    const tokensDelta: number = response.tokenCount ?? 0;

    if (tokensDelta > 0) {
      updateTokenUsage({ examId, participantId, tokens: tokensDelta })
        .then(() => { onTokensUpdate(tokensDelta); })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[WS Chat] Token update failed:", err);
          }
          onTokensUpdate(tokensDelta);
        });
    }
  }, [examId, participantId, onTokensUpdate]);

  const handleChatError = useCallback((errorMessage: string) => {
    console.error('[AiAssistant] WS 에러로 로딩 해제:', errorMessage);
    setIsSending(false);
  }, []);

  const { isConnected, sendMessage: sendWsMessage } = useChatSocket(
    examId,
    participantId,
    handleMessageReceived,
    handleChatError
  );

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || !isConnected) return

    const userMessageContent = inputValue.trim()

    const newUserMessage: Message = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")
    setIsSending(true)

    const success = sendWsMessage(userMessageContent, currentTurn);

    if (!success) {
      console.error("[WS Chat] Failed to send message via WebSocket");
      setIsSending(false);
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
        className={`fixed right-0 top-[73px] z-30 flex h-[calc(100vh-73px)] min-h-0 w-[400px] flex-col overflow-hidden border-l border-[#D0D0D0] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex shrink-0 items-center justify-between px-4 py-4 border-b border-[#E5E7EB]">
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

        {/* 히스토리 로딩 중 표시 */}
        {!isHistoryLoaded && (
          <div className="flex shrink-0 items-center gap-1 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-xs text-[#6B7280]">
            <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            이전 대화 불러오는 중…
          </div>
        )}

        {/* 메시지 목록 — 가운데 영역만 스크롤 (일반 채팅앱 UX) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={messagesScrollRef}
            onWheel={handleMessagesWheel}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pr-3 space-y-4 [touch-action:pan-y]"
          >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex min-w-0 gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "assistant" ? "bg-[#2563EB]" : "bg-[#6B7280]"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-white" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`${MESSAGE_BUBBLE_BASE_CLASS} ${
                  message.role === "assistant"
                    ? "bg-[#F3F4F6] text-[#1F2937] rounded-tl-sm"
                    : "bg-[#2563EB] text-white rounded-tr-sm"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {/* 응답 대기 중 타이핑 인디케이터 */}
          {isSending && (
            <div className="flex min-w-0 gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[#F3F4F6] px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9CA3AF]" />
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 overflow-hidden border-t border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={isConnected ? "메시지를 입력하세요…" : "연결 대기 중…"}
              rows={1}
              className={CHAT_INPUT_CLASS}
              disabled={isSending || !isConnected}
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || !inputValue.trim() || !isConnected}
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
