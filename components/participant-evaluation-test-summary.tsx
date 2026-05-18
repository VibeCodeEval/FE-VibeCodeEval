"use client"

import type {
  AdminSubmissionDetailResponse,
  AdminSubmissionGroupInfo,
  AdminSubmissionRunGroup,
  AdminSubmissionCaseRunInfo,
} from "@/lib/api/admin"

const TC_GROUP_ORDER: AdminSubmissionRunGroup[] = ["SAMPLE", "PUBLIC", "PRIVATE"]

const TC_GROUP_LABEL: Record<AdminSubmissionRunGroup, string> = {
  SAMPLE: "샘플 (SAMPLE)",
  PUBLIC: "공개 (PUBLIC)",
  PRIVATE: "비공개 (PRIVATE)",
}

const TC_GROUP_WEIGHT: Record<AdminSubmissionRunGroup, number> = {
  SAMPLE: 0.1,
  PUBLIC: 0.3,
  PRIVATE: 0.6,
}

const VERDICT_LABEL: Record<string, string> = {
  AC: "정답 (AC)",
  WA: "오답 (WA)",
  TLE: "시간 초과 (TLE)",
  MLE: "메모리 초과 (MLE)",
  RE: "런타임 오류 (RE)",
}

function formatSubmissionStatusDetailKo(
  status: AdminSubmissionDetailResponse["status"] | undefined
): string {
  if (!status) return "–"
  const map: Record<AdminSubmissionDetailResponse["status"], string> = {
    QUEUED: "대기 (QUEUED)",
    RUNNING: "실행·채점 중 (RUNNING)",
    DONE: "완료 (DONE)",
    FAILED: "실패 (FAILED)",
  }
  return map[status] ?? status
}

function normalizeRunGroupName(name: unknown): AdminSubmissionRunGroup | null {
  const raw =
    typeof name === "string"
      ? name
      : name != null && typeof name === "object" && "name" in name
        ? String((name as { name: unknown }).name)
        : String(name)
  if (raw === "SAMPLE" || raw === "PUBLIC" || raw === "PRIVATE") return raw
  return null
}

function mergeTcGroupsForDisplay(groups: AdminSubmissionGroupInfo[] | undefined) {
  const map = new Map<AdminSubmissionRunGroup, AdminSubmissionGroupInfo>()
  for (const g of groups ?? []) {
    const key = normalizeRunGroupName(g.name)
    if (key) map.set(key, { ...g, name: key })
  }
  return TC_GROUP_ORDER.map((name) => {
    const g = map.get(name)
    return {
      name,
      label: TC_GROUP_LABEL[name],
      pass: g?.pass ?? 0,
      total: g?.total ?? 0,
      weight: g?.weight ?? TC_GROUP_WEIGHT[name],
    }
  })
}

function aggregateGroupsFromRuns(runs: AdminSubmissionCaseRunInfo[]): AdminSubmissionGroupInfo[] {
  const acc = new Map<AdminSubmissionRunGroup, { pass: number; total: number }>()
  for (const r of runs) {
    const cur = acc.get(r.grp) ?? { pass: 0, total: 0 }
    cur.total += 1
    if (r.verdict === "AC") cur.pass += 1
    acc.set(r.grp, cur)
  }
  return TC_GROUP_ORDER.filter((name) => acc.has(name)).map((name) => ({
    name,
    pass: acc.get(name)!.pass,
    total: acc.get(name)!.total,
    weight: TC_GROUP_WEIGHT[name],
  }))
}

export interface ParticipantEvaluationTestSummaryProps {
  submissionId: number | null
  isLoading: boolean
  detail: AdminSubmissionDetailResponse | null
  boardStatusLabel: string | null
}

