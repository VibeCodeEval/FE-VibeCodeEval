/**
 * 응시자(일반 사용자) API용 공통 fetch.
 * HttpOnly Cookie 인증 — Authorization 헤더 대신 항상 credentials: "include" 로 쿠키 전송.
 */

export function getUserApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
}

export const USER_JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
};

function resolveUrl(pathOrAbsolute: string): string {
  if (pathOrAbsolute.startsWith('http://') || pathOrAbsolute.startsWith('https://')) {
    return pathOrAbsolute;
  }
  const base = getUserApiBaseUrl().replace(/\/$/, '');
  const path = pathOrAbsolute.startsWith('/') ? pathOrAbsolute : `/${pathOrAbsolute}`;
  return `${base}${path}`;
}

/**
 * 사용자 세션 쿠키를 반드시 실어 보내는 fetch.
 * 호출부에서 credentials 를 덮어써도 최종적으로 include 가 적용된다.
 */
export async function userApiFetch(pathOrAbsolute: string, init: RequestInit = {}): Promise<Response> {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available');
  }
  const url = resolveUrl(pathOrAbsolute);
  return fetch(url, {
    ...init,
    credentials: 'include',
  });
}
