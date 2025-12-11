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

// AdminSignupRequest
export interface AdminSignupRequest {
  adminNumber: string;
  email: string;
  password: string;
}

// MeResponse (내 정보 조회 응답)
export interface MeResponse {
  role: string;
  participant: {
    id: number;
    name: string; // ADMIN의 경우 adminNumber가 들어감
    phone: string; // ADMIN의 경우 email이 들어감
  };
  exam?: null;
  session?: null;
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

// AdminNumberDto (AdminNumberResponse와 동일)
export type AdminNumberDto = AdminNumberResponse;

// ChangeAdminPasswordRequest
export interface ChangeAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
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

/**
 * 관리자 회원가입 API 호출
 */
export async function signUpAdmin(request: AdminSignupRequest): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/auth/admin/signup`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Admin Signup] API 호출:', url);
    console.log('[Admin Signup] Request:', { ...request, password: '***' });
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
      console.log('[Admin Signup] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (response.status === 400) {
        errorMessage = '입력한 정보가 올바르지 않습니다. 관리자 번호, 이메일, 비밀번호를 확인해주세요.';
      } else if (response.status === 409) {
        errorMessage = '이미 사용 중인 관리자 번호 또는 이메일입니다.';
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
        console.warn('[Admin Signup] 회원가입 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<null> = await response.json();

    if (isDev) {
      console.log('[Admin Signup] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '회원가입에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Admin Signup] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Admin Signup] 회원가입 성공');
    }
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Admin Signup] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Admin Signup] 예상치 못한 오류:', error);
    }
    throw new NetworkError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 관리자 로그아웃 API 호출
 * 로그아웃은 idempotent하므로, API 호출이 실패해도 프론트엔드 세션은 정리됩니다.
 */
export async function logoutAdmin(): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/auth/admin/logout`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Admin Logout] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Admin Logout] 응답 상태:', response.status, response.statusText);
    }

    // 로그아웃은 idempotent하므로, 401(인증 실패) 등이어도 성공으로 처리
    if (!response.ok && response.status !== 401) {
      // 401이 아닌 다른 오류만 로그 (토큰이 이미 만료되었을 수 있으므로)
      if (isDev) {
        console.warn('[Admin Logout] 로그아웃 API 호출 실패:', response.status);
      }
    } else {
      if (isDev) {
        console.log('[Admin Logout] 로그아웃 성공');
      }
    }
  } catch (error) {
    // 네트워크 오류 등이어도 로그아웃은 진행 (idempotent)
    if (isDev) {
      console.warn('[Admin Logout] 네트워크 오류 또는 예상치 못한 오류:', error);
    }
  } finally {
    // 항상 프론트엔드 세션 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
    }
  }
}

/**
 * 내 정보 조회 API 호출 (현재 로그인한 관리자 정보)
 */
export async function getMe(): Promise<MeResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/auth/me`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Get Me] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Get Me] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '내 정보 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
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
        console.warn('[Get Me] 조회 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<MeResponse> = await response.json();

    if (isDev) {
      console.log('[Get Me] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '내 정보 조회에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Get Me] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Get Me] 조회 성공:', data.result.role, data.result.participant);
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Get Me] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Get Me] 예상치 못한 오류:', error);
    }
    throw new NetworkError('내 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 관리자 비밀번호 변경 API 호출
 */
export async function changeAdminPassword(request: ChangeAdminPasswordRequest): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/account/password`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Change Admin Password] API 호출:', url);
    console.log('[Change Admin Password] Request:', { ...request, currentPassword: '***', newPassword: '***' });
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Change Admin Password] 응답 상태:', response.status, response.statusText);
    }

    if (!response.ok) {
      let errorMessage = '비밀번호 변경에 실패했습니다.';
      
      if (response.status === 400) {
        errorMessage = '입력한 정보가 올바르지 않습니다. 현재 비밀번호와 새 비밀번호를 확인해주세요.';
      } else if (response.status === 401) {
        errorMessage = '현재 비밀번호가 일치하지 않습니다.';
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
        console.warn('[Change Admin Password] 변경 실패:', {
          status: response.status,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status);
    }

    const data: BaseResponse<null> = await response.json();

    if (isDev) {
      console.log('[Change Admin Password] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '비밀번호 변경에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Change Admin Password] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Change Admin Password] 변경 성공');
    }
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Change Admin Password] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Change Admin Password] 예상치 못한 오류:', error);
    }
    throw new NetworkError('비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 관리자 번호의 active 상태를 토글하는 함수
 * @param admin 관리자 번호 정보 (AdminNumberDto)
 * @returns 업데이트된 관리자 번호 정보
 */
export async function toggleAdminNumberActive(admin: AdminNumberDto): Promise<AdminNumberDto> {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Toggle Admin Number Active] 상태 토글:', admin.adminNumber, '현재 active:', admin.active);
  }

  // active 값을 반전
  const newActiveStatus = !admin.active;

  // updateAdminNumber를 호출하여 상태 변경
  const updated = await updateAdminNumber(admin.adminNumber, {
    label: admin.label ?? undefined,
    active: newActiveStatus,
    expiresAt: admin.expiresAt,
  });

  if (isDev) {
    console.log('[Toggle Admin Number Active] 상태 토글 완료:', updated.adminNumber, '새로운 active:', updated.active);
  }

  return updated;
}

