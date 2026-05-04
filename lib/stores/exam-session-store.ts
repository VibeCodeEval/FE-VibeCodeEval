import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ExamSessionState {
  examId: number | null;
  participantId: number | null;
  tokenLimit: number;
  accessToken: string | null;
  setSession: (examId: number, participantId: number, tokenLimit?: number) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
}

/** SSR·프리렌더 시 `sessionStorage` 미존재 — no-op 스토리지로 동일 API 유지 */
const noopStorage = (): Storage => {
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear: () => memory.clear(),
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    removeItem: (key: string) => {
      memory.delete(key);
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
};

const sessionStorageOrNoop = (): Storage =>
  typeof window !== "undefined" ? window.sessionStorage : noopStorage();

export const useExamSessionStore = create<ExamSessionState>()(
  persist(
    (set) => ({
      examId: null,
      participantId: null,
      tokenLimit: 20000,
      accessToken: null,
      setSession: (examId, participantId, tokenLimit = 20000) =>
        set({ examId, participantId, tokenLimit }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearSession: () => {
        set({ examId: null, participantId: null, tokenLimit: 20000, accessToken: null });
        try {
          useExamSessionStore.persist.clearStorage();
        } catch {
          /* no-op */
        }
      },
    }),
    {
      name: "vibecode-exam-session",
      storage: createJSONStorage(sessionStorageOrNoop),
      partialize: (state) => ({
        examId: state.examId,
        participantId: state.participantId,
        tokenLimit: state.tokenLimit,
        accessToken: state.accessToken,
      }),
      /** Next SSR과 클라이언트 sessionStorage 복구 시점을 맞추기 위해 수동 rehydrate 사용 */
      skipHydration: true,
    },
  ),
);
