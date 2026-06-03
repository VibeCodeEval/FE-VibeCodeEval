"use client"

import { useEffect, useState } from "react"
import { Server, Database, Cpu, type LucideIcon } from "lucide-react"
import { getSystemStatus, type SystemStatusServiceItem } from "@/lib/api/admin"

const SERVICE_ICONS: Record<string, LucideIcon> = {
  api: Server,
  database: Database,
  ai: Cpu,
}

const FALLBACK_SERVICES: SystemStatusServiceItem[] = [
  { key: "api", name: "API 서버", status: "DOWN", latencyMs: null },
  { key: "database", name: "데이터베이스", status: "DOWN", latencyMs: null },
  { key: "ai", name: "AI 게이트웨이", status: "DOWN", latencyMs: null },
]

function formatLatency(latencyMs: number | null | undefined, isLoading: boolean): string {
  if (isLoading) return "–"
  if (latencyMs === null || latencyMs === undefined || Number.isNaN(Number(latencyMs))) {
    return "–"
  }
  return `${Math.round(Number(latencyMs))}ms`
}

function formatStatusLabel(status: string | undefined, isLoading: boolean): string {
  if (isLoading) return "–"
  if (status === "UP") return "정상 운영 중"
  return "점검 필요"
}

function statusBadgeClass(status: string | undefined, isLoading: boolean): string {
  if (isLoading) {
    return "px-3 py-1 text-xs font-medium text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] rounded-full"
  }
  if (status === "UP") {
    return "px-3 py-1 text-xs font-medium text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-full"
  }
  return "px-3 py-1 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-full"
}

export function ServerStatusContent() {
  const [services, setServices] = useState<SystemStatusServiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(false)
      try {
        const data = await getSystemStatus()
        if (!cancelled) {
          setServices(data.services?.length ? data.services : FALLBACK_SERVICES)
        }
      } catch (e) {
        console.error("[ServerStatus] Failed to load system status", e)
        if (!cancelled) {
          setLoadError(true)
          setServices(FALLBACK_SERVICES)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const displayServices = services.length > 0 ? services : FALLBACK_SERVICES

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[88px] shrink-0 items-center border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">서버 상태</h1>
          <p className="text-sm text-[#6B7280]">핵심 서비스 연결 상태</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="rounded-xl border border-[#E5E5E5] bg-white px-8 py-6 md:px-12">
          {loadError && (
            <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
              <p className="text-sm text-[#B91C1C]">
                시스템 상태를 불러오지 못했습니다. 아래는 기본 표시입니다.
              </p>
            </div>
          )}

          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">서비스</h2>
          <div className="flex flex-col gap-3">
            {displayServices.map((service) => {
              const IconComponent = SERVICE_ICONS[service.key] ?? Server
              return (
                <div
                  key={service.key}
                  className="flex items-center justify-between rounded-lg border border-[#E5E5E5] bg-white px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-[#111111]">{service.name}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    {service.key !== "api" && (
                      <span className="text-sm text-[#6B7280]">
                        {formatLatency(service.latencyMs, isLoading)}
                      </span>
                    )}
                    <span className={statusBadgeClass(service.status, isLoading)}>
                      {formatStatusLabel(service.status, isLoading)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
