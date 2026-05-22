import { create } from "zustand";

interface ExamSessionState {
  examId: number | null;
  /** users.id — 채팅 STOMP·JWT·assignment/draft와 동일 */
  participantId: number | null;
  /** exam_participants.id (PK) */
  examParticipantId: number | null;
  tokenLimit: number;
  accessToken: string | null;
  setSession: (examId: number, participantId: number, tokenLimit?: number) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
}

export const useExamSessionStore = create<ExamSessionState>((set) => ({
  examId: null,
  participantId: null,
  examParticipantId: null,
  tokenLimit: 20000,
  accessToken: null,
  setSession: (examId, participantId, tokenLimit = 20000) => set({ examId, participantId, tokenLimit }),
  setAccessToken: (token) => set({ accessToken: token }),
  clearSession: () =>
    set({
      examId: null,
      participantId: null,
      examParticipantId: null,
      tokenLimit: 20000,
      accessToken: null,
    }),
}));
