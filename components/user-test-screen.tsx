"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Clock, Coins } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { ProblemSection } from "@/components/problem-section"
import { CodeEditorSection, type CodeEditorSectionHandle } from "@/components/code-editor-section"
import { AiAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getExamState, ExamState, GetExamStateResponse } from "@/lib/api/exams";
import { RemainingTimer } from "@/components/remaining-timer";
import { useExamSocket, ExamStateEvent } from "@/hooks/use-exam-socket";
import { streamScoringResult, FinalScoreEvent, SubmissionStatus } from "@/lib/api/submissions";
import { getChatHistory } from "@/lib/api/chat";

// ─── 채점 결과 표시용 타입 ────────────────────────────────────────────────────

interface ScoringResult {
  status: SubmissionStatus;
  score: {
    prompt: number | null;
    perf: number | null;
    correctness: number | null;
    total: number | null;
  } | null;
  passRate: number | null;
}

const SCORING_STATUS_LABEL: Record<SubmissionStatus, string> = {
  PENDING:               "채점 대기 중",
  JUDGING:               "채점 중…",
  ACCEPTED:              "✅ 정답",
  WRONG_ANSWER:          "❌ 오답",
  TIME_LIMIT_EXCEEDED:   "⏱ 시간 초과",
  MEMORY_LIMIT_EXCEEDED: "💾 메모리 초과",
  RUNTIME_ERROR:         "🔥 런타임 오류",
  COMPILE_ERROR:         "🔨 컴파일 오류",
  SYSTEM_ERROR:          "⚠️ 시스템 오류",
}

