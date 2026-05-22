import type { AdminProblem, AdminProblemDetail } from "@/lib/api/admin"

export type ProblemDifficultyKo = "쉬움" | "중간" | "어려움"

export type MasterProblemListItem = {
  id: number
  title: string
  titleWithVersion: string
  versionLabel: string
  difficulty: ProblemDifficultyKo
  difficultyRaw: string
  tags: string[]
  lastUpdatedLabel: string
  lastUpdatedIso: string | null
  status: string
  createdAt: string
  searchText: string
}

export type MasterProblemDetail = MasterProblemListItem & {
  contentMd: string
  restrictionsInfo: string
  usable: boolean
}

export function mapDifficultyToKo(
  difficulty: AdminProblem["difficulty"] | string | null | undefined
): ProblemDifficultyKo {
  const normalized = String(difficulty ?? "").toUpperCase()
  if (normalized === "MEDIUM") return "중간"
  if (normalized === "HARD") return "어려움"
  return "쉬움"
}

export function parseProblemTags(tags: AdminProblem["tags"] | string[] | null | undefined): string[] {
  if (tags == null) return []
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean)
  }
  const raw = String(tags).trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map((t) => String(t).trim()).filter(Boolean)
    }
  } catch {
    if (raw.includes(",")) {
      return raw.split(",").map((t) => t.trim()).filter(Boolean)
    }
  }
  return [raw]
}

/** 1 → v1.0, "1.0" → v1.0, 이미 v1.0이면 유지 */
export function formatProblemVersionLabel(
  version: number | string | null | undefined
): string {
  if (version == null || String(version).trim() === "") return "v1.0"

  const s = String(version).trim()
  const numericPart = s.startsWith("v") || s.startsWith("V") ? s.slice(1) : s
  const n = Number(numericPart)

  if (Number.isFinite(n)) {
    return `v${n.toFixed(1)}`
  }

  return s.startsWith("v") || s.startsWith("V") ? s : `v${s}`
}

export function formatProblemLastUpdated(
  updatedAt: string | null | undefined,
  createdAt: string | null | undefined
): { label: string; iso: string | null } {
  const iso = updatedAt?.trim() || createdAt?.trim() || null
  if (!iso) return { label: "-", iso: null }

  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { label: iso.split("T")[0] ?? "-", iso }

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days < 1) return { label: "오늘", iso }
  if (days === 1) return { label: "1일 전", iso }
  if (days < 7) return { label: `${days}일 전`, iso }
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return { label: `${weeks}주 전`, iso }
  }

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return { label: `${y}-${m}-${day}`, iso }
}

function buildRestrictionsInfo(detail: AdminProblemDetail): string {
  const parts: string[] = []
  if (detail.limits) {
    parts.push(`시간 제한 ${detail.limits.timeMs}ms · 메모리 ${detail.limits.memoryMb}MB`)
  }
  if (detail.restrictions?.allowedLangs?.length) {
    parts.push(`허용 언어: ${detail.restrictions.allowedLangs.join(", ")}`)
  }
  if (detail.restrictions?.forbiddenApis?.length) {
    parts.push(`금지 API: ${detail.restrictions.forbiddenApis.join(", ")}`)
  }
  if (detail.checker?.type) {
    parts.push(`채점 방식: ${detail.checker.type}`)
  }
  return parts.length > 0 ? parts.join("\n") : "정보 없음"
}

export function mapAdminProblemToMasterListItem(problem: AdminProblem): MasterProblemListItem {
  const tags = parseProblemTags(problem.tags)
  const difficulty = mapDifficultyToKo(problem.difficulty)
  const versionLabel = formatProblemVersionLabel(problem.version ?? 1)
  const { label: lastUpdatedLabel, iso: lastUpdatedIso } = formatProblemLastUpdated(
    problem.updatedAt,
    problem.createdAt
  )
  const searchText = [problem.title, versionLabel, difficulty, ...tags, problem.status]
    .join(" ")
    .toLowerCase()

  return {
    id: problem.id,
    title: problem.title,
    titleWithVersion: `${problem.title} ${versionLabel}`,
    versionLabel,
    difficulty,
    difficultyRaw: problem.difficulty,
    tags,
    lastUpdatedLabel,
    lastUpdatedIso,
    status: problem.status,
    createdAt: problem.createdAt,
    searchText,
  }
}

export function buildMasterProblemDetailFromApi(
  listItem: MasterProblemListItem,
  detail: AdminProblemDetail
): MasterProblemDetail {
  const versionLabel = formatProblemVersionLabel(detail.version)
  const { label: lastUpdatedLabel, iso: lastUpdatedIso } = formatProblemLastUpdated(
    detail.updatedAt ?? detail.publishedAt,
    detail.createdAt
  )
  const tags = parseProblemTags(detail.tags)

  return {
    ...listItem,
    id: detail.id,
    title: detail.title,
    titleWithVersion: `${detail.title} ${versionLabel}`,
    versionLabel,
    difficulty: mapDifficultyToKo(detail.difficulty),
    difficultyRaw: detail.difficulty,
    tags,
    lastUpdatedLabel,
    lastUpdatedIso,
    status: detail.status,
    contentMd: detail.contentMd?.trim() ?? "",
    restrictionsInfo: buildRestrictionsInfo(detail),
    usable: detail.usable,
  }
}

export function filterMasterProblems(
  problems: MasterProblemListItem[],
  query: string
): MasterProblemListItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return problems
  return problems.filter((p) => p.searchText.includes(q))
}
