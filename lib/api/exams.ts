// Exam API 호출 함수들

// 클라이언트 컴포넌트에서 환경 변수 접근을 위한 헬퍼 함수
function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  return baseUrl;
}

// Authorization 헤더 가져오기 (사용자 토큰)
function getUserAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// BaseResponse 타입
export interface BaseResponse<T> {
  timestamp: string;
  code: string;
  message: string;
  result: T | null;
}

// 시험 상태 타입 (백엔드 ExamState enum에 맞춤)
export type ExamState = "WAITING" | "RUNNING" | "ENDED";

// 시험 상태 조회 응답 (백엔드 ExamStateResponse 구조에 맞춤)
export interface GetExamStateResponse {
  examId: number;
  state: ExamState;
  startsAt: string; // ISO 8601 형식
  endsAt: string; // ISO 8601 형식
  serverTime: string; // ISO 8601 형식
  version: number;
}

/**
 * 시험 상태 조회 API 호출
 */
export async function getExamState(examId: number): Promise<GetExamStateResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/exams/${examId}/state`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Get Exam State] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getUserAuthHeaders(),
      credentials: 'include',
    });

    if (isDev) {
      console.log('[Get Exam State] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<GetExamStateResponse>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Get Exam State] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      } catch (textError) {
        throw new Error('서버 응답을 읽을 수 없습니다.');
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 상태 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '시험을 찾을 수 없습니다.';
      }

      if (isDev) {
        console.warn('[Get Exam State] 조회 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      const error: any = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    if (isDev) {
      console.log('[Get Exam State] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '시험 상태 조회에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Get Exam State] 응답 데이터 검증 실패:', data);
      }

      throw new Error(errorMessage);
    }

    if (isDev) {
      console.log('[Get Exam State] 조회 성공:', data.result.state);
    }

    return data.result;
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Get Exam State] 네트워크 오류:', error.message);
      }
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Get Exam State] 예상치 못한 오류:', error);
    }
    throw new Error('시험 상태 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

