// Admin API 호출 함수들

// 커스텀 에러 클래스: 로그인 실패와 네트워크 에러를 구분
export class LoginFailedError extends Error {
  status?: number;
  code?: string;
  
  constructor(message: string = '아이디 또는 비밀번호가 일치하지 않습니다.', status?: number, code?: string) {
    super(message);
    this.name = 'LoginFailedError';
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

// Authorization 헤더 가져오기
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
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

// AdminLoginRequest
export interface AdminLoginRequest {
  identifier: string;
  password: string;
}

// AdminLoginResponse
export interface AdminLoginResponse {
  accessToken: string;
  role: string;
  admin?: {
    id: number;
    adminNumber: string;
    email: string;
  };
}

// AdminInfo (AdminListResponse에서 사용)
export interface AdminInfo {
  id: number;
  adminNumber: string;
  email: string;
  role: 'ADMIN' | 'MASTER';
  is2faEnabled: boolean;
}

// AdminListResponse
export interface AdminListResponse {
  admins: AdminInfo[];
}

// AdminNumberIssueRequest
export interface AdminNumberIssueRequest {
  label?: string;
  expiresAt?: string; // ISO 8601 형식: "2026-01-31T23:59:59"
}

// AdminNumberUpdateRequest
export interface AdminNumberUpdateRequest {
  label?: string;
  active?: boolean;
  expiresAt?: string | null; // ISO 8601 형식: "2026-01-31T23:59:59"
}

// AdminNumberResponse
export interface AdminNumberResponse {
  adminNumber: string;
  label?: string | null;
  active: boolean;
  issuedBy: number;
  assignedAdminId?: number | null;
  expiresAt?: string | null; // ISO 8601 형식
  usedAt?: string | null; // ISO 8601 형식
  createdAt: string; // ISO 8601 형식
}

/**
 * 관리자 로그인 API 호출
 */
export async function adminLogin(request: AdminLoginRequest): Promise<AdminLoginResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/auth/admin/login`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Admin Login] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Admin Login] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
      let errorCode: string | undefined;

      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            if (errorData.code) {
              errorCode = errorData.code;
            }
          } catch {
            // JSON 파싱 실패 시 원본 텍스트 사용
          }
        }
      } catch {
        // 에러 응답 읽기 실패 시 기본 메시지 사용
      }

      throw new LoginFailedError(errorMessage, response.status, errorCode);
    }

    const data: BaseResponse<AdminLoginResponse> = await response.json();

    if (data.code !== 'COMMON200' || !data.result) {
      throw new LoginFailedError(data.message || '로그인에 실패했습니다.', response.status, data.code);
    }

    if (isDev) {
      console.log('[Admin Login] 로그인 성공');
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Admin Login] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Admin Login] 예상치 못한 오류:', error);
    }
    throw new NetworkError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 모든 관리자 조회 API 호출 (마스터 전용)
 */
export async function getAllAdmins(): Promise<AdminListResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/admin-numbers/admins`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Get All Admins] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Get All Admins] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '관리자 목록 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '마스터 계정만 관리자 목록을 조회할 수 있습니다.';
      }
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
        }
      } catch {
        // 에러 응답 읽기 실패 시 기본 메시지 사용
      }

      if (isDev) {
        console.warn('[Get All Admins] 조회 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<AdminListResponse> = await response.json();

    if (isDev) {
      console.log('[Get All Admins] 응답 데이터:', { code: data.code, hasResult: !!data.result, adminCount: data.result?.admins?.length });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '관리자 목록 조회에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Get All Admins] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Get All Admins] 조회 성공:', data.result.admins.length, '명');
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Get All Admins] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Get All Admins] 예상치 못한 오류:', error);
    }
    throw new NetworkError('관리자 목록 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 관리자 번호 상태 변경 API 호출 (마스터 전용)
 * 관리자 번호의 라벨, 만료일, 활성 상태를 변경합니다. 관리자 번호 값 자체는 변경되지 않습니다.
 * @param adminNumber 관리자 번호
 * @param request 상태 변경 요청 정보 (label, active, expiresAt)
 * @returns 업데이트된 관리자 번호 정보
 */
export async function updateAdminNumber(
  adminNumber: string,
  request: AdminNumberUpdateRequest
): Promise<AdminNumberResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/admin-numbers/${encodeURIComponent(adminNumber)}`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Update Admin Number] API 호출:', url);
    console.log('[Update Admin Number] Request:', request);
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Update Admin Number] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '관리자 번호 상태 변경에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '마스터 계정만 관리자 번호 상태를 변경할 수 있습니다.';
      }
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            if (errorData.code) {
              // AUTH021: 마스터 계정은 비활성화할 수 없습니다
              if (errorData.code === 'AUTH021') {
                errorMessage = '마스터 관리자 계정은 비활성화할 수 없습니다.';
              }
            }
          } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
        }
      } catch {
        // 에러 응답 읽기 실패 시 기본 메시지 사용
      }

      if (isDev) {
        console.warn('[Update Admin Number] 상태 변경 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<AdminNumberResponse> = await response.json();

    if (isDev) {
      console.log('[Update Admin Number] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '관리자 번호 상태 변경에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Update Admin Number] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Update Admin Number] 상태 변경 성공:', data.result.adminNumber, 'active:', data.result.active);
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Update Admin Number] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Update Admin Number] 예상치 못한 오류:', error);
    }
    throw new NetworkError('관리자 번호 상태 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 관리자 번호 발급 API 호출 (마스터 전용)
 */
export async function issueAdminNumber(request: AdminNumberIssueRequest): Promise<AdminNumberResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/admin-numbers`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Issue Admin Number] API 호출:', url);
    console.log('[Issue Admin Number] Request:', request);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Issue Admin Number] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '관리자 번호 발급에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '마스터 계정만 관리자 번호를 발급할 수 있습니다.';
      }
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
        }
      } catch {
        // 에러 응답 읽기 실패 시 기본 메시지 사용
      }

      if (isDev) {
        console.warn('[Issue Admin Number] 발급 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<AdminNumberResponse> = await response.json();

    if (isDev) {
      console.log('[Issue Admin Number] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '관리자 번호 발급에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Issue Admin Number] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Issue Admin Number] 발급 성공:', data.result.adminNumber);
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Issue Admin Number] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Issue Admin Number] 예상치 못한 오류:', error);
    }
    throw new NetworkError('관리자 번호 발급 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

