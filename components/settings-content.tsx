"use client"

import { useState } from "react"
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

export function SettingsContent() {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeletedSuccessModal, setShowDeletedSuccessModal] = useState(false)

  const router = useRouter();

  // Admin profile data (read-only)
  const adminProfile = {
    name: "홍길동",
    email: "admin@aivibe.co.kr",
    adminNumber: "ADM-2024-001",
  }

  const handleLogout = () => {
    setShowLogoutModal(false)
    // In a real app, this would redirect to login
    window.location.href = "/"
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(false)
    setShowDeletedSuccessModal(true)
  }

  const handleGoToLogin = () => {
    setShowDeletedSuccessModal(false)
    window.location.href = "/"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 h-[88px] bg-white border-b border-[#E5E5E5] flex items-center px-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Settings</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage your admin account, profile, and access settings.</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 bg-[#F5F5F5] overflow-y-auto">
        <div className="flex flex-col gap-10">
          {/* Card 1: Account Settings */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm px-12 py-8">
            <h2 className="text-lg font-semibold text-[#111111]">Account Settings</h2>
            <p className="text-sm text-[#6B7280] mt-1">Manage your profile details and account security.</p>

            <div className="mt-8 flex gap-12">
              {/* Left: Profile Icon and Logout */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-[#F3F4F6] flex items-center justify-center border border-[#E5E5E5]">
                  <User className="w-12 h-12 text-[#9CA3AF]" />
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-[#E5E5E5] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>

              {/* Right: Admin Information Fields */}
              <div className="flex-1 space-y-6">
                <div>
                  <Label className="text-sm font-medium text-[#374151]">Admin Name</Label>
                  <Input
                    value={adminProfile.name}
                    disabled
                    className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#374151]">Email Address</Label>
                  <Input
                    value={adminProfile.email}
                    disabled
                    className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#374151]">Admin Number</Label>
                  <Input
                    value={adminProfile.adminNumber}
                    disabled
                    className="mt-2 bg-[#F9FAFB] border-[#E5E5E5] text-[#374151]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Delete Account */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] shadow-sm px-12 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">Delete Account</h2>
                <p className="text-sm text-[#6B7280] mt-1">
                  Deleting your admin account will permanently remove dashboard access.
                </p>
              </div>
              <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white" onClick={() => setShowDeleteModal(true)}>
                Delete Account
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
            <Button onClick={handleLogout} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              로그아웃
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
    </div>
  )
}
