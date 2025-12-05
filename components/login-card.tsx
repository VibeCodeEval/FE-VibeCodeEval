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
  const [adminNumber, setAdminNumber] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const router = useRouter();

  const MASTER_KEY = "master";


  const handleClick = () => {
    if (activeTab === "user") {
      // User 탭 → 기존처럼 대기 화면으로
      router.push("/waiting");
    } else {
      // Admin 탭 → 입력값에 따라 분기
      if (adminNumber.trim().toLowerCase() === MASTER_KEY) {
        // Admin Number 가 "master" 일 때 → Master Dashboard
        router.push("/master");
      } else {
        // 그 외 → 기존 Admin Dashboard
        router.push("/admin/dashboard");
      }
    }
  };


  return (
    <Card className="w-[500px] shadow-lg border-0 shadow-black/5">
      <CardHeader className="text-center pb-2 pt-8">
        <h1 className="text-2xl font-semibold text-foreground">Welcome to AI Vibe</h1>
        <p className="text-muted-foreground text-sm">Coding Test Evaluator</p>
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
            User
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === "admin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <CardContent className="px-8 pt-6 pb-4">
        {activeTab === "user" ? (
          <div className="space-y-5">
            <div className="text-left mb-6">
              <h2 className="text-lg font-semibold text-foreground">Enter Test</h2>
              <p className="text-sm text-muted-foreground">
                Please enter your access code and details to join the test.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-code">Entry Code</Label>
              <Input id="entry-code" type="text" placeholder="Enter your access code" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" placeholder="Enter your full name" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter your phone number" className="h-11" />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-left mb-6">
              <h2 className="text-lg font-semibold text-foreground">Admin Login</h2>
              <p className="text-sm text-muted-foreground">
                Please enter your admin credentials to access the dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-number">Admin Number</Label>
              <Input id="admin-number" type="text" placeholder="Enter your admin number" className="h-11" 
                value={adminNumber}                             
                onChange={(e) => setAdminNumber(e.target.value)}
                />
              </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" placeholder="Enter your password" className="h-11" 
                value={adminPassword}                            
                onChange={(e) => setAdminPassword(e.target.value)}
                />
              <button type="button" className="text-xs text-primary hover:underline mt-1">
                Forgot your password?
              </button>
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
          {activeTab === "user" ? "Enter Test" : "Log In"}
        </Button>
        {activeTab === "user" ? (
          // User helper texts
          <>
            <p className="text-xs text-muted-foreground text-center">
              Your information is used only for test participation.
            </p>
            <p className="text-xs text-muted-foreground text-center">Need help? Contact your test administrator.</p>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground text-center">Authorized access only. For admin use.</p>
            <div className="w-full border-t border-border pt-4 mt-2">
               <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-medium bg-transparent"
                  onClick={() => router.push("/admin-signup")}
                >
                Sign Up
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Don't have an admin account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/admin-signup")}
                  className="text-primary underline hover:text-primary/80"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
