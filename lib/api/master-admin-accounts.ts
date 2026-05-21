/**
 * Master 관리자 계정 관리 API (/master/admin-accounts)
 */

import {
  getAllAdmins,
  issueAdminNumber,
  updateAdminNumber,
  resetAdminPasswordByMaster,
  resolveAdminAccountDisplayName,
  LoginFailedError,
  NetworkError,
  type AdminInfo,
  type AdminListResponse,
  type AdminNumberIssueRequest,
  type AdminNumberResponse,
} from '@/lib/api/admin';
import { formatSessionDateTime } from '@/lib/master-test-sessions';

export { LoginFailedError, NetworkError };

/** API 원본 관리자 정보 (GET /api/admin/admin-numbers/admins) */
export type MasterAdminApiRecord = AdminInfo & {
  isActive?: boolean;
  createdAt?: string | null;
  adminNumberIssuedAt?: string | null;
  lastLoginAt?: string | null;
};

/** 화면 표시용 관리자 계정 */
export type MasterAdminAccount = {
  id: number;
  adminNumber: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'MASTER';
  is2faEnabled: boolean;
  isActive: boolean;
  status: '활성화' | '비활성화';
  lastLogin: string | null;
  /** 정렬용 — lastLoginAt ISO의 getTime(), 없거나 invalid면 null */
  lastLoginSortKey: number | null;
  /** UI 표시용 (locale 포맷) */
  createdAt: string | null;
  /** 정렬용 — 원본 ISO의 getTime(), 없거나 invalid면 null */
  createdAtSortKey: number | null;
  passwordStatus: string;
};

export type MasterAdminAccountsListResult = {
  admins: MasterAdminAccount[];
};

function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapActiveToStatus(isActive: boolean): '활성화' | '비활성화' {
  return isActive ? '활성화' : '비활성화';
}

function parseIsoSortKey(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : time;
}

function compareAdminNumber(a: MasterAdminAccount, b: MasterAdminAccount): number {
  return a.adminNumber.localeCompare(b.adminNumber, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function mapAdminApiRecordToAccount(record: MasterAdminApiRecord): MasterAdminAccount {
  const isActive = record.isActive !== false;
  return {
    id: record.id,
    adminNumber: record.adminNumber,
    displayName: resolveAdminAccountDisplayName({
      displayName: record.displayName,
      adminNumber: record.adminNumber,
    }),
    email: record.email,
    role: record.role,
    is2faEnabled: record.is2faEnabled,
    isActive,
    status: mapActiveToStatus(isActive),
    lastLogin: record.lastLoginAt
      ? formatSessionDateTime(record.lastLoginAt)
      : null,
    lastLoginSortKey: parseIsoSortKey(record.lastLoginAt),
    createdAt: formatDisplayDate(record.createdAt ?? null),
    createdAtSortKey: parseIsoSortKey(record.createdAt),
    passwordStatus: '비밀번호 설정됨',
  };
}

export function mapAdminListResponse(response: AdminListResponse): MasterAdminAccountsListResult {
  const admins = (response.admins as MasterAdminApiRecord[]).map(mapAdminApiRecordToAccount);
  return { admins: sortMasterAdminAccounts(admins) };
}

/**
 * MASTER를 최상단에 두고, MASTER끼리는 adminNumber → createdAtSortKey 순.
 * 일반 관리자(ADMIN)는 lastLoginSortKey 내림차순(최신 로그인 우선), 동률·미로그인은 adminNumber 등 fallback.
 */
export function sortMasterAdminAccounts(
  accounts: readonly MasterAdminAccount[]
): MasterAdminAccount[] {
  const masters: MasterAdminAccount[] = [];
  const admins: MasterAdminAccount[] = [];

  for (const account of accounts) {
    if (account.role === 'MASTER') {
      masters.push(account);
    } else {
      admins.push(account);
    }
  }

  const lastLoginDescKey = (key: number | null) => key ?? Number.NEGATIVE_INFINITY;

  masters.sort((a, b) => {
    const byNumber = compareAdminNumber(a, b);
    if (byNumber !== 0) return byNumber;
    return (a.createdAtSortKey ?? 0) - (b.createdAtSortKey ?? 0);
  });

  admins.sort((a, b) => {
    const byLastLogin =
      lastLoginDescKey(b.lastLoginSortKey) - lastLoginDescKey(a.lastLoginSortKey);
    if (byLastLogin !== 0) return byLastLogin;

    const byNumber = compareAdminNumber(a, b);
    if (byNumber !== 0) return byNumber;

    return (a.createdAtSortKey ?? 0) - (b.createdAtSortKey ?? 0);
  });

  return [...masters, ...admins];
}

/** 관리자 목록 조회 */
export async function fetchMasterAdminAccounts(): Promise<MasterAdminAccountsListResult> {
  const response = await getAllAdmins();
  return mapAdminListResponse(response);
}

/** 관리자 활성/비활성 상태 변경 */
export async function updateMasterAdminAccountStatus(
  account: MasterAdminAccount
): Promise<MasterAdminAccount> {
  const nextActive = !account.isActive;
  await updateAdminNumber(account.adminNumber, {
    active: nextActive,
  });
  return {
    ...account,
    isActive: nextActive,
    status: mapActiveToStatus(nextActive),
  };
}

/** 신규 관리자 번호 발급 (가입용) */
export async function issueMasterAdminNumber(
  request: AdminNumberIssueRequest = {}
): Promise<AdminNumberResponse> {
  return issueAdminNumber(request);
}

/** MASTER가 타 관리자 임시 비밀번호 재설정 */
export async function resetMasterAdminPassword(
  account: MasterAdminAccount
): Promise<{ temporaryPassword: string }> {
  const result = await resetAdminPasswordByMaster(account.adminNumber);
  return { temporaryPassword: result.temporaryPassword };
}

/**
 * TODO(BE): 관리자 계정 삭제 API 미구현
 */
export async function deleteMasterAdminAccount(
  _account: MasterAdminAccount
): Promise<void> {
  throw new LoginFailedError(
    '관리자 삭제 API가 아직 제공되지 않습니다. 백엔드 연동 후 호출해 주세요.',
    501
  );
}
