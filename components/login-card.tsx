"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation";

type TabType = "user" | "admin"

export default function LoginCard() {
  const [activeTab, setActiveTab] = useState<TabType>("user")
  // 🔹 Admin 로그인 입력값 상태

  const [entryCode, setEntryCode] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [adminNumber, setAdminNumber] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const router = useRouter();

  const MASTER_KEY = "master";


  const handleClick = () => {
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
    // ✅ Admin 탭: 입력값에 따라 분기
    if (adminNumber.trim().toLowerCase() === MASTER_KEY) {
      // Admin Number 가 "master" 일 때 -> Master Dashboard
      router.push("/master");
    } else {
      // 그 외의 기존 Admin Dashboard
      router.push("/admin/dashboard");
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
              <Input id="entry-code" type="text" placeholder="입장 코드를 입력하세요" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" type="text" placeholder="이름을 입력하세요" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input id="phone" type="tel" placeholder="전화번호를 입력하세요" className="h-11" />
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
                onChange={(e) => setAdminNumber(e.target.value)}
                />
              </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input id="admin-password" type="password" placeholder="비밀번호를 입력하세요" className="h-11" 
                value={adminPassword}                            
                onChange={(e) => setAdminPassword(e.target.value)}
                />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col px-8 pb-8 pt-2 gap-4">
        <Button
          type="button"
          className="w-full h-11 text-base font-medium"
          onClick={handleClick}   // ✅ 여기만!
        >
          {activeTab === "user" ? "시험에 참여하기" : "로그인"}
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
