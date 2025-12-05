"use client"

import { useState, useEffect } from "react"
import { Clock, Coins } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { ProblemSection } from "@/components/problem-section"
import { CodeEditorSection } from "@/components/code-editor-section"
import { AiAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { useRouter } from "next/navigation";

export default function UserTestScreen() {
  const router = useRouter();

  // 남은 시간 (예시: 초 단위)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(/* 기존 초기값 */);

  // 모달 2개 상태
  const [showTimeOverModal, setShowTimeOverModal] = useState(false);   // "시험 시간 종료 시 모달"
  const [showFinishedModal, setShowFinishedModal] = useState(false);   // "시험 종료 완료 공지 모달"

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(45 * 60 + 23)


  const handleTimeExpired = () => {
    // 이미 모달이 떠있으면 다시 열지 않기 위한 가드 (선택사항)
    if (showTimeOverModal || showFinishedModal) return;

    // "시험 시간 종료 시 모달" 열기
    setShowTimeOverModal(true);
  };

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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#D0D0D0]">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left - Logo */}
          <span className="font-semibold text-[#1F2937] pl-2">AI Vibe Coding Test</span>

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
              <span className="text-sm font-medium">Token:</span>
              <span className="font-mono text-[#1F2937] font-semibold">204 / 20000</span>
            </div>
            <Button
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6"
              onClick={() => setIsSubmitModalOpen(true)}
            >
              제출하기
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex relative">
        {/* Main Workspace */}
        <main
          className="flex-1 p-6 transition-all duration-300 ease-in-out"
          style={{
            marginRight: isSidebarOpen ? "400px" : "48px",
          }}
        >
          <div className="flex flex-col gap-6 h-[calc(100vh-88px)]">
            {/* Problem Section */}
            <ProblemSection />

            {/* Code Editor Section */}
            <CodeEditorSection />
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
      <Dialog open={showTimeOverModal} onOpenChange={setShowTimeOverModal}>
        <DialogContent className="max-w-md">
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

      {/* 2) 시험 종료 완료 공지 모달 */}
      <Dialog open={showFinishedModal} onOpenChange={setShowFinishedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              시험이 종료되었습니다.
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-center text-muted-foreground">
            수고하셨습니다!
            <br />
            시험이 정상적으로 종료되었습니다.
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="px-8"
              onClick={() => {
                router.push("/"); // 로그인 화면으로 이동
              }}
            >
              홈 화면으로 돌아가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
