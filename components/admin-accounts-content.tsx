"use client"

import { useState, useEffect } from "react"
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
import { getAllAdmins, AdminInfo, LoginFailedError, NetworkError, issueAdminNumber, updateAdminNumber, AdminNumberUpdateRequest } from "@/lib/api/admin"
import { isMasterAdmin, isSystemMasterAdmin, SYSTEM_MASTER_ADMIN_NUMBER } from "@/lib/auth/utils"
import { useRouter } from "next/navigation"

type Admin = AdminInfo & {
  status?: string; // UI 표시용: "활성화" | "비활성화"
  lastLogin?: string;
  createdAt?: string;
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
  const [adminUsers, setAdminUsers] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
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
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // 관리자 목록 조회 함수
  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await getAllAdmins();
      // 백엔드 AdminInfo를 Admin 타입으로 변환
      const admins: Admin[] = response.admins.map((admin) => ({
        ...admin,
        status: "활성화", // 백엔드에 상태 필드가 없으면 기본값
        lastLogin: "-", // 백엔드에 마지막 로그인 필드가 없으면 기본값
        createdAt: "-", // 백엔드에 생성일 필드가 없으면 기본값
      }));
      setAdminUsers(admins);
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
          description: "관리자 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 목록 조회
  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenGenerateModal = () => {
    setGeneratedKey("")
    setCopied(false)
    setIsGenerateModalOpen(true)
  }

  const handleCopyKey = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      toast({
        description: "관리자 번호가 클립보드에 복사되었습니다.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateKey = async () => {
    if (!generatedKey) {
      // 관리자 번호 발급 API 호출
      try {
        const response = await issueAdminNumber({
          label: undefined,
          expiresAt: undefined,
        })
        setGeneratedKey(response.adminNumber)
        toast({
          title: "관리자 번호 발급 성공",
          description: "관리자 번호가 성공적으로 발급되었습니다.",
        })
        // 목록 새로고침
        fetchAdmins()
      } catch (error) {
        if (error instanceof LoginFailedError) {
          toast({
            title: "발급 실패",
            description: error.message,
            variant: "destructive",
          })
        } else if (error instanceof NetworkError) {
          toast({
            title: "네트워크 오류",
            description: error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "오류",
            description: "관리자 번호 발급 중 오류가 발생했습니다.",
            variant: "destructive",
          })
        }
      }
    } else {
      setIsGenerateModalOpen(false)
      setGeneratedKey("")
    }
  }

  const handleOpenChangeStatus = (admin: Admin) => {
    // MASTER-0001 보호 로직
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber })) {
      toast({
        title: "변경 불가",
        description: "마스터 관리자 계정은 상태를 변경할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAdmin(admin)
    setIsChangeStatusOpen(true)
  }

  const handleConfirmChangeStatus = async () => {
    if (!selectedAdmin) return

    // MASTER-0001 보호 로직 (이중 체크)
    if (isSystemMasterAdmin({ adminNumber: selectedAdmin.adminNumber })) {
      toast({
        title: "변경 불가",
        description: "마스터 관리자 계정은 상태를 변경할 수 없습니다.",
        variant: "destructive",
      });
      setIsChangeStatusOpen(false);
      return;
    }

    setIsChangingStatus(true);

    try {
      // 현재 상태를 기반으로 토글 (백엔드에 active 필드가 없으므로 임시로 true/false 토글)
      const currentActive = true; // 기본값 true
      const newActiveStatus = !currentActive;

      // PATCH API 호출
      const updated = await updateAdminNumber(selectedAdmin.adminNumber, {
        label: undefined,
        active: newActiveStatus,
        expiresAt: null,
      });

      // 성공 시 목록 재조회
      await fetchAdmins();

      toast({
        title: "상태 변경 성공",
        description: updated.active
          ? "관리자 계정이 활성화되었습니다."
          : "관리자 계정이 비활성화되었습니다.",
      });

      setIsChangeStatusOpen(false);
      setSelectedAdmin(null);
    } catch (error) {
      if (error instanceof LoginFailedError) {
        toast({
          title: "상태 변경 실패",
          description: error.message,
          variant: "destructive",
        });
      } else if (error instanceof NetworkError) {
        toast({
          title: "네트워크 오류",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "오류",
          description: "상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    } finally {
      setIsChangingStatus(false);
    }
  }

  const handleOpenResetPassword = (admin: Admin) => {
    // MASTER-0001 보호 로직
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber })) {
      toast({
        title: "변경 불가",
        description: "마스터 관리자 계정은 비밀번호를 재설정할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
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
      description: "임시 비밀번호가 클립보드에 복사되었습니다.",
    })
    setTimeout(() => setTempPasswordCopied(false), 2000)
  }

  const handleOpenReissueKey = (admin: Admin) => {
    // MASTER-0001 보호 로직
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber })) {
      toast({
        title: "변경 불가",
        description: "마스터 관리자 계정은 시크릿 키를 재발급할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAdmin(admin)
    setIsReissueKeyOpen(true)
  }

  const formatDateToKorean = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "오후" : "오전"
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, "0")
    return `${year}년 ${month}월 ${day}일 ${ampm} ${displayHours}:${displayMinutes}`
  }

  const handleConfirmReissueKey = () => {
    const randomStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 11)
    const newKey = `sk_prod_${randomStr}`
    setReissuedSecretKey(newKey)
    
    // Update the admin user's secret key and lastKeyIssued date
    if (selectedAdmin) {
      const now = new Date()
      const koreanDate = formatDateToKorean(now)
      setAdminUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedAdmin.id
            ? { ...user, secretKey: newKey, lastKeyIssued: koreanDate }
            : user
        )
      )
      // Update selectedAdmin to reflect the changes
      setSelectedAdmin({
        ...selectedAdmin,
        secretKey: newKey,
        lastKeyIssued: koreanDate,
      })
    }
    
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
    // MASTER-0001 보호 로직
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber })) {
      toast({
        title: "삭제 불가",
        description: "마스터 관리자 계정은 삭제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
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
      // 시크릿 키는 백엔드에 없는 필드이므로 임시로 관리자 번호 복사
      await navigator.clipboard.writeText(selectedAdmin.adminNumber)
      setDetailsKeyCopied(true)
      toast({
        description: "관리자 번호가 클립보드에 복사되었습니다.",
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
            + 관리자 번호 발급
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
                    관리자 번호
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
                    className="w-[100px]"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    역할
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      관리자 목록을 불러오는 중...
                    </TableCell>
                  </TableRow>
                ) : adminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      등록된 관리자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers.map((user) => {
                    const isMaster = isMasterAdmin({
                      adminNumber: user.adminNumber,
                      role: user.role,
                    });
                    const isSystemMaster = isSystemMasterAdmin({ adminNumber: user.adminNumber });
                    
                    return (
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
                          <div className="flex items-center gap-2">
                            {user.adminNumber}
                            {isMaster && (
                              <Badge
                                variant="default"
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  backgroundColor: "#FEF3C7",
                                  color: "#92400E",
                                  border: "none",
                                }}
                              >
                                MASTER
                              </Badge>
                            )}
                          </div>
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
                        <TableCell className="w-[100px]">
                          <Badge
                            variant={user.role === "MASTER" ? "default" : "secondary"}
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              backgroundColor: user.role === "MASTER" ? "#FEF3C7" : "#F3F4F6",
                              color: user.role === "MASTER" ? "#92400E" : "#6B7280",
                              border: "none",
                            }}
                          >
                            {user.role === "MASTER" ? "마스터" : "관리자"}
                          </Badge>
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
                            className={`flex items-center gap-2 ${isSystemMaster ? "cursor-not-allowed opacity-60" : ""}`}
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            disabled={isSystemMaster}
                            onClick={() => !isSystemMaster && handleOpenChangeStatus(user)}
                          >
                            <Power className="h-4 w-4" />
                            상태 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`flex items-center gap-2 ${isSystemMaster ? "cursor-not-allowed opacity-60" : ""}`}
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            disabled={isSystemMaster}
                            onClick={() => !isSystemMaster && handleOpenResetPassword(user)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            비밀번호 재설정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`flex items-center gap-2 ${isSystemMaster ? "cursor-not-allowed opacity-60" : ""}`}
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            disabled={isSystemMaster}
                            onClick={() => !isSystemMaster && handleOpenReissueKey(user)}
                          >
                            <KeyRound className="h-4 w-4" />
                            시크릿 키 재발급
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`flex items-center gap-2 ${isSystemMaster ? "cursor-not-allowed opacity-40" : ""}`}
                            style={{ fontSize: "14px", color: isSystemMaster ? "#9CA3AF" : "#DC2626" }}
                            disabled={isSystemMaster}
                            onClick={() => !isSystemMaster && handleOpenDeleteAdmin(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                            관리자 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                    );
                  })
                )}
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
              {generatedKey
                ? "발급된 관리자 번호를 안전하게 보관하세요. 이 번호는 한 번만 표시됩니다."
                : "새 관리자 계정 생성을 위한 관리자 번호를 발급합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {generatedKey ? (
              <>
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  발급된 관리자 번호
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
                  이 번호를 새 관리자에게 안전하게 전달하세요.
                </p>
              </>
            ) : (
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                }}
              >
                관리자 번호를 발급하려면 아래 버튼을 클릭하세요.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateModalOpen(false)
                setGeneratedKey("")
              }}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {generatedKey ? "닫기" : "취소"}
            </Button>
            {!generatedKey && (
              <Button
                onClick={handleCreateKey}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                관리자 번호 발급
              </Button>
            )}
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
              {selectedAdmin?.status === "활성화"
                ? "해당 관리자 계정을 비활성화하시겠습니까? 비활성화된 관리자는 더 이상 관리자 화면에 로그인할 수 없습니다. 계속 진행하시겠습니까?"
                : "해당 관리자 계정을 활성화하시겠습니까? 이 관리자를 다시 활성화하여 관리자 화면에 접근할 수 있게 합니다. 계속 진행하시겠습니까?"}
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
              disabled={isChangingStatus}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmChangeStatus}
              disabled={isChangingStatus}
              style={{
                backgroundColor: selectedAdmin?.status === "활성화" ? "#DC2626" : "#16A34A",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
                opacity: isChangingStatus ? 0.6 : 1,
              }}
            >
              {isChangingStatus
                ? "변경 중..."
                : selectedAdmin?.status === "활성화"
                ? "비활성화하기"
                : "활성화하기"}
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
              비밀번호 재설정
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
              관리자의 다음 로그인을 위해 임시 비밀번호가 생성됩니다.
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1A1A1A",
              }}
            >
              이 관리자의 비밀번호를 재설정하시겠습니까?
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
              취소
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
              비밀번호 재설정
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
              임시 비밀번호 생성 완료
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
              }}
            >
              이 비밀번호를 복사하여 관리자에게 안전하게 전달해주세요.
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
              임시 비밀번호
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
              닫기
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
                  <p className="text-xs text-muted-foreground">관리자 번호</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                      {selectedAdmin?.adminNumber}
                    </p>
                    {selectedAdmin && isMasterAdmin({
                      adminNumber: selectedAdmin.adminNumber,
                      role: selectedAdmin.role,
                    }) && (
                      <Badge
                        variant="default"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "none",
                        }}
                      >
                        MASTER
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">역할</p>
                    <Badge
                      variant={selectedAdmin?.role === "MASTER" ? "default" : "secondary"}
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor: selectedAdmin?.role === "MASTER" ? "#FEF3C7" : "#F3F4F6",
                        color: selectedAdmin?.role === "MASTER" ? "#92400E" : "#6B7280",
                        border: "none",
                      }}
                    >
                      {selectedAdmin?.role === "MASTER" ? "마스터" : "관리자"}
                    </Badge>
                  </div>
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
                      {showSecretKey ? selectedAdmin?.adminNumber : "•••••••••••••••••••••"}
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
            {selectedAdmin && isSystemMasterAdmin({ adminNumber: selectedAdmin.adminNumber }) ? (
              <>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled
                  style={{
                    color: "#9CA3AF",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <Power className="h-4 w-4 mr-2" /> 상태 변경
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled
                  style={{
                    color: "#9CA3AF",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> 비밀번호 재설정
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled
                  style={{
                    color: "#9CA3AF",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2" /> 시크릿 키 재발급
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled
                  style={{
                    color: "#9CA3AF",
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> 관리자 삭제
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full bg-transparent" onClick={handleChangeStatusFromPanel}>
                  <Power className="h-4 w-4 mr-2" />
                  상태 변경
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={handleResetPasswordFromPanel}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  비밀번호 재설정
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => {
                  setIsDetailsOpen(false);
                  if (selectedAdmin) {
                    handleOpenReissueKey(selectedAdmin);
                  }
                }}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  시크릿 키 재발급
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleDeleteAdminFromPanel}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  관리자 삭제
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
