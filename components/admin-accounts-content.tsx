"use client"

import { useState, useEffect, type CSSProperties } from "react"
import { MoreHorizontal, Copy, Check, Eye, Power, RotateCcw, Trash2 } from "lucide-react"
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
import {
  fetchMasterAdminAccounts,
  issueMasterAdminNumber,
  updateMasterAdminAccountStatus,
  resetMasterAdminPassword,
  deleteMasterAdminAccount,
  sortMasterAdminAccounts,
  LoginFailedError,
  NetworkError,
  type MasterAdminAccount,
} from "@/lib/api/master-admin-accounts"
import { isMasterAdmin, isSystemMasterAdmin } from "@/lib/auth/utils"
import { useRouter } from "next/navigation"
import { AccountDeleteSuccessDialog } from "@/components/account-delete-success-dialog"
import { AdminPageHeader } from "@/components/admin-page-header"

function displayValue(value: string | null | undefined): string {
  return value && value.trim() ? value : "-"
}

/** 관리자 계정 상태 Badge (활성=초록, 비활성=빨간 계열) */
function adminAccountStatusBadgeStyle(status: MasterAdminAccount["status"]): CSSProperties {
  if (status === "활성화") {
    return { backgroundColor: "#DCFCE7", color: "#166534" }
  }
  return { backgroundColor: "#FEE2E2", color: "#DC2626" }
}

