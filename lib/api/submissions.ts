// Submission API 호출 함수들

function getAdminAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
}

function getUserAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
export async function submitCode(examId: number, request: SubmitRequest): Promise<SubmitResponse> {
  const url = `${getApiBaseUrl()}/api/exams/${examId}/submissions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getUserAuthHeaders(),
    body: JSON.stringify(request),
    credentials: 'include',
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
  const url = `${getApiBaseUrl()}/api/submissions/${submissionId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getUserAuthHeaders(),
    credentials: 'include',
  });

  const data: BaseResponse<SubmissionDetailResponse> = await response.json();
  if (!response.ok || data.code !== 'COMMON200' || !data.result) {
    const err: any = new Error(data.message || '제출 내역 조회에 실패했습니다.');
    err.status = response.status;
    throw err;
  }
  return data.result;
}

// ─── SSE 채점 결과 스트리밍 (Admin 전용) ────────────────────────────────────────

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
 * 채점 결과 SSE 스트리밍 구독 (Admin/Master 전용)
 * GET /api/admin/submissions/{submissionId}/stream
 *
 * EventSource는 Authorization 헤더 미지원 → fetch + ReadableStream 사용
 * 반환값: 구독을 취소하는 AbortController의 abort 함수
 */
export function streamScoringResult(
  submissionId: number,
  callbacks: ScoringStreamCallbacks
): () => void {
  const controller = new AbortController();
  const apiBaseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080')
    : 'http://localhost:8080';
  const url = `${apiBaseUrl}/api/admin/submissions/${submissionId}/stream`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;

  async function connect() {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
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
