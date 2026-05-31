"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** 성공 모달 하단 단일 버튼 중앙 정렬 (DialogFooter 기본 sm:justify-end 덮어씀) */
export const ACCOUNT_DELETE_SUCCESS_FOOTER_CLASS =
  "flex flex-row justify-center gap-4 mt-4 sm:justify-center"

export type AccountDeleteSuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  buttonLabel: string
  onConfirm: () => void
}

export function AccountDeleteSuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  buttonLabel,
  onConfirm,
}: AccountDeleteSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
            <CheckCircle className="h-8 w-8 text-[#10B981]" />
          </div>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="mt-2 text-[#6B7280]">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className={ACCOUNT_DELETE_SUCCESS_FOOTER_CLASS}>
          <Button onClick={onConfirm} className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
