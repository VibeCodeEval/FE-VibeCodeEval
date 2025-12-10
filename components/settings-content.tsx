"use client"

import { useState, useEffect } from "react"
import { User, LogOut, AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logoutAdmin, getMe, changeAdminPassword, LoginFailedError, NetworkError } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"

export function SettingsContent() {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeletedSuccessModal, setShowDeletedSuccessModal] = useState(false)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [adminProfile, setAdminProfile] = useState({
    name: "", // 더미 데이터
    email: "", // participant.phone에서 가져옴
    adminNumber: "", // participant.name에서 가져옴
  })

  const router = useRouter();
  const { toast } = useToast()

  // 현재 로그인한 관리자 정보 조회
  useEffect(() => {
    const fetchAdminProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getMe();
        // ADMIN의 경우: participant.name = adminNumber, participant.phone = email
        // 이름은 백엔드에서 제공하지 않으므로 더미 데이터 사용
        setAdminProfile({
          name: "Admin", // 더미 데이터 (백엔드에서 제공되지 않음)
          email: response.participant.phone || "", // email
          adminNumber: response.participant.name || "", // adminNumber
        });
      } catch (error) {
        if (error instanceof LoginFailedError) {
          if (error.message.includes('인증')) {
            toast({
              title: "인증 오류",
              description: "다시 로그인해주세요.",
              variant: "destructive",
            });
            router.push("/");
          } else {
            toast({
              title: "조회 실패",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (error instanceof NetworkError) {
          toast({
            title: "네트워크 오류",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "오류",
            description: "관리자 정보를 불러오는 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminProfile();
  }, [router, toast]);

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // 백엔드 로그아웃 API 호출
      await logoutAdmin()
      // API 호출 성공/실패와 관계없이 프론트엔드 세션 정리 및 리다이렉트
      // (logoutAdmin 함수 내부에서 이미 localStorage를 정리함)
      setShowLogoutModal(false)
      router.push("/")
    } catch (error) {
      // 에러가 발생해도 로그아웃은 진행 (idempotent)
      setShowLogoutModal(false)
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(false)
    setShowDeletedSuccessModal(true)
  }

  const handleGoToLogin = () => {
    setShowDeletedSuccessModal(false)
    window.location.href = "/"
  }

  const handlePasswordChangeClick = () => {
    setShowPasswordChangeModal(true)
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setPasswordError("")
  }

  const handlePasswordFormChange = (field: "currentPassword" | "newPassword" | "confirmPassword", value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    setPasswordError("") // 입력 시 에러 메시지 초기화
  }

  const handleConfirmPasswordChange = async () => {
    setPasswordError("")

    // 입력값 검증
    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("현재 비밀번호를 입력해주세요.")
      return
    }
    if (!passwordForm.newPassword.trim()) {
      setPasswordError("새 비밀번호를 입력해주세요.")
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("새 비밀번호는 최소 8자 이상이어야 합니다.")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.")
      return
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("현재 비밀번호와 새 비밀번호가 동일합니다.")
      return
    }

    setIsChangingPassword(true)
    try {
      await changeAdminPassword({
        currentPassword: passwordForm.currentPassword.trim(),
        newPassword: passwordForm.newPassword.trim(),
      })

      toast({
        title: "비밀번호 변경 성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      })

      setShowPasswordChangeModal(false)
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setPasswordError("")
    } catch (error) {
      if (error instanceof LoginFailedError) {
        setPasswordError(error.message)
      } else if (error instanceof NetworkError) {
        setPasswordError(error.message)
      } else {
        setPasswordError("비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 h-[88px] bg-white border-b border-[#E5E5E5] flex items-center px-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">설정</h1>
          <p className="text-sm text-[#6B7280] mt-1">관리자 계정, 프로필, 접근 설정을 관리합니다.</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 bg-[#F5F5F5] overflow-y-auto">
        <div className="flex flex-col gap-10">
          {/* Card 1: Account Settings */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm px-12 py-8">
            <h2 className="text-lg font-semibold text-[#111111]">계정 설정</h2>
            <p className="text-sm text-[#6B7280] mt-1">프로필 정보와 계정 보안 설정을 관리합니다.</p>

            <div className="mt-8 flex gap-12">
              {/* Left: Profile Icon, Password Change, and Logout */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-[#F3F4F6] flex items-center justify-center border border-[#E5E5E5]">
                  <User className="w-12 h-12 text-[#9CA3AF]" />
                </div>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center border-[#E5E5E5] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
                  onClick={handlePasswordChangeClick}
                >
                  비밀번호 변경
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-[#E5E5E5] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </Button>
              </div>

              {/* Right: Admin Information Fields */}
              <div className="flex-1 space-y-6">
                {isLoading ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">관리자 이름</Label>
                      <Input
                        value="불러오는 중..."
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">이메일 주소</Label>
                      <Input
                        value="불러오는 중..."
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">관리자 번호</Label>
                      <Input
                        value="불러오는 중..."
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">관리자 이름</Label>
                      <Input
                        value={adminProfile.name || "Admin"}
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">이메일 주소</Label>
                      <Input
                        value={adminProfile.email || ""}
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-[#374151]">관리자 번호</Label>
                      <Input
                        value={adminProfile.adminNumber || ""}
                        disabled
                        className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Delete Account */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm px-12 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">계정 삭제</h2>
                <p className="text-sm text-[#6B7280] mt-1">
                  관리자 계정을 삭제하면 대시보드 접근 권한이 영구적으로 제거됩니다.
                </p>
              </div>
              <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white" onClick={() => setShowDeleteModal(true)}>
                계정 삭제
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal #1: Log Out Confirmation */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">로그아웃하시겠습니까?</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              현재 사용 중인 관리자 계정에서 로그아웃됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="border-[#E5E5E5] text-[#374151]"
            >
              취소
            </Button>
            <Button 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal #2: Delete Account Confirmation */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
              <DialogTitle className="text-lg font-semibold">계정을 삭제하시겠습니까?</DialogTitle>
            </div>
            <DialogDescription className="text-[#6B7280] mt-4">
              이 작업은 되돌릴 수 없습니다. 관리자 계정을 삭제하면 대시보드 접근 권한이 모두 제거됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="border-[#E5E5E5] text-[#374151]"
            >
              취소
            </Button>
            <Button onClick={handleDeleteAccount} className="bg-[#DC2626] hover:bg-[#B91C1C] text-white">
              계정 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal #3: Account Deleted Success */}
      <Dialog open={showDeletedSuccessModal} onOpenChange={setShowDeletedSuccessModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
            </div>
            <DialogTitle className="text-lg font-semibold">계정이 삭제되었습니다.</DialogTitle>
            <DialogDescription className="text-[#6B7280] mt-2">
              계정이 정상적으로 삭제되었습니다. 더 이상 관리자 대시보드에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center mt-4">
            <Button onClick={handleGoToLogin} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              로그인 페이지로 이동
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal #4: Change Password */}
      <Dialog open={showPasswordChangeModal} onOpenChange={setShowPasswordChangeModal}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">비밀번호 변경</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              현재 비밀번호를 확인하고 새 비밀번호를 설정하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-[#374151]">
                현재 비밀번호
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordFormChange("currentPassword", e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
                className="border-[#E5E5E5] text-[#374151]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-[#374151]">
                새 비밀번호
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordFormChange("newPassword", e.target.value)}
                placeholder="새 비밀번호를 입력하세요 (최소 8자)"
                className="border-[#E5E5E5] text-[#374151]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
                새 비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordFormChange("confirmPassword", e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="border-[#E5E5E5] text-[#374151]"
              />
            </div>
            {passwordError && (
              <div className="mt-2">
                <p className="text-sm text-red-500">{passwordError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordChangeModal(false)
                setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                })
                setPasswordError("")
              }}
              disabled={isChangingPassword}
              className="border-[#E5E5E5] text-[#374151]"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmPasswordChange}
              disabled={isChangingPassword}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50"
            >
              {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
