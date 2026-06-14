import type { ReactNode } from "react"

export type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex h-[88px] min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[#E5E5E5] bg-white px-4 sm:px-6 lg:px-8">
      <div className="min-w-0 flex-1 overflow-hidden">
        <h1 className="truncate text-2xl font-semibold text-[#1A1A1A]">{title}</h1>
        {description ? <p className="truncate text-sm text-[#6B7280]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
