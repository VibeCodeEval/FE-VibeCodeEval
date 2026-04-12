import { create } from "zustand";

interface ExamSessionState {
  examId: number | null;
  participantId: number | null;
  tokenLimit: number;
  setSession: (examId: number, participantId: number, tokenLimit?: number) => void;
  clearSession: () => void;
}

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  examId: null,
  participantId: null,
  tokenLimit: 20000,
  setSession: (examId, participantId, tokenLimit = 20000) => set({ examId, participantId, tokenLimit }),
  clearSession: () => set({ examId: null, participantId: null, tokenLimit: 20000 }),
}));

