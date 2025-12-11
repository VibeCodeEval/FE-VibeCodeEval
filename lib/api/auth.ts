// Auth API 호출 함수들

// 커스텀 에러 클래스
export class AuthError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string = '인증에 실패했습니다.', status?: number, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

export class NetworkError extends Error {
  constructor(message: string = '네트워크 오류가 발생했습니다. 서버에 연결할 수 없습니다.') {
    super(message);
    this.name = 'NetworkError';
  }
}

// 클라이언트 컴포넌트에서 환경 변수 접근을 위한 헬퍼 함수
function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  return baseUrl;
}

// BaseResponse 타입
export interface BaseResponse<T> {
  timestamp: string;
  code: string;
  message: string;
  result: T | null;
}

// EnterExamRequest
export interface EnterExamRequest {
  code: string;    // 입장 코드
  name: string;    // 사용자 이름
  phone: string;   // 전화번호 (010-1234-5678 형식)
}

// EnterExamResponse (백엔드 응답 구조에 맞춤)
export interface ParticipantInfo {
  id: number;
  name: string;
  phone: string;
}

export interface ExamInfoResponse {
  id: number;
  title: string;
  state: string;
  startsAt: string;
  endsAt: string;
}

export interface SessionInfoResponse {
  id: number;
  examId: number;
  participantId: number;
  tokenLimit: number;
  tokenUsed: number;
}

export interface EnterExamResponse {
  accessToken: string;
  role: string;
  participant: ParticipantInfo;
  exam: ExamInfoResponse;
  session: SessionInfoResponse;
}

/**
 * 시험 입장 API 호출
 */
export async function enterExam(request: EnterExamRequest): Promise<EnterExamResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/auth/enter`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Enter Exam] API 호출:', url);
    console.log('[Enter Exam] Request:', { ...request, phone: '***' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (isDev) {
      console.log('[Enter Exam] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<EnterExamResponse>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Enter Exam] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new AuthError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new AuthError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '입장에 실패했습니다. 입력 정보를 다시 확인해주세요.';
      
      if (response.status === 400) {
        errorMessage = data.message || '입장 코드가 올바르지 않거나 만료되었습니다.';
      } else if (response.status === 401) {
        errorMessage = '인증이 필요합니다.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      }

      if (isDev) {
        console.warn('[Enter Exam] 입장 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new AuthError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Enter Exam] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '입장에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Enter Exam] 응답 데이터 검증 실패:', data);
      }

      throw new AuthError(errorMessage);
    }

    if (isDev) {
      console.log('[Enter Exam] 입장 성공:', data.result.participant.id, data.result.exam.id);
    }

    return data.result;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Enter Exam] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Enter Exam] 예상치 못한 오류:', error);
    }
    throw new NetworkError('입장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

