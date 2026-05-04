"use client";

import UserTestScreen from "@/components/user-test-screen"
import { ExamSessionPersistGate } from "@/components/exam-session-persist-gate"

export default function TestPage() {
  return (
    <ExamSessionPersistGate>
      <UserTestScreen />
    </ExamSessionPersistGate>
  )
}
