"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { adminLogin } from "@/lib/api/admin"

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const MASTER_IDENTIFIER = "MASTER-0001";
  const MASTER_PASSWORD = "master-pass";


  const handleClick = async () => {
    if (activeTab === "user") {
      // ✅ User 탭: 입력값 검증 후 대기 화면으로 이동
      if (
        entryCode.trim() === "" ||
        userName.trim() === "" ||
        phoneNumber.trim() === ""
      ) {
        alert("Entry Code, Name, Phone Number를 모두 입력해 주세요.");
        return;
      }

      // TODO: 나중에 여기서 실제 API 호출을 붙이면 됨
      // 예: await startUserSession({ entryCode, userName, phoneNumber });

      router.push("/waiting");
    } else {
      // ✅ Admin 탭: 백엔드 API와 연동
      setAdminError(""); // 에러 메시지 초기화

      // 입력값 검증
      if (adminNumber.trim() === "" || adminPassword.trim() === "") {
        setAdminError("관리자 번호와 비밀번호를 모두 입력해 주세요.");
        return;
      }

      // Master 키 체크 (MASTER-0001 / master-pass일 때는 API 호출 없이 바로 이동)
      if (
        adminNumber.trim() === MASTER_IDENTIFIER &&
        adminPassword.trim() === MASTER_PASSWORD
      ) {
        router.push("/master");
        return;
      }

      // API 호출
      setIsLoading(true);
      try {
        const response = await adminLogin({
          identifier: adminNumber.trim(),
          password: adminPassword.trim(),
        });

        // 성공 시: accessToken을 localStorage에 저장하고 대시보드로 이동
        localStorage.setItem("admin_access_token", response.accessToken);
        router.push("/admin/dashboard");
      } catch (error) {
        // 실패 시: 에러 메시지 표시
        setAdminError("아이디 또는 비밀번호가 일치하지 않습니다.");
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
                onChange={(e) => setEntryCode(e.target.value)}
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
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="전화번호를 입력하세요" 
                className="h-11"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
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
              {adminError && (
                <p className="text-sm text-red-500 mt-1">{adminError}</p>
              )}
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
          {activeTab === "user" ? "시험에 참여하기" : isLoading ? "로그인 중..." : "로그인"}
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
