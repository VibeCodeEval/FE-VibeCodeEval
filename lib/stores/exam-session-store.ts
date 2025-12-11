import { create } from "zustand";

interface ExamSessionState {
  examId: number | null;
  participantId: number | null;
  setSession: (examId: number, participantId: number) => void;
  clearSession: () => void;
}

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  examId: null,
  participantId: null,
  setSession: (examId, participantId) => set({ examId, participantId }),
  clearSession: () => set({ examId: null, participantId: null }),
}));

