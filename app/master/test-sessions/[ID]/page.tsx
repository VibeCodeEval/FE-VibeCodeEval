"use client";

import { useRouter, useParams } from "next/navigation";
import TestSessionDetailsContent from "@/components/test-session-details-content";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  // 임시 더미 데이터 (나중에 실제 API 연동 시 여기만 교체)
  const session = {
    id: Number(sessionId),
    sessionId: `SESSION-${sessionId}`,         // ➜ Session ID
    createdBy: "Master Admin",                // ➜ Created By
    createdAt: "2025-12-05 10:00",            // ➜ Created At
    status: "Completed",                      // ➜ Status (Active / Completed 등)
    participants: 48,                         // ➜ Participants
  };

  return (
    <main className="mt-[0px] min-h-[calc(100vh-80px)] overflow-y-auto py-6 px-8">
      <TestSessionDetailsContent
        session={session}
        onBack={() => router.push("/master/test-sessions")}
      />
    </main>
  );
}
