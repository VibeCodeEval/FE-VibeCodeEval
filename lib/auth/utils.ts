// 인증 관련 유틸리티 함수들
import { setCookie, getCookie, removeCookie } from './cookie-utils';

// 마스터 관리자 번호 상수
export const MASTER_ADMIN_NUMBER = "MASTER-0001";
export const SYSTEM_MASTER_ADMIN_NUMBER = "MASTER-0001";

/**
 * 마스터 관리자인지 확인
 * @param data 관리자 정보 (adminNumber, role 등)
 * @returns 마스터 관리자이면 true
 */
export function isMasterAdmin(data: {
  adminNumber?: string;
  role?: string | string[];
}): boolean {
  // 현재는 adminNumber로 판별 (나중에 role도 추가 가능)
  if (data.adminNumber === MASTER_ADMIN_NUMBER) {
    return true;
  }
  
  // 나중에 백엔드에서 role이 제대로 설정되면 아래 주석을 해제하여 사용
  // if (data.role === "MASTER" || data.role === "ROLE_MASTER") {
  //   return true;
  // }
  
  return false;
}

/**
 * 시스템 마스터 관리자인지 확인
 * @param admin 관리자 정보
 * @returns 시스템 마스터이면 true
 */
export function isSystemMasterAdmin(admin: { adminNumber?: string | null }): boolean {
  return admin.adminNumber === SYSTEM_MASTER_ADMIN_NUMBER;
}

/**
 * 인증 정보를 쿠키에 저장
 */
export function saveAuthInfo(
  accessToken: string,
  adminNumber: string,
  role?: string,
  email?: string
): void {
  setCookie('admin_access_token', accessToken);
  setCookie('admin_number', adminNumber);
  if (role) {
    setCookie('admin_role', role);
  }
  if (email) {
    setCookie('admin_email', email);
  }
}

/**
 * 쿠키에서 인증 정보 가져오기
 */
export function getAuthInfo(): {
  accessToken: string | null;
  adminNumber: string | null;
  role: string | null;
  email: string | null;
} {
  return {
    accessToken: getCookie('admin_access_token'),
    adminNumber: getCookie('admin_number'),
    role: getCookie('admin_role'),
    email: getCookie('admin_email'),
  };
}

/**
 * 쿠키에서 인증 정보 삭제
 */
export function clearAuthInfo(): void {
  removeCookie('admin_access_token');
  removeCookie('admin_number');
  removeCookie('admin_role');
  removeCookie('admin_email');
}

/**
 * 현재 로그인한 사용자가 마스터인지 확인
 */
export function isCurrentUserMaster(): boolean {
  const authInfo = getAuthInfo();
  return isMasterAdmin({
    adminNumber: authInfo.adminNumber || undefined,
    role: authInfo.role || undefined,
  });
}

