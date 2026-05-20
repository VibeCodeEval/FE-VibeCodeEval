import type { ReactNode } from "react"

export type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">{title}</h1>
        {description ? <p className="text-sm text-[#6B7280]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
