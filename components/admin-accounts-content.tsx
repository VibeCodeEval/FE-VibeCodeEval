"use client"

import { useState } from "react"
import { MoreHorizontal, Copy, Check, Eye, Power, RotateCcw, KeyRound, Trash2, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

const initialAdminUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@company.com",
    status: "활성화",
    lastLogin: "2025-01-14 10:33 AM",
    createdAt: "Dec 15, 2024",
    secretKey: "sk_prod_abc123xyz789def456",
    lastKeyIssued: "Jan 10, 2025 at 09:15 AM",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    status: "활성화",
    lastLogin: "2025-01-14 10:33 AM",
    createdAt: "Dec 20, 2024",
    secretKey: "sk_prod_def456abc789xyz123",
    lastKeyIssued: "Jan 12, 2025 at 02:30 PM",
  },
  {
    id: 3,
    name: "Mike Davis",
    email: "mike.davis@company.com",
    status: "비활성화",
    lastLogin: "2025-01-10 11:05 AM",
    createdAt: "Nov 28, 2024",
    secretKey: "sk_prod_xyz789def456abc123",
    lastKeyIssued: "Dec 05, 2024 at 11:45 AM",
  },
]

type Admin = {
  id: number
  name: string
  email: string
  status: string
  lastLogin: string
  createdAt: string
  secretKey: string
  lastKeyIssued: string
}

function generateSecretKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let key = "sk_prod_"
  for (let i = 0; i < 22; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = "temp-"
  for (let i = 0; i < 5; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  password += "!"
  password += chars.charAt(Math.floor(Math.random() * 26)) // Add a letter at the end
  return password
}

export function AdminAccountsContent() {
  const [adminUsers, setAdminUsers] = useState<Admin[]>(initialAdminUsers)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [generatedKey, setGeneratedKey] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isResetPasswordResultOpen, setIsResetPasswordResultOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState("")
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false)
  const [isReissueKeyOpen, setIsReissueKeyOpen] = useState(false)
  const [isReissueKeyResultOpen, setIsReissueKeyResultOpen] = useState(false)
  const [reissuedSecretKey, setReissuedSecretKey] = useState("")
  const [reissuedKeyCopied, setReissuedKeyCopied] = useState(false)
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [detailsKeyCopied, setDetailsKeyCopied] = useState(false)
  const { toast } = useToast()

  const handleOpenGenerateModal = () => {
    setGeneratedKey(generateSecretKey())
    setCopied(false)
    setIsGenerateModalOpen(true)
  }

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    toast({
      description: "Secret key copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateKey = () => {
    setIsGenerateModalOpen(false)
  }

  const handleOpenChangeStatus = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsChangeStatusOpen(true)
  }

  const handleConfirmChangeStatus = () => {
    if (!selectedAdmin) return

    setAdminUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === selectedAdmin.id ? { ...user, status: user.status === "활성화" ? "비활성화" : "활성화" } : user,
      ),
    )
    setIsChangeStatusOpen(false)
  }

  const handleOpenResetPassword = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsResetPasswordOpen(true)
  }

  const handleConfirmResetPassword = () => {
    const newTempPassword = generateTempPassword()
    setTempPassword(newTempPassword)
    setTempPasswordCopied(false)
    setIsResetPasswordOpen(false)
    setIsResetPasswordResultOpen(true)
  }

  const handleCopyTempPassword = async () => {
    await navigator.clipboard.writeText(tempPassword)
    setTempPasswordCopied(true)
    toast({
      description: "Temporary password copied to clipboard.",
    })
    setTimeout(() => setTempPasswordCopied(false), 2000)
  }

  const handleOpenReissueKey = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsReissueKeyOpen(true)
  }

  const handleConfirmReissueKey = () => {
    const randomStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 11)
    setReissuedSecretKey(`sk_prod_${randomStr}`)
    setIsReissueKeyOpen(false)
    setIsReissueKeyResultOpen(true)
    setReissuedKeyCopied(false)
  }

  const copyReissuedKey = async () => {
    await navigator.clipboard.writeText(reissuedSecretKey)
    setReissuedKeyCopied(true)
    toast({
      title: "Secret key copied to clipboard",
      duration: 2000,
    })
    setTimeout(() => setReissuedKeyCopied(false), 2000)
  }

  const handleOpenDeleteAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsDeleteAdminOpen(true)
  }

  const handleConfirmDeleteAdmin = () => {
    if (selectedAdmin) {
      setAdminUsers((prev) => prev.filter((a) => a.id !== selectedAdmin.id))
      setIsDeleteAdminOpen(false)
    }
  }

  const handleOpenDetails = (admin: Admin) => {
    setSelectedAdmin(admin)
    setShowSecretKey(false)
    setDetailsKeyCopied(false)
    setIsDetailsOpen(true)
  }

  const handleCopyDetailsKey = async () => {
    if (selectedAdmin) {
      await navigator.clipboard.writeText(selectedAdmin.secretKey)
      setDetailsKeyCopied(true)
      toast({
        description: "Secret key copied to clipboard.",
      })
      setTimeout(() => setDetailsKeyCopied(false), 2000)
    }
  }

  const handleChangeStatusFromPanel = () => {
    setIsDetailsOpen(false)
    setIsChangeStatusOpen(true)
  }

  const handleResetPasswordFromPanel = () => {
    setIsDetailsOpen(false)
    setIsResetPasswordOpen(true)
  }

  const handleDeleteAdminFromPanel = () => {
    setIsDetailsOpen(false)
    setIsDeleteAdminOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 p-6 min-h-[calc(100vh-80px)]">
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1A1A1A",
            marginBottom: "4px",
          }}
        >
          관리자 계정 관리
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          관리자 계정과 접근 권한을 관리합니다.
        </p>
      </div>

      {/* Admin Users Card */}
      <Card className="border border-[#E5E5E5] shadow-sm flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-6">
          <CardTitle
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            관리자 목록
          </CardTitle>
          <Button
            size="sm"
            onClick={handleOpenGenerateModal}
            style={{
              backgroundColor: "#3B82F6",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            + 인증키 생성
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0 flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-[520px]">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-t border-[#E5E5E5] hover:bg-transparent">
                  <TableHead
                    className="w-[220px]"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                      paddingLeft: "24px",
                    }}
                  >
                    관리자 이름
                  </TableHead>
                  <TableHead
                    className="w-[320px]"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    이메일
                  </TableHead>
                  <TableHead
                    className="w-[120px]"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    상태
                  </TableHead>
                  <TableHead
                    className="w-[200px]"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    최근 로그인
                  </TableHead>
                  <TableHead
                    className="w-[80px] text-right"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                      paddingRight: "24px",
                    }}
                  >
                    작업
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id} className="border-t border-[#E5E5E5] hover:bg-[#F9FAFB]">
                    <TableCell
                      className="w-[220px]"
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1A1A1A",
                        paddingLeft: "24px",
                      }}
                    >
                      {user.name}
                    </TableCell>
                    <TableCell
                      className="w-[320px]"
                      style={{
                        fontSize: "14px",
                        color: "#6B7280",
                      }}
                    >
                      {user.email}
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <Badge
                        variant={user.status === "활성화" ? "default" : "secondary"}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: user.status === "활성화" ? "#DCFCE7" : "#F3F4F6",
                          color: user.status === "활성화" ? "#166534" : "#6B7280",
                          border: "none",
                        }}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="w-[200px]"
                      style={{
                        fontSize: "14px",
                        color: "#6B7280",
                      }}
                    >
                      {user.lastLogin}
                    </TableCell>
                    <TableCell className="w-[80px] text-right" style={{ paddingRight: "24px" }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#F3F4F6]">
                            <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            onClick={() => handleOpenDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            onClick={() => handleOpenChangeStatus(user)}
                          >
                            <Power className="h-4 w-4" />
                            상태 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            onClick={() => handleOpenResetPassword(user)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            비밀번호 재설정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            onClick={() => handleOpenReissueKey(user)}
                          >
                            <KeyRound className="h-4 w-4" />
                            시크릿 키 재발급
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            style={{ fontSize: "14px", color: "#DC2626" }}
                            onClick={() => handleOpenDeleteAdmin(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            관리자 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal — Generate New Secret Key */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              새 시크릿 키 생성
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              이 키는 관리자가 시스템에 가입할 때 사용됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A1A1A",
                display: "block",
                marginBottom: "8px",
              }}
            >
              시크릿 키
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={generatedKey}
                className="flex-1 bg-[#F9FAFB] font-mono text-[#1A1A1A]"
                style={{ fontSize: "14px" }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyKey}
                className="h-10 w-10 shrink-0 bg-transparent"
                style={{
                  borderColor: "#E5E5E5",
                }}
              >
                {copied ? <Check className="h-4 w-4 text-[#16A34A]" /> : <Copy className="h-4 w-4 text-[#6B7280]" />}
              </Button>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "8px",
              }}
            >
              이 키는 한 번만 표시됩니다. 안전하게 보관하세요.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsGenerateModalOpen(false)}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateKey}
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              키 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Change Status */}
      <Dialog open={isChangeStatusOpen} onOpenChange={setIsChangeStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              상태 변경
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              이 관리자의 상태를 변경하시겠습니까?
            </p>
            <div
              className="mt-4"
              style={{
                borderTop: "1px solid #E5E5E5",
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsChangeStatusOpen(false)}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmChangeStatus}
              style={{
                backgroundColor: selectedAdmin?.status === "활성화" ? "#DC2626" : "#16A34A",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {selectedAdmin?.status === "활성화" ? "관리자 비활성화" : "관리자 활성화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Reset Password (confirmation) */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
                marginBottom: "12px",
              }}
            >
              This will generate a temporary password for the admin's next login.
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              Are you sure you want to reset this admin's password?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordOpen(false)}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Temporary password generated (result) */}
      <Dialog open={isResetPasswordResultOpen} onOpenChange={setIsResetPasswordResultOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              Temporary password generated
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              Please copy and share this password securely with the admin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A1A1A",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Temporary Password
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={tempPassword}
                className="flex-1 bg-[#F9FAFB] font-mono text-[#1A1A1A]"
                style={{ fontSize: "14px" }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyTempPassword}
                className="h-10 w-10 shrink-0 bg-transparent"
                style={{
                  borderColor: "#E5E5E5",
                }}
              >
                {tempPasswordCopied ? (
                  <Check className="h-4 w-4 text-[#16A34A]" />
                ) : (
                  <Copy className="h-4 w-4 text-[#6B7280]" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsResetPasswordResultOpen(false)}
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Reissue Secret Key confirmation dialog */}
      <Dialog open={isReissueKeyOpen} onOpenChange={setIsReissueKeyOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
              Reissue Secret Key
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6" }}>
              The current secret key will be invalidated and replaced with a new one. Do you want to continue?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReissueKeyOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfirmReissueKey}>
              Reissue Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Reissue Secret Key result dialog */}
      <Dialog open={isReissueKeyResultOpen} onOpenChange={setIsReissueKeyResultOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
              New Secret Key Issued
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.6" }}>
              This secret key will only be shown once. Please copy and store it safely.
            </p>
            <div className="space-y-2">
              <label style={{ fontSize: "14px", fontWeight: 500, color: "#1A1A1A" }}>Secret Key</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={reissuedSecretKey} style={{ fontSize: "14px", fontFamily: "monospace" }} />
                <Button variant="outline" size="icon" onClick={copyReissuedKey} className="shrink-0 bg-transparent">
                  {reissuedKeyCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsReissueKeyResultOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Delete Admin confirmation dialog */}
      <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>Delete Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <p style={{ fontSize: "14px", color: "#374151" }}>
                Are you sure you want to permanently delete this admin?
              </p>
              <p style={{ fontSize: "14px", color: "#374151" }}>This action cannot be undone.</p>
            </div>

            {selectedAdmin && (
              <div className="bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                  {selectedAdmin.email}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAdmin.name}</p>
              </div>
            )}

            <p style={{ fontSize: "14px", color: "#374151" }}>All access for this admin will be removed immediately.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAdminOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteAdmin}>
              Delete Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-[420px] max-w-full pl-4 pr-6 py-6 flex flex-col gap-6">
          <SheetHeader className="space-y-1 items-start p-0 mb-4">
            <SheetTitle className="text-left" style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>
              관리자 상세 정보
            </SheetTitle>
            <SheetDescription className="text-left" style={{ fontSize: "14px", color: "#6B7280" }}>
              해당 관리자의 전체 정보를 확인하세요.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>기본 정보</h3>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">관리자 이름</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">이메일</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">상태</p>
                  <Badge
                    variant={selectedAdmin?.status === "활성화" ? "default" : "secondary"}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor: selectedAdmin?.status === "활성화" ? "#DCFCE7" : "#F3F4F6",
                      color: selectedAdmin?.status === "활성화" ? "#166534" : "#6B7280",
                      border: "none",
                    }}
                  >
                    {selectedAdmin?.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">마지막 로그인</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.lastLogin}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">생성일</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.createdAt}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Security Settings Section */}
            <div className="space-y-4">
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#1A1A1A" }}>보안 설정</h3>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">비밀번호 상태</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    비밀번호 설정됨
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">시크릿 키</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-[#F9FAFB] rounded-md px-3 py-2 font-mono text-sm"
                      style={{ color: "#1A1A1A" }}
                    >
                      {showSecretKey ? selectedAdmin?.secretKey : "•••••••••••••••••••••"}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="h-9 w-9 shrink-0 bg-transparent border-[#E5E5E5]"
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4 text-[#6B7280]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#6B7280]" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyDetailsKey}
                      className="h-9 w-9 shrink-0 bg-transparent border-[#E5E5E5]"
                    >
                      {detailsKeyCopied ? (
                        <Check className="h-4 w-4 text-[#16A34A]" />
                      ) : (
                        <Copy className="h-4 w-4 text-[#6B7280]" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">마지막 시크릿 키 발급일</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.lastKeyIssued}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-6 pt-4 border-t flex flex-col gap-2">
            <Button variant="outline" className="w-full bg-transparent" onClick={handleChangeStatusFromPanel}>
              <Power className="h-4 w-4 mr-2" />
              상태 변경
            </Button>
            <Button variant="outline" className="w-full bg-transparent" onClick={handleResetPasswordFromPanel}>
              <RotateCcw className="h-4 w-4 mr-2" />
              비밀번호 재설정
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleDeleteAdminFromPanel}>
              <Trash2 className="h-4 w-4 mr-2" />
              관리자 삭제
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
