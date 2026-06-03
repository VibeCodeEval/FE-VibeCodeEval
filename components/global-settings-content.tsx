"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AdminPageHeader } from "@/components/admin-page-header"
import { LoginFailedError } from "@/lib/api/admin"
import {
  getMasterPlatformSettings,
  updateMasterPlatformSettings,
  RETENTION_DAY_OPTIONS,
  daysToRetentionLabel,
  retentionLabelToDays,
  type MasterPlatformSettings,
} from "@/lib/api/master-platform-settings"

type FormState = {
  logRetentionLabel: string
  submissionRetentionLabel: string
  autoDeleteExpiredData: boolean
}

function toFormState(settings: MasterPlatformSettings): FormState {
  return {
    logRetentionLabel: daysToRetentionLabel(settings.logRetentionDays),
    submissionRetentionLabel: daysToRetentionLabel(settings.submissionRetentionDays),
    autoDeleteExpiredData: settings.autoDeleteExpiredData,
  }
}

function formStatesEqual(a: FormState, b: FormState): boolean {
  return (
    a.logRetentionLabel === b.logRetentionLabel &&
    a.submissionRetentionLabel === b.submissionRetentionLabel &&
    a.autoDeleteExpiredData === b.autoDeleteExpiredData
  )
}

export function GlobalSettingsContent() {
  const [form, setForm] = useState<FormState | null>(null)
  const [savedForm, setSavedForm] = useState<FormState | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const settings = await getMasterPlatformSettings()
      const next = toFormState(settings)
      setForm(next)
      setSavedForm(next)
      setLastUpdated(settings.updatedAt)
    } catch (e) {
      console.error("Failed to load platform settings", e)
      setForm(null)
      setSavedForm(null)
      if (e instanceof LoginFailedError) {
        setLoadError(e.message)
      } else {
        setLoadError("플랫폼 설정을 불러오지 못했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const isDirty =
    form !== null && savedForm !== null && !formStatesEqual(form, savedForm)

  const handleSave = async () => {
    if (!form) return

    setIsSaving(true)
    try {
      const result = await updateMasterPlatformSettings({
        logRetentionDays: retentionLabelToDays(form.logRetentionLabel),
        submissionRetentionDays: retentionLabelToDays(form.submissionRetentionLabel),
        autoDeleteExpiredData: form.autoDeleteExpiredData,
      })
      const next = toFormState(result)
      setForm(next)
      setSavedForm(next)
      setLastUpdated(result.updatedAt)
      toast({
        title: "설정 저장됨",
        description: "변경 사항이 성공적으로 저장되었습니다.",
      })
    } catch (e) {
      console.error("Failed to save platform settings", e)
      const message =
        e instanceof LoginFailedError ? e.message : "설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요."
      toast({
        title: "저장 실패",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (savedForm) {
      setForm(savedForm)
    }
  }

  const formatLastUpdated = (isoString: string | null) => {
    if (!isoString) return null
    try {
      return new Date(isoString).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col">
        <AdminPageHeader
          title="전역 설정"
          description="플랫폼 데이터 보관 정책을 관리합니다"
        />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-[#6B7280]">설정을 불러오는 중...</p>
        </main>
      </div>
    )
  }

  if (loadError || !form) {
    return (
      <div className="flex h-full flex-1 flex-col">
        <AdminPageHeader
          title="전역 설정"
          description="플랫폼 데이터 보관 정책을 관리합니다"
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-red-600">{loadError ?? "설정을 불러올 수 없습니다."}</p>
          <Button variant="outline" onClick={() => void loadSettings()}>
            다시 시도
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AdminPageHeader
        title="전역 설정"
        description="플랫폼 데이터 보관 정책을 관리합니다"
      />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <Card className="border border-[#E5E5E5] shadow-sm">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-lg font-semibold text-[#1A1A1A]">데이터 보관</CardTitle>
            <CardDescription className="text-sm text-[#6B7280]">
              플랫폼 기록이 저장되는 기간을 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="log-retention" className="text-sm font-medium">
                    로그 보관 기간
                  </Label>
                  <Select
                    value={form.logRetentionLabel}
                    onValueChange={(value) => setForm({ ...form, logRetentionLabel: value })}
                  >
                    <SelectTrigger id="log-retention" className="w-full">
                      <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETENTION_DAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.days} value={opt.label}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="submission-storage" className="text-sm font-medium">
                    제출물 보관 기간
                  </Label>
                  <Select
                    value={form.submissionRetentionLabel}
                    onValueChange={(value) =>
                      setForm({ ...form, submissionRetentionLabel: value })
                    }
                  >
                    <SelectTrigger id="submission-storage" className="w-full">
                      <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETENTION_DAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.days} value={opt.label}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="auto-delete" className="text-sm font-medium">
                    만료된 데이터 자동 삭제
                  </Label>
                  <span className="text-[13px] text-[#6B7280]">
                    보관 기간이 지난 데이터의 자동 삭제 정책을 설정합니다. 실제 삭제 작업은
                    서버 스케줄러가 활성화된 환경에서 실행됩니다.
                  </span>
                </div>
                <Switch
                  id="auto-delete"
                  checked={form.autoDeleteExpiredData}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, autoDeleteExpiredData: checked })
                  }
                  className="shrink-0 data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 pt-4 pb-2">
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!isDirty || isSaving}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
              className={isDirty ? "bg-[#7C3AED] hover:bg-[#6D28D9]" : ""}
            >
              {isSaving ? "저장 중..." : "변경 사항 저장"}
            </Button>
          </div>
          {lastUpdated && (
            <span className="text-xs text-[#9CA3AF]">
              마지막 저장: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </main>
    </div>
  )
}