export function ParticipantEvaluationTestSummary({
  submissionId,
  isLoading,
  detail,
  boardStatusLabel,
}: ParticipantEvaluationTestSummaryProps) {
  const displayGroups = (() => {
    const fromApi = detail?.tc?.groups
    if (fromApi && fromApi.length > 0) return mergeTcGroupsForDisplay(fromApi)
    const runs = detail?.runs
    if (runs && runs.length > 0) return mergeTcGroupsForDisplay(aggregateGroupsFromRuns(runs))
    return mergeTcGroupsForDisplay([])
  })()

  const hasAnyTcData =
    (detail?.tc?.groups?.length ?? 0) > 0 || (detail?.runs?.length ?? 0) > 0

  const failedRuns = (detail?.runs ?? []).filter((r) => r.verdict !== "AC")

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
      {isLoading && submissionId != null && (
        <p className="text-sm text-[#6B7280]">제출 상세·테스트 결과를 불러오는 중…</p>
      )}
      {!isLoading && submissionId == null && (
        <p className="text-sm text-[#6B7280]">제출 기록이 없어 테스트 결과를 표시할 수 없습니다.</p>
      )}
      {!isLoading && submissionId != null && !detail && (
        <p className="text-sm text-[#6B7280]">
          제출 상세를 불러오지 못했습니다. 네트워크·관리자 권한을 확인하세요.
        </p>
      )}
      {detail && (
        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">제출 상태</p>
              <p className="mt-2 font-semibold text-[#1A1A1A]">
                {formatSubmissionStatusDetailKo(detail.status)}
              </p>
              {boardStatusLabel && (
                <p className="mt-1 text-xs text-[#6B7280]">보드: {boardStatusLabel}</p>
              )}
            </div>
            <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">실행 시간</p>
              <p className="mt-2 font-semibold text-[#1A1A1A]">
                {detail.metrics?.timeMsMedian != null ? `${detail.metrics.timeMsMedian} ms` : "–"}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">중앙값 (submission_runs)</p>
            </div>
            <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">메모리</p>
              <p className="mt-2 font-semibold text-[#1A1A1A]">
                {detail.metrics?.memKbPeak != null ? `${detail.metrics.memKbPeak} KB` : "–"}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">peak (submission_runs)</p>
            </div>
            <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">코드 LOC</p>
              <p className="mt-2 font-semibold text-[#1A1A1A]">
                {detail.metrics?.loc != null ? detail.metrics.loc : "–"}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">submissions.code_loc</p>
            </div>
          </div>

          <div>
            <p className="mb-3 font-medium text-[#374151]">테스트 그룹별 결과</p>
            {hasAnyTcData ? (
              <>
                <div className="overflow-x-auto rounded-lg border border-[#E5E5E5]">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-[#FAFAFA]">
                      <tr className="border-b border-[#E5E5E5] text-xs text-[#6B7280]">
                        <th className="px-4 py-3 font-medium">그룹</th>
                        <th className="px-4 py-3 font-medium">통과 / 전체</th>
                        <th className="px-4 py-3 font-medium">통과율</th>
                        <th className="px-4 py-3 font-medium">가중치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayGroups.map((g) => {
                        const rate = g.total > 0 ? (g.pass / g.total) * 100 : 0
                        return (
                          <tr key={g.name} className="border-b border-[#F3F4F6] last:border-0">
                            <td className="px-4 py-3 text-[#1A1A1A]">{g.label}</td>
                            <td className="px-4 py-3 font-mono text-[#1A1A1A]">
                              {g.pass} / {g.total}
                            </td>
                            <td className="px-4 py-3 text-[#374151]">
                              {g.total > 0 ? `${rate.toFixed(0)}%` : "–"}
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">{(g.weight * 100).toFixed(0)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {detail.tc?.passRateWeighted != null && (
                  <p className="mt-2 text-xs text-[#6B7280]">
                    가중 통과율 (API): {(Number(detail.tc.passRateWeighted) * 100).toFixed(1)}%
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-[#6B7280]">
                submission_runs 집계 데이터가 없습니다. 채점 완료 후에도 비어 있으면 테스트 결과가 DB에
                저장되지 않았을 수 있습니다.
              </p>
            )}
          </div>

          {failedRuns.length > 0 ? (
            <div>
              <p className="mb-3 font-medium text-[#374151]">실패·비정답 케이스</p>
              <div className="overflow-x-auto rounded-lg border border-[#E5E5E5]">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-[#FAFAFA]">
                    <tr className="border-b border-[#E5E5E5] text-xs text-[#6B7280]">
                      <th className="px-4 py-3 font-medium">케이스</th>
                      <th className="px-4 py-3 font-medium">그룹</th>
                      <th className="px-4 py-3 font-medium">판정</th>
                      <th className="px-4 py-3 font-medium">시간</th>
                      <th className="px-4 py-3 font-medium">메모리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedRuns.map((r) => (
                      <tr
                        key={`${r.caseIndex}-${r.grp}-${r.verdict}`}
                        className="border-b border-[#F3F4F6] last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs">#{r.caseIndex}</td>
                        <td className="px-4 py-3">{TC_GROUP_LABEL[r.grp]}</td>
                        <td className="px-4 py-3">{VERDICT_LABEL[r.verdict] ?? r.verdict}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {r.timeMs != null ? `${r.timeMs} ms` : "–"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {r.memKb != null ? `${r.memKb} KB` : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">출처: 관리자 API runs[] (submission_runs)</p>
            </div>
          ) : hasAnyTcData ? (
            <p className="text-xs text-[#6B7280]">모든 기록된 케이스가 정답(AC)입니다.</p>
          ) : null}

          <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] px-4 py-3 text-xs text-[#6B7280]">
            <p className="font-medium text-[#374151]">현재 API에서 제공되지 않음</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>테스트 케이스별 expected / actual 입·출력 상세</li>
              <li>표준 출력·에러 본문 (stdout_bytes / stderr_bytes는 API 미노출)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
