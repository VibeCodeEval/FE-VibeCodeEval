"use client";

import { useRouter } from "next/navigation";
import TestSessionsContent, { TestSession } from "@/components/test-sessions-content";

export default function Page() {
  const router = useRouter();   // ← 여기!

  const handleViewDetails = (session: TestSession) => {
    router.push(`/master/test-sessions/${session.id}`);
  };

  return (
    <TestSessionsContent
      onViewDetails={handleViewDetails}
    />
  );
}