export function AdminAccountsContent() {
  const [adminUsers, setAdminUsers] = useState<MasterAdminAccount[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [listError, setListError] = useState<string | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [generatedKey, setGeneratedKey] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<MasterAdminAccount | null>(null)
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isResetPasswordResultOpen, setIsResetPasswordResultOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState("")
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false)
  const [isDeleteAdminOpen, setIsDeleteAdminOpen] = useState(false)
  const [isDeleteAdminSuccessOpen, setIsDeleteAdminSuccessOpen] = useState(false)
  const [deleteAdminError, setDeleteAdminError] = useState("")
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const fetchAdmins = async () => {
    setIsLoading(true)
    setListError(null)
    try {
      const { admins } = await fetchMasterAdminAccounts()
      setAdminUsers(admins)
    } catch (error) {
      setAdminUsers([])
      if (error instanceof LoginFailedError) {
        const message = error.message || "관리자 목록 조회에 실패했습니다."
        setListError(message)
        if (error.message.includes("인증")) {
          toast({
            title: "인증 오류",
            description: "다시 로그인해주세요.",
            variant: "destructive",
          })
          router.push("/")
        } else {
          toast({
            title: "조회 실패",
            description: message,
            variant: "destructive",
          })
        }
      } else if (error instanceof NetworkError) {
        const message = error.message
        setListError(message)
        toast({
          title: "네트워크 오류",
          description: message,
          variant: "destructive",
        })
      } else {
        const message = "관리자 목록을 불러오는 중 오류가 발생했습니다."
        setListError(message)
        toast({
          title: "오류",
          description: message,
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
        const response = await issueMasterAdminNumber({
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

  const handleOpenChangeStatus = (admin: MasterAdminAccount) => {
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

  // 공용 상태 변경 핸들러 (모달에서 확인 버튼을 누른 후 호출됨)
  const handleToggleStatus = async (admin: MasterAdminAccount) => {
    // MASTER-0001 보호 로직 (이중 체크)
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber })) {
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
      const updated = await updateMasterAdminAccountStatus(admin)

      setAdminUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.adminNumber === admin.adminNumber ? updated : user
        )
      )

      if (selectedAdmin && selectedAdmin.adminNumber === admin.adminNumber) {
        setSelectedAdmin(updated)
      }

      toast({
        title: "상태 변경 성공",
        description: updated.isActive
          ? "관리자 계정이 활성화되었습니다."
          : "관리자 계정이 비활성화되었습니다.",
      })

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

  const handleConfirmChangeStatus = async () => {
    if (!selectedAdmin) return;
    await handleToggleStatus(selectedAdmin);
  }

  const handleOpenResetPassword = (admin: MasterAdminAccount) => {
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber }) || admin.role === "MASTER") {
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

  const handleConfirmResetPassword = async () => {
    if (!selectedAdmin) return

    setIsResettingPassword(true)
    try {
      const { temporaryPassword } = await resetMasterAdminPassword(selectedAdmin)
      setTempPassword(temporaryPassword)
      setTempPasswordCopied(false)
      setIsResetPasswordOpen(false)
      setIsResetPasswordResultOpen(true)
    } catch (error) {
      const message =
        error instanceof LoginFailedError || error instanceof NetworkError
          ? error.message
          : "비밀번호 재설정에 실패했습니다."
      toast({
        title: "비밀번호 재설정 불가",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleCopyTempPassword = async () => {
    await navigator.clipboard.writeText(tempPassword)
    setTempPasswordCopied(true)
    toast({
      description: "임시 비밀번호가 클립보드에 복사되었습니다.",
    })
    setTimeout(() => setTempPasswordCopied(false), 2000)
  }

  const handleCloseResetPasswordResult = () => {
    setIsResetPasswordResultOpen(false)
    setTempPassword("")
    setTempPasswordCopied(false)
  }

  const handleOpenDeleteAdmin = (admin: MasterAdminAccount) => {
    if (isSystemMasterAdmin({ adminNumber: admin.adminNumber }) || admin.role === "MASTER") {
      toast({
        title: "삭제 불가",
        description: "마스터 관리자 계정은 삭제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setDeleteAdminError("")
    setSelectedAdmin(admin)
    setIsDeleteAdminOpen(true)
  }

  const handleConfirmDeleteAdmin = async () => {
    if (!selectedAdmin) return
    setDeleteAdminError("")
    setIsDeletingAdmin(true)
    try {
      await deleteMasterAdminAccount(selectedAdmin)
      setAdminUsers((prev) => prev.filter((a) => a.id !== selectedAdmin.id))
      setIsDeleteAdminOpen(false)
      setIsDetailsOpen(false)
      setSelectedAdmin(null)
      setIsDeleteAdminSuccessOpen(true)
    } catch (error) {
      const message =
        error instanceof LoginFailedError || error instanceof NetworkError
          ? error.message
          : "관리자 삭제에 실패했습니다."
      setDeleteAdminError(message)
    } finally {
      setIsDeletingAdmin(false)
    }
  }

  const handleOpenDetails = (admin: MasterAdminAccount) => {
    setSelectedAdmin(admin)
    setIsDetailsOpen(true)
  }

  const handleChangeStatusFromPanel = () => {
    setIsDetailsOpen(false)
    setIsChangeStatusOpen(true)
  }

  const handleResetPasswordFromPanel = () => {
    if (!selectedAdmin) return
    setIsDetailsOpen(false)
    handleOpenResetPassword(selectedAdmin)
  }

  const handleDeleteAdminFromPanel = () => {
    if (!selectedAdmin) return
    setIsDetailsOpen(false)
    handleOpenDeleteAdmin(selectedAdmin)
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AdminPageHeader
        title="관리자 계정 관리"
        description="관리자 계정과 접근 권한을 관리합니다."
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
      {/* Admin Users Card */}
      <Card className="flex min-w-0 flex-1 flex-col border border-[#E5E5E5] shadow-sm">
        <CardHeader className="flex min-w-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle
            className="min-w-0 shrink"
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
            className="w-full shrink-0 sm:w-auto"
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
        <CardContent className="flex min-w-0 flex-1 flex-col overflow-hidden px-0 pb-0 pt-0">
          {listError && !isLoading && (
            <p
              className="mx-6 mb-3 rounded-lg border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]"
              role="alert"
            >
              {listError}
            </p>
          )}
          <div className="min-w-0 flex-1 overflow-x-auto">
            <ScrollArea className="h-[520px]">
            <Table className="w-full min-w-[1048px] table-fixed">
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
                    className="w-[108px] text-center align-middle"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    역할
                  </TableHead>
                  <TableHead
                    className="w-[120px] text-center align-middle"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    상태
                  </TableHead>
                  <TableHead
                    className="w-[200px] text-center align-middle whitespace-nowrap"
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B7280",
                    }}
                  >
                    최근 로그인
                  </TableHead>
                  <TableHead
                    className="w-[80px] text-center align-middle"
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
                  sortMasterAdminAccounts(adminUsers).map((user) => {
                    const isMaster = isMasterAdmin({
                      adminNumber: user.adminNumber,
                      role: user.role,
                    });
                    const isSystemMaster =
                      isSystemMasterAdmin({ adminNumber: user.adminNumber }) ||
                      user.role === "MASTER";
                    
                    return (
                      <TableRow key={user.id} className="border-t border-[#E5E5E5] hover:bg-[#F9FAFB]">
                        <TableCell
                          className="max-w-[220px] min-w-0 overflow-hidden w-[220px]"
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1A1A1A",
                            paddingLeft: "24px",
                          }}
                        >
                          <div className="flex min-w-0 max-w-full items-center gap-2">
                            <span
                              className="min-w-0 truncate whitespace-nowrap"
                              title={user.adminNumber}
                            >
                              {user.adminNumber}
                            </span>
                            {isMaster && (
                              <Badge
                                variant="default"
                                className="shrink-0"
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
                          className="max-w-[320px] min-w-0 overflow-hidden w-[320px]"
                          style={{
                            fontSize: "14px",
                            color: "#6B7280",
                          }}
                        >
                          <span
                            className="block max-w-full truncate whitespace-nowrap"
                            title={user.email}
                          >
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell className="w-[108px] text-center align-middle">
                          <div className="flex justify-center items-center">
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
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] text-center align-middle">
                          <div className="flex justify-center items-center">
                            <Badge
                              variant={user.status === "활성화" ? "default" : "secondary"}
                              style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                ...adminAccountStatusBadgeStyle(user.status),
                                border: "none",
                              }}
                            >
                              {user.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell
                          className="w-[200px] text-center align-middle whitespace-nowrap tabular-nums"
                          style={{
                            fontSize: "14px",
                            color: "#6B7280",
                          }}
                        >
                          {displayValue(user.lastLogin)}
                        </TableCell>
                        <TableCell
                          className="w-[80px] text-center align-middle"
                          style={{ paddingRight: "24px" }}
                        >
                          <div className="flex justify-center items-center">
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
                            className={`flex items-center gap-2 ${isSystemMaster || user.role === "MASTER" ? "cursor-not-allowed opacity-60" : ""}`}
                            style={{ fontSize: "14px", color: "#1A1A1A" }}
                            disabled={isSystemMaster || user.role === "MASTER"}
                            onClick={() =>
                              !isSystemMaster &&
                              user.role !== "MASTER" &&
                              handleOpenResetPassword(user)
                            }
                          >
                            <RotateCcw className="h-4 w-4" />
                            비밀번호 재설정
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          </div>
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
                lineHeight: "1.6",
              }}
            >
              해당 관리자의 비밀번호를 임시 비밀번호로 재설정하시겠습니까?
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#6B7280",
                lineHeight: "1.6",
              }}
            >
              생성된 임시 비밀번호는 한 번만 표시됩니다. 관리자에게 안전하게 전달한 뒤, 해당 관리자는 설정 화면에서 본인이 직접 비밀번호를 변경할 수 있습니다.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordOpen(false)}
              disabled={isResettingPassword}
              style={{
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              disabled={isResettingPassword}
              style={{
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
                opacity: isResettingPassword ? 0.6 : 1,
              }}
            >
              {isResettingPassword ? "처리 중..." : "비밀번호 재설정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Temporary password generated (result) */}
      <Dialog
        open={isResetPasswordResultOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseResetPasswordResult()
        }}
      >
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
              이 비밀번호는 한 번만 표시됩니다. 모달을 닫으면 다시 확인할 수 없습니다.
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
              onClick={handleCloseResetPasswordResult}
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

      {/* Modal — Delete Admin confirmation dialog */}
      <Dialog open={isDeleteAdminOpen} onOpenChange={setIsDeleteAdminOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A" }}>관리자 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <p style={{ fontSize: "14px", color: "#374151" }}>
                해당 관리자 계정을 삭제하시겠습니까?
              </p>
              <p style={{ fontSize: "14px", color: "#374151" }}>삭제된 계정은 복구할 수 없습니다.</p>
            </div>

            {selectedAdmin && (
              <div className="bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                  {selectedAdmin.email}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAdmin.adminNumber}</p>
              </div>
            )}

            <p style={{ fontSize: "14px", color: "#374151" }}>해당 관리자의 접근 권한이 즉시 제거됩니다.</p>
            {deleteAdminError && (
              <p className="text-sm text-red-500">{deleteAdminError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAdminError("")
                setIsDeleteAdminOpen(false)
              }}
              disabled={isDeletingAdmin}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteAdmin}
              disabled={isDeletingAdmin}
            >
              {isDeletingAdmin ? "삭제 중..." : "관리자 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccountDeleteSuccessDialog
        open={isDeleteAdminSuccessOpen}
        onOpenChange={setIsDeleteAdminSuccessOpen}
        title="관리자 계정이 삭제되었습니다."
        description="해당 관리자 계정이 정상적으로 삭제되었습니다."
        buttonLabel="확인"
        onConfirm={() => setIsDeleteAdminSuccessOpen(false)}
      />

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
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {selectedAdmin?.adminNumber}
                  </p>
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
                  <p className="text-xs text-muted-foreground">이름</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {displayValue(selectedAdmin?.displayName)}
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
                      ...(selectedAdmin ? adminAccountStatusBadgeStyle(selectedAdmin.status) : {}),
                      border: "none",
                    }}
                  >
                    {selectedAdmin?.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">마지막 로그인</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {displayValue(selectedAdmin?.lastLogin)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">생성일</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {displayValue(selectedAdmin?.createdAt)}
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
                <Button variant="destructive" className="w-full" onClick={handleDeleteAdminFromPanel}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  관리자 삭제
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      </main>
    </div>
  )
}
