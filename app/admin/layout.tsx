// ai-vibe-login-ui/app/admin/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin-sidebar";

// Admin 영역 메타데이터 (선택)
export const metadata: Metadata = {
  title: "AI Vibe Coding Test - Admin",
  description: "Admin dashboard for AI Vibe Coding Test",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ maxWidth: "1920px" }}>
      {/* 왼쪽 고정 사이드바 */}
      <div className="fixed left-0 top-0 h-screen z-30" style={{ width: "240px" }}>
        <AdminSidebar />
      </div>

      {/* 오른쪽 메인 영역 */}
      <div className="flex-1 flex flex-col h-screen ml-[240px]" style={{ backgroundColor: "#F9FAFB" }}>
        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
