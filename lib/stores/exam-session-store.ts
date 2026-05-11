import { create } from "zustand";

interface ExamSessionState {
  examId: number | null;
  participantId: number | null;
  tokenLimit: number;
  accessToken: string | null;
  setSession: (examId: number, participantId: number, tokenLimit?: number) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
}

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  examId: null,
  participantId: null,
  tokenLimit: 20000,
  accessToken: null,
  setSession: (examId, participantId, tokenLimit = 20000) => set({ examId, participantId, tokenLimit }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearSession: () => set({ examId: null, participantId: null, tokenLimit: 20000, accessToken: null }),
}));

