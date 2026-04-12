"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { adminLogin, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { enterExam, AuthError } from "@/lib/api/auth"
import { isMasterAdmin, saveAuthInfo } from "@/lib/auth/utils"
import { setCookie } from "@/lib/auth/cookie-utils"
import { useExamSessionStore } from "@/lib/stores/exam-session-store"

type TabType = "user" | "admin"

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState<TabType>("user")
  // 🔹 Admin 로그인 입력값 상태

  const [entryCode, setEntryCode] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [adminNumber, setAdminNumber] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminError, setAdminError] = useState<string>("");
  const [userError, setUserError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const setSession = useExamSessionStore((state: { setSession: (examId: number, participantId: number, tokenLimit?: number) => void }) => state.setSession);


  const handleClick = async () => {
  if (activeTab === "user") {
    // ✅ User 탭: 입력값 검증 후 API 호출
    setUserError(""); // 에러 메시지 초기화

    // 기본적인 클라이언트 유효성 검사
    if (
      entryCode.trim() === "" ||
      userName.trim() === "" ||
      phoneNumber.trim() === ""
    ) {
      setUserError("입장 코드, 이름, 전화번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // /api/auth/enter API 호출
      const response = await enterExam({
        code: entryCode.trim(),
        name: userName.trim(),
        phone: phoneNumber.trim(),
      });

      // examId와 participantId를 전역 상태에 저장
      const examId = response.exam?.id;
      const participantId = response.participant?.id;

      if (examId && participantId) {
        setSession(examId, participantId, response.session?.tokenLimit);
      }

      // accessToken 저장
      if (response.accessToken) {
        setCookie('user_access_token', response.accessToken);
      }

      // ✅ API 성공 시에만 대기 화면으로 이동
      router.push("/waiting");
    } catch (error) {
      console.error("[LoginCard] enterExam error:", error);
      if (error instanceof AuthError) {
        if (error.status === 400) {
          // DB에 없는 입장 코드 or 유효하지 않은 코드
          setUserError("입장 코드가 올바르지 않거나 만료되었습니다.");
        } else {
          setUserError(error.message || "입장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
      } else if (error instanceof NetworkError) {
        setUserError(error.message || "네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.");
      } else {
        setUserError("입장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      // 에러 발생 시 대기 화면으로 이동하지 않음
    } finally {
      setIsLoading(false);
    }
  } else {
      // ✅ Admin 탭: 백엔드 API와 연동
      setAdminError(""); // 에러 메시지 초기화

      // 입력값 검증
      if (adminNumber.trim() === "" || adminPassword.trim() === "") {
        setAdminError("관리자 번호와 비밀번호를 모두 입력해 주세요.");
        return;
      }

      // ✅ 모든 관리자 로그인(마스터 포함)은 백엔드 API를 통해 처리
      setIsLoading(true);
      try {
        const response = await adminLogin({
          identifier: adminNumber.trim(),
          password: adminPassword.trim(),
        });

        // 응답에서 관리자 번호 확인 (response.admin.adminNumber 또는 identifier 사용)
        const adminNumberFromResponse = response.admin?.adminNumber || adminNumber.trim();
        
        // 인증 정보 저장
        saveAuthInfo(
          response.accessToken,
          adminNumberFromResponse,
          response.role,
          response.admin?.email
        );

        // 마스터/일반 관리자 분기
        const isMaster = isMasterAdmin({
          adminNumber: adminNumberFromResponse,
          role: response.role,
        });

        // 마스터면 마스터 대시보드로, 일반 관리자면 관리자 대시보드로 이동
        if (isMaster) {
      router.push("/master");
    } else {
      router.push("/admin/dashboard");
        }
      } catch (error) {
        // 에러 처리 개선
        if (error instanceof LoginFailedError) {
          const status = error.status;
          const code = error.code;

          // 비활성화된 계정 처리
          if (status === 403 && code === "AUTH022") {
            setAdminError("비활성화된 관리자 계정입니다. 마스터에게 문의해주세요.");
          } else if (status === 401) {
            setAdminError("이메일 또는 비밀번호가 올바르지 않습니다.");
          } else {
            setAdminError(error.message || "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
          }
        } else if (error instanceof NetworkError) {
          setAdminError(error.message);
        } else {
          setAdminError("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      } finally {
        setIsLoading(false);
    }
  }
};


  return (
    <Card className="w-[500px] shadow-lg border-0 shadow-black/5">
      <CardHeader className="text-center pb-2 pt-8">
        <h1 className="text-2xl font-semibold text-foreground">Vibe Coding Evaluator</h1>
        <p className="text-muted-foreground text-sm">코딩 테스트 평가 시스템</p>
      </CardHeader>

      {/* Tab Navigation */}
      <div className="flex justify-center px-6 pt-4">
        <div className="flex bg-muted rounded-lg p-1 w-full max-w-[280px]">
          <button
            onClick={() => setActiveTab("user")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === "user"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            사용자
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === "admin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            관리자
          </button>
        </div>
      </div>

      <CardContent className="px-8 pt-6 pb-4">
        {activeTab === "user" ? (
          <div key="user-form" className="space-y-5">
            <div className="text-left mb-6">
              <h2 className="text-lg font-semibold text-foreground">시험 입장</h2>
              <p className="text-sm text-muted-foreground">
                시험 참여를 위해 아래 정보를 입력해주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-code">입장 코드</Label>
              <Input 
                id="entry-code" 
                type="text" 
                placeholder="입장 코드를 입력하세요" 
                className="h-11"
                value={entryCode}
                onChange={(e) => {
                  setEntryCode(e.target.value);
                  setUserError(""); // 입력 시 에러 메시지 초기화
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="이름을 입력하세요" 
                className="h-11"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setUserError(""); // 입력 시 에러 메시지 초기화
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="전화번호를 입력하세요 (예: 010-1234-5678)" 
                className="h-11"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setUserError(""); // 입력 시 에러 메시지 초기화
                }}
              />
              <div className="h-6 flex items-start">
                {userError ? (
                  <p className="text-sm text-red-500">{userError}</p>
                ) : (
                  <span className="invisible text-sm">placeholder</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div key="admin-form" className="space-y-5">
            <div className="text-left mb-6">
              <h2 className="text-lg font-semibold text-foreground">관리자 로그인</h2>
              <p className="text-sm text-muted-foreground">
                관리자 대시보드에 접속하려면 아래 정보를 입력해주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-number">관리자 번호</Label>
              <Input id="admin-number" type="text" placeholder="관리자 번호를 입력하세요" className="h-11" 
                value={adminNumber}                             
                onChange={(e) => {
                  setAdminNumber(e.target.value);
                  setAdminError(""); // 입력 시 에러 메시지 초기화
                }}
                />
              </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input id="admin-password" type="password" placeholder="비밀번호를 입력하세요" className="h-11" 
                value={adminPassword}                            
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError(""); // 입력 시 에러 메시지 초기화
                }}
                />
              <div className="h-6 flex items-start">
                {adminError ? (
                  <p className="text-sm text-red-500">{adminError}</p>
                ) : (
                  <span className="invisible text-sm">placeholder</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col px-8 pb-8 pt-2 gap-4">
        <Button
          type="button"
          className="w-full h-11 text-base font-medium"
          onClick={handleClick}
          disabled={isLoading}
        >
          {activeTab === "user" ? (isLoading ? "입장 중..." : "시험에 참여하기") : (isLoading ? "로그인 중..." : "로그인")}
        </Button>
        {activeTab === "user" ? (
          // User helper texts
          <>
            <p className="text-xs text-muted-foreground text-center">
              입력하신 정보는 시험 참여 목적에만 사용됩니다.
            </p>
            <p className="text-xs text-muted-foreground text-center">도움이 필요하시면 시험 관리자에게 문의하세요.</p>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground text-center">이 페이지는 관리자 전용 페이지입니다.</p>
            <div className="w-full border-t border-border pt-4 mt-2">
               <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-medium bg-transparent"
                  onClick={() => router.push("/admin-signup")}
                >
                회원가입
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                관리자 계정이 없으신가요?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/admin-signup")}
                  className="text-blue-600 underline hover:text-primary/80"
                >
                  회원가입하기
                </button>
              </p>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
