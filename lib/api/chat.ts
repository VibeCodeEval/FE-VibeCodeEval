// Chat API 호출 함수들

// 커스텀 에러 클래스
export class ChatError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string = '채팅 요청에 실패했습니다.', status?: number, code?: string) {
    super(message);
    this.name = 'ChatError';
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

// SaveChatMessageRequest 타입 (BE-VibeCodeEval SaveChatMessageRequest DTO에 맞춤)
export interface SaveChatMessageRequest {
  sessionId?: number | null;  // 선택
  examId: number;              // 필수
  participantId: number;       // 필수
  turn: number;                // 필수
  role: string;                // 필수 ("user" 또는 "USER")
  content: string;              // 필수
  tokenCount?: number | null; // 선택
  meta?: string | null;        // 선택
}

// SendMessageResponse 타입 (BE-VibeCodeEval SendMessageResponse DTO에 맞춤)
export interface SendMessageResponse {
  sessionId: number;
  turnId: number;
  role: string;
  content: string;
  tokenCount: number | null;  // AI 응답 토큰 수 (completion_tokens)
  totalCount: number | null;  // 전체 토큰 수 (사용자 질문 토큰 + AI 응답 토큰)
}

// UpdateTokenUsageRequest 타입 (BE-VibeCodeEval UpdateTokenUsageRequest DTO에 맞춤)
export interface UpdateTokenUsageRequest {
  examId: number;      // 필수
  participantId: number; // 필수
  tokens: number;      // 필수 (토큰 사용량)
}

/**
 * 채팅 메시지 저장 및 AI 응답 받기 API 호출
 * POST /api/chat/messages
 */
export async function saveChatMessage(request: SaveChatMessageRequest): Promise<SendMessageResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/chat/messages`;
  const isDev = process.env.NODE_ENV === 'development';

  // Swagger 스펙에 맞게 payload 구성
  const payload: {
    sessionId?: number;
    examId: number;
    participantId: number;
    turn: number;
    role: string;
    content: string;
  } = {
    examId: request.examId,
    participantId: request.participantId,
    turn: request.turn,
    role: request.role.toUpperCase(),
    content: request.content,
  };

  // sessionId가 null이 아니고 유효한 값일 때만 포함
  if (request.sessionId !== null && request.sessionId !== undefined) {
    payload.sessionId = request.sessionId;
  }

  if (isDev) {
    console.log('[Save Chat Message] API 호출:', url);
    console.log('[saveChatMessage] request payload:', payload);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getUserAuthHeaders(),
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (isDev) {
      console.log('[Save Chat Message] 응답 상태:', response.status, response.statusText);
    }

    const raw = await response.text();

    if (!response.ok) {
      if (isDev) {
        console.error('[Save Chat Message] 응답 에러:', response.status, raw);
      }
      throw new ChatError('채팅 메시지 저장 및 AI 응답 요청에 실패했습니다.', response.status);
    }

    // JSON 파싱 시도
    let data: BaseResponse<SendMessageResponse> | null = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (jsonError) {
      if (isDev) {
        console.error('[Save Chat Message] JSON 파싱 실패, 원본 텍스트:', raw);
      }
      throw new ChatError('서버 응답을 파싱할 수 없습니다.', response.status);
    }

    if (!data) {
      throw new ChatError('응답 데이터가 비어있습니다.', response.status);
    }

    if (isDev) {
      console.log('[Save Chat Message] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '채팅 메시지 저장에 실패했습니다.';
      if (isDev) {
        console.error('[Save Chat Message] 서비스 에러:', data);
      }
      throw new ChatError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Save Chat Message] 저장 성공:', data.result);
    }

    return data.result;
  } catch (error) {
    if (error instanceof ChatError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.error('[Save Chat Message] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.error('[Save Chat Message] 예상치 못한 오류:', error);
    }
    throw error;
  }
}

/**
 * 토큰 사용량 업데이트 API 호출
 * POST /api/chat/tokens/update
 */
export async function updateTokenUsage(request: UpdateTokenUsageRequest): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/chat/tokens/update`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Update Token Usage] API 호출:', url);
    console.log('[Update Token Usage] Request:', request);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getUserAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'include',
    });

    if (isDev) {
      console.log('[Update Token Usage] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<null>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Update Token Usage] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new ChatError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new ChatError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '토큰 사용량 업데이트에 실패했습니다.';
      
      if (response.status === 400) {
        errorMessage = data.message || '잘못된 요청입니다.';
      } else if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '시험 또는 참가자를 찾을 수 없습니다.';
      }

      if (isDev) {
        console.warn('[Update Token Usage] 업데이트 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new ChatError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Update Token Usage] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '토큰 사용량 업데이트에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Update Token Usage] 응답 데이터 검증 실패:', data);
      }

      throw new ChatError(errorMessage);
    }

    if (isDev) {
      console.log('[Update Token Usage] 업데이트 성공');
    }
  } catch (error) {
    if (error instanceof ChatError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Update Token Usage] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Update Token Usage] 예상치 못한 오류:', error);
    }
    throw new NetworkError('토큰 사용량 업데이트 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

// ─── 채팅 히스토리 ─────────────────────────────────────────────────────────────

export interface ChatHistoryMessage {
  id: number;
  turn: number;
  role: string;
  content: string;
  tokenCount: number | null;
}

export interface ChatHistoryResponse {
  sessionId: number;
  examId: number;
  participantId: number;
  totalTokens: number;
  messages: ChatHistoryMessage[];
}

/**
 * 채팅 히스토리 조회 API 호출
 * GET /api/chat/history?examId={}&participantId={}
 */
export async function getChatHistory(
  examId: number,
  participantId: number
): Promise<ChatHistoryResponse | null> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/chat/history?examId=${examId}&participantId=${participantId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getUserAuthHeaders(),
      credentials: 'include',
    });

    if (response.status === 404) {
      return null; // 히스토리 없음
    }

    const data: BaseResponse<ChatHistoryResponse> = await response.json();
    if (!response.ok || data.code !== 'COMMON200') {
      throw new ChatError(data.message || '채팅 히스토리 조회에 실패했습니다.', response.status);
    }
    return data.result;
  } catch (error) {
    if (error instanceof ChatError) throw error;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw error;
  }
}
