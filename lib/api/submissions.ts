// Submission API 호출 함수들 (HttpOnly 쿠키 — lib/api/user-client.ts)

import { USER_JSON_HEADERS, userApiFetch } from '@/lib/api/user-client';

export interface BaseResponse<T> {
  timestamp: string;
  code: string;
  message: string;
  result: T | null;
}

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | 'PENDING'
  | 'JUDGING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILE_ERROR'
  | 'SYSTEM_ERROR';

export interface SubmitRequest {
  lang: string;  // "python" | "java" | "cpp" | "javascript"
  code: string;
}

export interface SubmitResponse {
  submissionId: number;
  status: SubmissionStatus;
}

export interface CodeDraftResponse {
  language: string;
  codeInline: string;
  savedAt?: string | null;
}

export interface SubmissionDetailResponse {
  id: number;
  status: SubmissionStatus;
  lang: string;
  metrics: {
    timeMsMedian: number | null;
    memKbPeak: number | null;
    loc: number | null;
  } | null;
  tc: {
    passRateWeighted: number | null;
    groups: Array<{
      name: string;
      pass: number;
      total: number;
      weight: number;
    }>;
  } | null;
  score: {
    prompt: number | null;
    perf: number | null;
    correctness: number | null;
    total: number | null;
  } | null;
}

// ─── API 함수 ────────────────────────────────────────────────────────────────

/**
 * 코드 제출 API 호출
 * POST /api/exams/{examId}/submissions
 * HTTP 202 Accepted 반환 (비동기 채점)
 */
/**
 * 코드 초안 조회
 * GET /api/exams/{examId}/code-draft
 * draft 없음 또는 이미 제출된 경우 result=null
 */
export async function getCodeDraft(examId: number): Promise<CodeDraftResponse | null> {
  const response = await userApiFetch(`/api/exams/${examId}/code-draft`, {
    method: 'GET',
    credentials: 'include',
    headers: USER_JSON_HEADERS,
  });

  if (!response.ok) {
    return null;
  }

  const data: BaseResponse<CodeDraftResponse> = await response.json().catch(() => ({
    timestamp: '',
    code: '',
    message: '',
    result: null,
  }));

  return data.result ?? null;
}

/**
 * 코드 초안 저장 (자동 제출용 스냅샷)
 * PUT /api/exams/{examId}/code-draft
 */
export async function saveCodeDraft(examId: number, request: SubmitRequest): Promise<void> {
  const response = await userApiFetch(`/api/exams/${examId}/code-draft`, {
    method: 'PUT',
    credentials: 'include',
    headers: USER_JSON_HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}));
    const err: any = new Error((data as any).message || '코드 저장에 실패했습니다.');
    err.status = response.status;
    throw err;
  }
}

export async function submitCode(examId: number, request: SubmitRequest): Promise<SubmitResponse> {
  const response = await userApiFetch(`/api/exams/${examId}/submissions`, {
    method: 'POST',
    credentials: 'include',
    headers: USER_JSON_HEADERS,
    body: JSON.stringify(request),
  });

  // 202 Accepted도 성공으로 처리
  if (!response.ok && response.status !== 202) {
    const data = await response.json().catch(() => ({}));
    const err: any = new Error((data as any).message || '코드 제출에 실패했습니다.');
    err.status = response.status;
    throw err;
  }

  const data: BaseResponse<SubmitResponse> = await response.json();
  if (!data.result) {
    throw new Error('제출 응답 데이터가 없습니다.');
  }
  return data.result;
}

/**
 * 제출 상세 조회 API 호출
 * GET /api/submissions/{submissionId}
 */
export async function getSubmission(submissionId: number): Promise<SubmissionDetailResponse> {
  const response = await userApiFetch(`/api/submissions/${submissionId}`, {
    method: 'GET',
    credentials: 'include',
    headers: USER_JSON_HEADERS,
  });

  const data: BaseResponse<SubmissionDetailResponse> = await response.json();
  if (!response.ok || data.code !== 'COMMON200' || !data.result) {
    const err: any = new Error(data.message || '제출 내역 조회에 실패했습니다.');
    err.status = response.status;
    throw err;
  }
  return data.result;
}

// ─── SSE 채점 결과 스트리밍 (응시자: 본인 제출만) ─────────────────────────────

export interface CaseResultEvent {
  testCaseId: number;
  pass: boolean;
  timeMs: number | null;
  memKb: number | null;
}

export interface FinalScoreEvent {
  submissionId: number;
  status: SubmissionStatus;
  score: {
    prompt: number | null;
    perf: number | null;
    correctness: number | null;
    total: number | null;
  } | null;
  tc: {
    passRateWeighted: number | null;
    groups: Array<{ name: string; pass: number; total: number; weight: number }>;
  } | null;
  metrics: {
    timeMsMedian: number | null;
    memKbPeak: number | null;
    loc: number | null;
  } | null;
}

export interface ScoringStreamCallbacks {
  onCaseResult?: (event: CaseResultEvent) => void;
  onFinalScore?: (event: FinalScoreEvent) => void;
  onError?: (err: Error) => void;
  onComplete?: () => void;
}

/**
 * 채점 결과 SSE 스트리밍 구독 (로그인 응시자, 해당 submission 소유자만)
 * GET /api/submissions/{submissionId}/stream
 *
 * EventSource는 Authorization 헤더 미지원 → fetch + ReadableStream 사용
 * 반환값: 구독을 취소하는 AbortController의 abort 함수
 */
export function streamScoringResult(
  submissionId: number,
  callbacks: ScoringStreamCallbacks
): () => void {
  const controller = new AbortController();

  async function connect() {
    try {
      const response = await userApiFetch(`/api/submissions/${submissionId}/stream`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        callbacks.onError?.(new Error(`SSE 연결 실패: ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let eventName = '';
        let dataLine = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLine = line.slice(5).trim();
          } else if (line === '') {
            // 이벤트 블록 종료
            if (eventName && dataLine) {
              try {
                const parsed = JSON.parse(dataLine);
                if (eventName === 'case_result') {
                  callbacks.onCaseResult?.(parsed as CaseResultEvent);
                } else if (eventName === 'final_score') {
                  callbacks.onFinalScore?.(parsed as FinalScoreEvent);
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
            eventName = '';
            dataLine = '';
          }
        }
      }

      callbacks.onComplete?.();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // 정상 취소
      callbacks.onError?.(err instanceof Error ? err : new Error('SSE 스트림 오류'));
    }
  }

  connect();
  return () => controller.abort();
}