const SCORING_STATUS_COLOR: Record<SubmissionStatus, string> = {
  PENDING:               "text-[#6B7280]",
  JUDGING:               "text-[#2563EB]",
  ACCEPTED:              "text-[#059669]",
  WRONG_ANSWER:          "text-[#DC2626]",
  TIME_LIMIT_EXCEEDED:   "text-[#D97706]",
  MEMORY_LIMIT_EXCEEDED: "text-[#D97706]",
  RUNTIME_ERROR:         "text-[#DC2626]",
  COMPILE_ERROR:         "text-[#DC2626]",
  SYSTEM_ERROR:          "text-[#6B7280]",
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function UserTestScreen() {
  const router = useRouter();
  const examId = useExamSessionStore((state) => state.examId);
  const participantId = useExamSessionStore((state) => state.participantId);
  const tokenLimit = useExamSessionStore((state) => state.tokenLimit);

  // 모달 상태
  const [showTimeOverModal, setShowTimeOverModal] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);

  // 시험 종료 감지 상태
  const [isExamEnded, setIsExamEnded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [examState, setExamState] = useState<ExamState | null>(null);
  const [examStateData, setExamStateData] = useState<GetExamStateResponse | null>(null);

  // 토큰 사용량 상태 관리 (초기 로드 포함)
  const [usedTokens, setUsedTokens] = useState<number>(0);
  const maxTokens = tokenLimit; // enterExam 응답의 session.tokenLimit 사용

  // 채점 결과 상태
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [caseResultCount, setCaseResultCount] = useState(0);

  // SSE cleanup ref
  const sseCleanupRef = useRef<(() => void) | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  /** 헤더 제출 확인 모달에서 POST 제출 중 */
  const [isModalSubmitting, setIsModalSubmitting] = useState(false)

  const codeEditorRef = useRef<CodeEditorSectionHandle>(null)
  const timeExpiredAutoSubmitRef = useRef(false)

  // ── 초기 토큰 사용량 로드 (getChatHistory.totalTokens) ──────────────────────
  useEffect(() => {
    if (!examId || !participantId) return;

    getChatHistory(examId, participantId)
      .then((history) => {
        if (history && history.totalTokens > 0) {
          setUsedTokens(history.totalTokens);
        }
      })
      .catch((err) => {
        // 히스토리 없음(404)은 정상 — 0 유지
        if (process.env.NODE_ENV === 'development') {
          console.warn("[UserTestScreen] getChatHistory 초기 로드 실패:", err);
        }
      });
  }, [examId, participantId]);

  // 토큰 업데이트 핸들러: delta(증가량)를 받아서 누적
  // useCallback으로 안정화 - 이 함수가 바뀌면 useChatSocket의 WS 재연결이 발생함
  const handleTokensUpdate = useCallback((delta: number) => {
    setUsedTokens((prev) => prev + delta);
  }, []);

  // ── WebSocket 시험 상태 이벤트 핸들러 ───────────────────────────────────────
  const handleExamStateEvent = (event: ExamStateEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[UserTestScreen] WS exam state event:', event);
    }
    setExamState(event.state);
    setExamStateData({
      examId: event.examId,
      state: event.state,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      version: event.version,
      serverTime: event.serverTime,
    });
    if (event.state === 'ENDED' && !isExamEnded && !showEndModal) {
      setIsExamEnded(true);
      setShowEndModal(true);
    }
  };

  useExamSocket(examId, handleExamStateEvent);

  // ── SSE 채점 결과 스트리밍 ───────────────────────────────────────────────────
  /**
   * CodeEditorSection의 onSubmitted 콜백.
   * submissionId를 받아 SSE 구독을 시작한다.
   * 이전 구독이 있으면 먼저 취소한다.
   */
  const handleCodeSubmitted = (submissionId: number) => {
    // 이전 SSE 연결 취소
    sseCleanupRef.current?.();
    sseCleanupRef.current = null;

    setIsScoring(true);
    setCaseResultCount(0);
    setScoringResult({ status: "PENDING", score: null, passRate: null });

    const cancel = streamScoringResult(submissionId, {
      onCaseResult: () => {
        setCaseResultCount((n) => n + 1);
        setScoringResult((prev) => prev ? { ...prev, status: "JUDGING" } : prev);
      },
      onFinalScore: (event: FinalScoreEvent) => {
        setScoringResult({
          status: event.status,
          score: event.score ?? null,
          passRate: event.tc?.passRateWeighted ?? null,
        });
        setIsScoring(false);
      },
      onError: (err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error("[UserTestScreen] SSE 오류:", err);
        }
        setScoringResult((prev) => prev ? { ...prev, status: "SYSTEM_ERROR" } : prev);
        setIsScoring(false);
      },
      onComplete: () => {
        setIsScoring(false);
      },
    });

    sseCleanupRef.current = cancel;
  };

  // 컴포넌트 언마운트 시 SSE 취소
  useEffect(() => {
    return () => {
      sseCleanupRef.current?.();
      sseCleanupRef.current = null;
    };
  }, []);

  // ── 시간 만료 핸들러 (00:00:00 → 기존 제출 API 자동 호출) ─────────────────────
  const handleTimeExpired = useCallback(async () => {
    if (showTimeOverModal || showFinishedModal || showEndModal) return;

    if (!timeExpiredAutoSubmitRef.current) {
      timeExpiredAutoSubmitRef.current = true;
      setIsExamEnded(true);
      try {
        await codeEditorRef.current?.submit();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[UserTestScreen] 타이머 만료 자동 제출 실패:", err);
        }
      }
    }

    setShowTimeOverModal(true);
  }, [showTimeOverModal, showFinishedModal, showEndModal]);

  // ── 시험 상태 폴링 ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examId) return;

    let cancelled = false;

    const checkExamState = async () => {
      try {
        const res = await getExamState(examId);
        if (cancelled) return;

        setExamState(res.state);
        setExamStateData(res);

        if (res.state === "ENDED" && !isExamEnded && !showEndModal) {
          setIsExamEnded(true);
          setShowEndModal(true);
        }
      } catch (err) {
        console.error("[UserTestScreen] getExamState error:", err);
      }
    };

    checkExamState();
    const intervalId = setInterval(checkExamState, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [examId, isExamEnded, showEndModal]);

  const handleGoHome = () => {
    sseCleanupRef.current?.();
    sseCleanupRef.current = null;
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#D0D0D0]">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left - Logo */}
          <span className="font-semibold text-[#1F2937] pl-2">Vibe Coding Evaluator</span>

          {/* Center - Remaining Time */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <span className="text-lg font-medium text-[#1F2937]">남은 시간:</span>
            {examStateData?.endsAt ? (
              <RemainingTimer
                endAt={examStateData.endsAt}
                onTimeOver={handleTimeExpired}
              />
            ) : (
              <span className="font-mono text-xl text-[#2563EB] font-bold">00:00:00</span>
            )}
          </div>

          {/* Right - Token and Submit */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#4B5563]">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">토큰:</span>
              <span className="font-mono text-[#1F2937] font-semibold">{usedTokens.toLocaleString()} / {maxTokens.toLocaleString()}</span>
            </div>
            {!isExamEnded && (
              <Button
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6"
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={isExamEnded}
              >
                제출하기
              </Button>
            )}
          </div>
        </div>

        {/* 채점 결과 배너 */}
        {scoringResult && (
          <div
            className={`flex items-center justify-between px-6 py-2 text-sm border-t border-[#E5E7EB] bg-[#F9FAFB] ${
              SCORING_STATUS_COLOR[scoringResult.status]
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {isScoring && (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{SCORING_STATUS_LABEL[scoringResult.status]}</span>
              {caseResultCount > 0 && isScoring && (
                <span className="text-xs text-[#6B7280]">({caseResultCount}개 테스트케이스 처리됨)</span>
              )}
            </div>
            {!isScoring && scoringResult.score?.total !== null && scoringResult.score?.total !== undefined && (
              <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                {scoringResult.passRate !== null && (
                  <span>통과율 {Math.round(scoringResult.passRate * 100)}%</span>
                )}
                <span className="font-semibold text-[#1F2937]">
                  총점 {scoringResult.score.total}점
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex relative">
        {/* Main Workspace */}
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            {/* Problem Section */}
            {examId && <ProblemSection examId={examId} />}

            {/* Code Editor Section */}
            <CodeEditorSection
              ref={codeEditorRef}
              isReadOnly={isExamEnded}
              examId={examId}
              onSubmitted={handleCodeSubmitted}
            />
          </div>
        </main>

        {/* AI Assistant Sidebar */}
        {examId && participantId && (
          <AiAssistantSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            examId={examId}
            participantId={participantId}
            onTokensUpdate={handleTokensUpdate}
          />
        )}
      </div>

      {/* 제출 확인 모달 */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-[#1F2937] text-center mb-2">시험을 종료하시겠습니까?</h2>
            <p className="text-[#6B7280] text-center mb-8">제출 후에는 답안을 수정하실 수 없습니다.</p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                className="px-8 border-[#D0D0D0] text-[#4B5563] hover:bg-[#F5F5F5] bg-transparent"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                아니요
              </Button>
              <Button
                className="px-8 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                disabled={isModalSubmitting}
                onClick={async () => {
                  setIsModalSubmitting(true)
                  try {
                    const ok = await codeEditorRef.current?.submit()
                    if (ok) {
                      setIsSubmitModalOpen(false)
                      setShowFinishedModal(true)
                    }
                  } finally {
                    setIsModalSubmitting(false)
                  }
                }}
              >
                {isModalSubmitting ? "제출 중…" : "네"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1) 시험 시간 종료 모달 */}
      <Dialog
        open={showTimeOverModal}
        onOpenChange={(open) => {
          if (!open) return;
          setShowTimeOverModal(open);
        }}
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              시험 시간이 종료되었습니다.
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-center text-muted-foreground">
            남은 시간이 0초가 되어 시험이 자동으로 종료되었습니다.
            <br />
            지금까지 작성된 답안만 자동으로 저장 및 제출됩니다.
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              className="px-8"
              onClick={() => {
                setShowTimeOverModal(false);
                setShowFinishedModal(true);
              }}
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2) 관리자가 시험 종료한 경우 모달 */}
      <Dialog
        open={showEndModal}
        onOpenChange={(open) => {
          if (!open) return;
          setShowEndModal(open);
        }}
      >
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              시험이 종료되었습니다.
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              현재까지 작성한 코드가 최종 답안으로 제출되었습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex w-full !justify-center pt-4">
            <Button
              className="w-full sm:w-auto px-8"
              onClick={handleGoHome}
            >
              홈 화면으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3) 시험 종료 완료 공지 모달 */}
      <Dialog open={showFinishedModal} onOpenChange={setShowFinishedModal}>
        <DialogContent className="max-w-md w-full rounded-2xl border border-gray-100 shadow-xl bg-white p-8">
          <DialogTitle className="sr-only">시험이 종료되었습니다.</DialogTitle>

          <div className="flex flex-col items-center text-center space-y-5">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-emerald-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="text-xs tracking-wide text-gray-400 uppercase">
                시험 종료 안내
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              시험이 종료되었습니다.
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed">
              수고하셨습니다! <br />
              시험이 정상적으로 종료되었습니다.
            </p>

            <div className="w-full h-px bg-gray-100" />

            <div className="w-full flex flex-col gap-2">
              <Button
                className="w-full rounded-lg bg-gray-900 text-white hover:bg-black"
                onClick={handleGoHome}
              >
                홈 화면으로 돌아가기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
