/**
 * 토큰 쿠키 관리 유틸리티
 *
 * localStorage 대신 쿠키를 사용합니다.
 * - Secure: HTTPS 환경에서만 전송
 * - SameSite=Strict: CSRF 방지
 *
 * 주의: 완전한 XSS 보호를 위해서는 백엔드에서 HttpOnly 쿠키로 직접 Set-Cookie 해야 합니다.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// 쿠키 만료 기간 (7일)
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function buildCookieString(name: string, value: string): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
  if (IS_PRODUCTION) {
    cookie += '; Secure';
  }
  return cookie;
}

export function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(name, value);
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const key = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    if (cookie.startsWith(key)) {
      return decodeURIComponent(cookie.slice(key.length));
    }
  }
  return null;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Strict`;
}