// Exam 관련 타입 정의
export interface CreateExamRequest {
  title: string;
  startsAt: string; // ISO 8601 형식: "YYYY-MM-DDTHH:mm:ss"
  endsAt: string;   // ISO 8601 형식: "YYYY-MM-DDTHH:mm:ss"
}

export interface Exam {
  id: number;
  title: string;
  state: string; // "WAITING" | "IN_PROGRESS" | "ENDED" 등
  startsAt: string; // ISO 8601 형식
  endsAt: string;   // ISO 8601 형식
  version: number;
  createdBy: number;
  entryCode?: string; // 입장 코드 (선택적)
}

// Entry Code 관련 타입 정의
export interface CreateEntryCodeRequest {
  label?: string;
  examId: number;
  problemSetId?: number;
  expiresAt?: string; // ISO 8601 형식
  maxUses?: number;
}

export interface EntryCodeResponse {
  code: string;
  label?: string | null;
  examId: number;
  problemSetId?: number | null;
  expiresAt?: string | null; // ISO 8601 형식
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string; // ISO 8601 형식
}

/**
 * 시험 생성 API 호출
 */
export async function createExam(request: CreateExamRequest): Promise<Exam> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/exams`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Create Exam] API 호출:', url);
    console.log('[Create Exam] Request:', request);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Create Exam] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<Exam>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Create Exam] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 생성에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 400) {
        errorMessage = data.message || '입력한 정보가 올바르지 않습니다.';
      }

      if (isDev) {
        console.warn('[Create Exam] 생성 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Create Exam] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '시험 생성에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Create Exam] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Create Exam] 생성 성공:', data.result);
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Create Exam] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Create Exam] 예상치 못한 오류:', error);
    }
    throw new NetworkError('시험 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 시험 목록 조회 API 호출
 */
export async function getExams(): Promise<Exam[]> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/exams`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Get Exams] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Get Exams] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<Exam[]>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Get Exams] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 목록 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      }

      if (isDev) {
        console.warn('[Get Exams] 조회 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Get Exams] 응답 데이터:', { code: data.code, hasResult: !!data.result, examCount: data.result?.length });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '시험 목록 조회에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Get Exams] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Get Exams] 조회 성공:', data.result.length, '개');
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Get Exams] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Get Exams] 예상치 못한 오류:', error);
    }
    throw new NetworkError('시험 목록 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 입장 코드 생성 API 호출
 */
export async function createEntryCode(request: CreateEntryCodeRequest): Promise<EntryCodeResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/entry-codes`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Create Entry Code] API 호출:', url);
    console.log('[Create Entry Code] Request:', request);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Create Entry Code] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<EntryCodeResponse>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Create Entry Code] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '입장 코드 생성에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 400) {
        errorMessage = data.message || '입력한 정보가 올바르지 않습니다.';
      }

      if (isDev) {
        console.warn('[Create Entry Code] 생성 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Create Entry Code] 응답 데이터:', { code: data.code, hasResult: !!data.result });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      const errorMessage = data.message || '입장 코드 생성에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Create Entry Code] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Create Entry Code] 생성 성공:', data.result.code);
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Create Entry Code] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Create Entry Code] 예상치 못한 오류:', error);
    }
    throw new NetworkError('입장 코드 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 시험 삭제 API 호출
 */
export async function deleteExam(examId: number): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/exams/${examId}`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Delete Exam] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Delete Exam] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<null>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Delete Exam] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 삭제에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '시험을 찾을 수 없습니다.';
      }

      if (isDev) {
        console.warn('[Delete Exam] 삭제 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Delete Exam] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '시험 삭제에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Delete Exam] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Delete Exam] 삭제 성공');
    }
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Delete Exam] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Delete Exam] 예상치 못한 오류:', error);
    }
    throw new NetworkError('시험 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 시험 시작 API 호출
 */
export async function startExam(examId: number): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/exams/${examId}/start`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Start Exam] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Start Exam] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<null>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Start Exam] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 시작에 실패했습니다.';
      
      if (response.status === 400) {
        errorMessage = data.message || '시험을 시작할 수 없습니다. (이미 시작된 시험일 수 있습니다.)';
      } else if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '시험을 찾을 수 없습니다.';
      }

      if (isDev) {
        console.warn('[Start Exam] 시작 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Start Exam] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '시험 시작에 실패했습니다.';
      
      if (isDev) {
        console.warn('[Start Exam] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[Start Exam] 시작 성공');
    }
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Start Exam] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Start Exam] 예상치 못한 오류:', error);
    }
    throw new NetworkError('시험 시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 시험 종료 API 호출
 */
export async function endExam(examId: number): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/admin/exams/${examId}/end`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[End Exam] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[End Exam] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<null>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[End Exam] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '시험 종료에 실패했습니다.';
      
      if (response.status === 400) {
        errorMessage = data.message || '시험을 종료할 수 없습니다. (이미 종료된 시험일 수 있습니다.)';
      } else if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '시험을 찾을 수 없습니다.';
      }

      if (isDev) {
        console.warn('[End Exam] 종료 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[End Exam] 응답 데이터:', { code: data.code });
    }

    if (data.code !== 'COMMON200') {
      const errorMessage = data.message || '시험 종료에 실패했습니다.';
      
      if (isDev) {
        console.warn('[End Exam] 응답 데이터 검증 실패:', data);
      }

      throw new LoginFailedError(errorMessage);
    }

    if (isDev) {
      console.log('[End Exam] 종료 성공');
    }
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[End Exam] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[End Exam] 예상치 못한 오류:', error);
    }
    throw new NetworkError('시험 종료 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * 입장 코드 목록 조회 API 호출
 * @param examId 시험 ID
 * @param isActive 활성 상태 필터 (선택적)
 * @returns 입장 코드 목록
 */
export async function getEntryCodes(examId: number, isActive?: boolean): Promise<EntryCodeResponse[]> {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ examId: examId.toString() });
  if (isActive !== undefined) {
    params.append('isActive', isActive.toString());
  }
  const url = `${apiBaseUrl}/api/admin/entry-codes?${params.toString()}`;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('[Get Entry Codes] API 호출:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'omit',
    });

    if (isDev) {
      console.log('[Get Entry Codes] 응답 상태:', response.status, response.statusText);
    }

    let data: BaseResponse<EntryCodeResponse[]>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // JSON 파싱 실패 시 텍스트로 읽기 시도
      try {
        const errorText = await response.text();
        if (isDev) {
          console.warn('[Get Entry Codes] JSON 파싱 실패, 텍스트 응답:', errorText);
        }
        throw new LoginFailedError('서버 응답을 파싱할 수 없습니다.', response.status);
      } catch (textError) {
        throw new LoginFailedError('서버 응답을 읽을 수 없습니다.', response.status);
      }
    }

    if (!response.ok) {
      let errorMessage = data.message || '입장 코드 목록 조회에 실패했습니다.';
      
      if (response.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (response.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (response.status === 404) {
        // 404는 입장 코드가 없는 경우로 처리 (빈 배열 반환)
        return [];
      }

      if (isDev) {
        console.warn('[Get Entry Codes] 조회 실패:', {
          status: response.status,
          code: data.code,
          message: errorMessage,
        });
      }

      throw new LoginFailedError(errorMessage, response.status, data.code);
    }

    if (isDev) {
      console.log('[Get Entry Codes] 응답 데이터:', { code: data.code, hasResult: !!data.result, entryCodeCount: data.result?.length });
    }

    if (data.code !== 'COMMON200' || !data.result) {
      // 결과가 없으면 빈 배열 반환
      return [];
    }

    if (isDev) {
      console.log('[Get Entry Codes] 조회 성공:', data.result.length, '개');
    }

    return data.result;
  } catch (error) {
    if (error instanceof LoginFailedError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (isDev) {
        console.warn('[Get Entry Codes] 네트워크 오류:', error.message);
      }
      throw new NetworkError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }

    if (isDev) {
      console.warn('[Get Entry Codes] 예상치 못한 오류:', error);
    }
    throw new NetworkError('입장 코드 목록 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
}

