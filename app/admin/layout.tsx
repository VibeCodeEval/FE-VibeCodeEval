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
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* 왼쪽 사이드바 */}
      <AdminSidebar />

      {/* 오른쪽 메인 영역 */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
