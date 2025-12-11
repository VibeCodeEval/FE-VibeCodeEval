"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, Coins } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { ProblemSection } from "@/components/problem-section"
import { CodeEditorSection } from "@/components/code-editor-section"
import { AiAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useExamSessionStore } from "@/lib/stores/exam-session-store";
import { getExamState, ExamState } from "@/lib/api/exams";

export default function UserTestScreen() {
  const router = useRouter();
  const examId = useExamSessionStore((state) => state.examId);

  // 남은 시간 (예시: 초 단위)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(/* 기존 초기값 */);

  // 모달 2개 상태
  const [showTimeOverModal, setShowTimeOverModal] = useState(false);   // "시험 시간 종료 시 모달"
  const [showFinishedModal, setShowFinishedModal] = useState(false);   // "시험 종료 완료 공지 모달"

  // 시험 종료 감지 상태
  const [isExamEnded, setIsExamEnded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [examState, setExamState] = useState<ExamState | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60 + 23)


  const handleTimeExpired = () => {
    // 이미 모달이 떠있으면 다시 열지 않기 위한 가드 (선택사항)
    if (showTimeOverModal || showFinishedModal || showEndModal) return;

    // "시험 시간 종료 시 모달" 열기
    setShowTimeOverModal(true);
  };

  // 시험 상태 폴링 (관리자가 종료했는지 감지)
  useEffect(() => {
    if (!examId) return;

    let cancelled = false;

    const checkExamState = async () => {
      try {
        const res = await getExamState(examId);
        if (cancelled) return;

        setExamState(res.state);

        // 시험이 종료된 상태(ENDED)로 변경되었고, 아직 종료 모달을 보여주지 않았다면
        if (res.state === "ENDED" && !isExamEnded && !showEndModal) {
          setIsExamEnded(true);
          setShowEndModal(true);
        }
      } catch (err) {
        console.error("[UserTestScreen] getExamState error:", err);
        // 에러가 발생해도 기존 상태 유지
      }
    };

    // 컴포넌트 마운트 시 즉시 한 번 체크
    checkExamState();

    // 그 이후에는 5초마다 상태를 폴링
    const intervalId = setInterval(checkExamState, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [examId, isExamEnded, showEndModal]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      // 시간이 0이 되면 모달을 띄우고 타이머는 더 이상 돌리지 않음
      handleTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, handleTimeExpired]);

  // 홈으로 이동하는 핸들러
  const handleGoHome = () => {
    // 사용자 로그인/입장 화면으로 이동
    router.push("/");
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

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
            <span className="font-mono text-xl text-[#2563EB] font-bold">{formatTime(timeRemaining)}</span>
          </div>

          {/* Right - Token and Submit */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[#4B5563]">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">토큰:</span>
              <span className="font-mono text-[#1F2937] font-semibold">204 / 20000</span>
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
      </header>

      {/* Main Content */}
      <div className="flex relative">
        {/* Main Workspace */}
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            {/* Problem Section */}
            <ProblemSection />

            {/* Code Editor Section */}
            <CodeEditorSection isReadOnly={isExamEnded} />
          </div>
        </main>

        {/* AI Assistant Sidebar */}
        <AiAssistantSidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

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
                onClick={() => {
                  // 1) 제출 확인 모달 닫기
                  setIsSubmitModalOpen(false);
                  // 2) 시험 종료 완료 공지 모달 열기
                  setShowFinishedModal(true);
                }}
              >
                네
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 1) 시험 시간 종료 시 모달 */}
      <Dialog 
        open={showTimeOverModal} 
        onOpenChange={(open) => {
          // 바깥쪽 클릭이나 ESC 키로 닫히는 것을 방지
          // 오로지 모달 내부 버튼을 통해서만 닫을 수 있음
          if (!open) {
            // false로 변경 시도를 무시
            return;
          }
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

      {/* 3) 관리자가 시험을 종료한 경우 모달 */}
      <Dialog 
        open={showEndModal} 
        onOpenChange={(open) => {
          // 바깥쪽 클릭이나 ESC 키로 닫히는 것을 방지
          if (!open) {
            return;
          }
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

      {/* 2) 시험 종료 완료 공지 모달 */}
      <Dialog open={showFinishedModal} onOpenChange={setShowFinishedModal}>
        <DialogContent className="max-w-md w-full rounded-2xl border border-gray-100 shadow-xl bg-white p-8">
          
          {/* 접근성용 DialogTitle (화면에는 안 보이게) */}
          <DialogTitle className="sr-only">시험이 종료되었습니다.</DialogTitle>
          
          <div className="flex flex-col items-center text-center space-y-5">

            {/* 아이콘 + 서브텍스트 */}
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 rounded-full bg-emerald-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="text-xs tracking-wide text-gray-400 uppercase">
                시험 종료 안내
              </span>
            </div>

            {/* 타이틀 */}
            <h2 className="text-xl font-semibold text-gray-900">
              시험이 종료되었습니다.
            </h2>

            {/* 설명 */}
            <p className="text-sm text-gray-500 leading-relaxed">
              수고하셨습니다! <br />
              시험이 정상적으로 종료되었습니다.
            </p>

            {/* 얇은 구분선 */}
            <div className="w-full h-px bg-gray-100" />

            {/* 버튼 영역 */}
            <div className="w-full flex flex-col gap-2">
              <Button
                className="w-full rounded-lg bg-gray-900 text-white hover:bg-black"
                onClick={() => router.push("/")}   // 기존 동작 유지
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
