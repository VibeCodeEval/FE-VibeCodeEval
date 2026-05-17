"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import {
  parseRubricJson,
  pickScore,
  asString,
  asStringArray,
  asNumber,
  hasPresentValue,
  isRecord,
  collectDebateEntries,
  groupDebateEntriesByRound,
  splitHolisticFlowAnalysis,
  formatRubricJsonPretty,
  formatWeightLabel,
  rubricHasStructuredFields,
  type RubricJsonRecord,
} from "@/lib/rubric-json"
import {
  collectFunctionComplexityDisplayLines,
  formatCodeQualityMetricLabel,
} from "@/lib/code-quality-metrics-labels"

export interface ParticipantEvaluationRubricReportProps {
  rubricJson: string | null | undefined
  isLoading?: boolean
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280]" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
        )}
      </button>
      {open && <div className="border-t border-[#E5E5E5] px-4 py-4">{children}</div>}
    </section>
  )
}

function MetricCell({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <div className="rounded-lg border border-[#F3F4F6] bg-white px-4 py-3">
      <div className="flex items-center gap-1">
        <p className="text-xs font-medium text-[#6B7280]">{label}</p>
        {description && (
          <span
            className="inline-flex shrink-0 text-[#9CA3AF]"
            title={description}
            aria-label={description}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-[#1A1A1A]">{value}</p>
    </div>
  )
}

function TextBlock({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#374151]">{text}</p>
  )
}

function Unavailable({ label = "제공되지 않음" }: { label?: string }) {
  return <p className="text-sm text-[#9CA3AF]">{label}</p>
}

function formatDisplayLabel(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatScoreDisplay(n: number | null): string {
  if (n === null) return "–"
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function SummarySection({ data }: { data: RubricJsonRecord }) {
  const grade = asString(data.grade)
  const total = pickScore(data, "total_score", "totalScore")
  const prompt = pickScore(data, "prompt_score", "promptScore")
  const correctness = pickScore(
    data,
    "correctness_score",
    "correctnessScore",
    "code_correctness_score",
    "codeCorrectnessScore"
  )
  const performance = pickScore(
    data,
    "performance_score",
    "performanceScore",
    "code_performance_score",
    "codePerformanceScore"
  )
  const holistic = pickScore(data, "holistic_flow_score", "holisticFlowScore")
  const weights = isRecord(data.weights) ? data.weights : null

  const hasAny =
    grade ||
    total !== null ||
    prompt !== null ||
    correctness !== null ||
    performance !== null ||
    holistic !== null ||
    weights

  if (!hasAny) return null

  return (
    <Section title="1. 최종 AI 평가 요약">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {grade && <MetricCell label="등급" value={grade} />}
        {total !== null && <MetricCell label="총점" value={formatScoreDisplay(total)} />}
        {prompt !== null && <MetricCell label="프롬프트 점수" value={formatScoreDisplay(prompt)} />}
        {correctness !== null && (
          <MetricCell label="정답률 점수" value={formatScoreDisplay(correctness)} />
        )}
        {performance !== null && (
          <MetricCell label="성능 점수" value={formatScoreDisplay(performance)} />
        )}
        {holistic !== null && (
          <MetricCell
            label="Holistic Flow"
            value={formatScoreDisplay(holistic)}
            description="전체 대화 흐름 및 AI 활용 전략 평가"
          />
        )}
      </div>
      {weights && (
        <div className="mt-4 rounded-lg border border-[#F3F4F6] bg-white px-4 py-3">
          <p className="mb-2 text-xs font-medium text-[#6B7280]">가중치</p>
          <div className="flex flex-wrap gap-4 text-sm text-[#374151]">
            {formatWeightLabel(weights.prompt, "프롬프트") && (
              <span>{formatWeightLabel(weights.prompt, "프롬프트")}</span>
            )}
            {formatWeightLabel(weights.correctness, "정답률") && (
              <span>{formatWeightLabel(weights.correctness, "정답률")}</span>
            )}
            {formatWeightLabel(weights.performance, "성능") && (
              <span>{formatWeightLabel(weights.performance, "성능")}</span>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}

const R4_CONTEXT_SECTION_TITLE = "R4 맥락 유지"
const R4_CONTEXT_SECTION_HINT = "대화 흐름과 문맥 유지 능력 평가"

function HolisticSubsectionTitle({ title }: { title: string }) {
  const showHint = title === R4_CONTEXT_SECTION_TITLE
  return (
    <div className="mb-2 flex items-center gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{title}</p>
      {showHint && (
        <span
          className="inline-flex shrink-0 text-[#9CA3AF]"
          title={R4_CONTEXT_SECTION_HINT}
          aria-label={R4_CONTEXT_SECTION_HINT}
        >
          <Info className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        </span>
      )}
    </div>
  )
}

function HolisticSection({ data }: { data: RubricJsonRecord }) {
  const analysis = asString(data.holistic_flow_analysis) ?? asString(data.holisticFlowAnalysis)
  if (!analysis) return null

  const sections = splitHolisticFlowAnalysis(analysis)

  return (
    <Section title="2. 종합 분석">
      <div className="space-y-4">
        {sections.map((sec, i) => (
          <div key={i} className="rounded-lg border border-[#F3F4F6] bg-white p-4">
            <HolisticSubsectionTitle title={sec.title} />
            <TextBlock text={sec.body} />
          </div>
        ))}
      </div>
    </Section>
  )
}

function CodeEvalReportSection({ data }: { data: RubricJsonRecord }) {
  const report = data.code_eval_report ?? data.codeEvalReport
  if (!isRecord(report)) return null

  const fields: { key: string; label: string }[] = [
    { key: "overall_summary", label: "종합 요약" },
    { key: "efficiency_review", label: "효율성 리뷰" },
    { key: "readability_review", label: "가독성 리뷰" },
    { key: "error_handling_review", label: "예외 처리 리뷰" },
    { key: "score_adjustment_note", label: "점수 조정 참고" },
  ]

  const items = fields
    .map(({ key, label }) => {
      const text = asString(report[key])
      return text ? { label, text } : null
    })
    .filter((x): x is { label: string; text: string } => x != null)

  if (items.length === 0) return null

  return (
    <Section title="3. 코드 평가 리포트">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-[#F3F4F6] bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              {item.label}
            </p>
            <TextBlock text={item.text} />
          </div>
        ))}
      </div>
    </Section>
  )
}

const DEBATE_AGENT_ORDER = ["strict", "advocate", "neutral"]

function pickDebateBriefSummary(entry: RubricJsonRecord): string | null {
  return (
    asString(entry.stance) ??
    asString(entry.summary) ??
    asString(entry.opinion) ??
    asString(entry.overview) ??
    null
  )
}

function debateAgentSortKey(entry: RubricJsonRecord): number {
  const agent = asString(entry.agent)?.toLowerCase() ?? ""
  const idx = DEBATE_AGENT_ORDER.indexOf(agent)
  return idx >= 0 ? idx : 100
}

function DebateAgentBadge({ agent }: { agent: string }) {
  const key = agent.toLowerCase()
  const tone =
    key === "strict"
      ? "bg-[#FEE2E2] text-[#B91C1C]"
      : key === "advocate"
        ? "bg-[#DCFCE7] text-[#15803D]"
        : key === "neutral"
          ? "bg-[#F3F4F6] text-[#374151]"
          : "bg-[#E0EDFF] text-[#1D4ED8]"
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {formatDisplayLabel(agent)}
    </span>
  )
}

function DebateRoundCompactRow({ entry }: { entry: RubricJsonRecord }) {
  const agent = asString(entry.agent) ?? "–"
  const summary = pickDebateBriefSummary(entry)
  const suggested = asNumber(entry.suggested_score ?? entry.suggestedScore)

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex min-w-[5.5rem] items-center sm:pt-0.5">
        <DebateAgentBadge agent={agent} />
      </div>
      <div className="min-w-0 flex-1 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2">
        {summary ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-snug text-[#78350F]">{summary}</p>
        ) : (
          <p className="text-sm text-[#9CA3AF]">제공되지 않음</p>
        )}
        {suggested !== null && (
          <p className="mt-1 text-xs text-[#92400E]">제안 점수 {formatScoreDisplay(suggested)}</p>
        )}
      </div>
    </div>
  )
}

function DebateVerdictCard({ entry }: { entry: RubricJsonRecord }) {
  const suggested = asNumber(entry.suggested_score ?? entry.suggestedScore)
  const keyPoints = asStringArray(entry.key_points ?? entry.keyPoints)
  const codeQ = asString(entry.code_quality_assessment ?? entry.codeQualityAssessment)
  const promptQ = asString(entry.prompt_quality_assessment ?? entry.promptQualityAssessment)
  const consensus = asString(entry.consensus_summary ?? entry.consensusSummary)
  const holistic = asNumber(entry.holistic_flow_score ?? entry.holisticFlowScore)
  const holisticAnalysis = asString(entry.holistic_flow_analysis ?? entry.holisticFlowAnalysis)
  const scoreRationale = asString(entry.score_rationale ?? entry.scoreRationale)
  const grade = asString(entry.grade)
  const r4 = asNumber(entry.r4_context_maintenance_score ?? entry.r4ContextMaintenanceScore)

  return (
    <article className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#1E293B] px-2.5 py-0.5 text-xs font-semibold text-white">
          Verdict
        </span>
        {grade && (
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
            등급 {grade}
          </span>
        )}
        {holistic !== null && (
          <span className="text-xs text-[#6B7280]">Holistic {formatScoreDisplay(holistic)}</span>
        )}
        {r4 !== null && <span className="text-xs text-[#6B7280]">R4 {formatScoreDisplay(r4)}</span>}
        {suggested !== null && (
          <span className="text-xs text-[#6B7280]">제안 점수: {formatScoreDisplay(suggested)}</span>
        )}
      </div>
      {consensus && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[#6B7280]">합의 요약</p>
          <TextBlock text={consensus} />
        </div>
      )}
      {holisticAnalysis && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[#6B7280]">종합 분석</p>
          <TextBlock text={holisticAnalysis} />
        </div>
      )}
      {scoreRationale && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[#6B7280]">점수 근거</p>
          <TextBlock text={scoreRationale} />
        </div>
      )}
      {keyPoints.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[#6B7280]">핵심 포인트</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-[#374151]">
            {keyPoints.map((p, i) => (
              <li key={i} className="whitespace-pre-wrap break-words">
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {codeQ && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-[#6B7280]">코드 품질 평가</p>
          <TextBlock text={codeQ} />
        </div>
      )}
      {promptQ && (
        <div>
          <p className="mb-1 text-xs font-medium text-[#6B7280]">프롬프트 품질 평가</p>
          <TextBlock text={promptQ} />
        </div>
      )}
    </article>
  )
}

function DebateSection({ data }: { data: RubricJsonRecord }) {
  const entries = collectDebateEntries(data)
  if (entries.length === 0) return null

  const { roundNumbers, byRound, verdicts } = groupDebateEntriesByRound(entries)

  for (const list of byRound.values()) {
    list.sort((a, b) => debateAgentSortKey(a) - debateAgentSortKey(b))
  }

  return (
    <Section title="4. 평가관 토론 요약">
      <div className="space-y-4">
        {roundNumbers.map((roundNum) => {
          const roundEntries = byRound.get(roundNum) ?? []
          if (roundEntries.length === 0) return null
          return (
            <div key={roundNum} className="rounded-lg border border-[#E5E5E5] bg-white p-3 sm:p-4">
              <p className="mb-3 text-sm font-semibold text-[#1A1A1A]">Round {roundNum}</p>
              <div className="space-y-3">
                {roundEntries.map((entry, i) => (
                  <DebateRoundCompactRow
                    key={`${roundNum}-${asString(entry.agent) ?? i}`}
                    entry={entry}
                  />
                ))}
              </div>
            </div>
          )
        })}
        {verdicts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#1A1A1A]">최종 Verdict</p>
            {verdicts.map((entry, i) => (
              <DebateVerdictCard key={`verdict-${i}`} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

function TurnScoresSection({ data }: { data: RubricJsonRecord }) {
  const raw = data.turn_scores ?? data.turnScores
  if (!isRecord(raw) && !Array.isArray(raw)) return null

  const rows: { turn: string; score: string; detail: string }[] = []

  if (isRecord(raw)) {
    for (const [turn, val] of Object.entries(raw)) {
      if (isRecord(val)) {
        const ts = asNumber(val.turn_score ?? val.turnScore ?? val.score)
        const parts: string[] = []
        if (hasPresentValue(val.intent)) parts.push(`intent: ${asString(val.intent)}`)
        if (hasPresentValue(val.feedback)) parts.push(asString(val.feedback) ?? "")
        rows.push({
          turn,
          score: ts !== null ? formatScoreDisplay(ts) : "–",
          detail: parts.join(" · ") || "–",
        })
      } else {
        const n = asNumber(val)
        rows.push({ turn, score: n !== null ? formatScoreDisplay(n) : String(val), detail: "–" })
      }
    }
  }

  if (rows.length === 0) return null

  rows.sort((a, b) => {
    const na = Number(a.turn)
    const nb = Number(b.turn)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return a.turn.localeCompare(b.turn)
  })

  return (
    <Section title="5. 프롬프트 턴 점수">
      <div className="overflow-x-auto rounded-lg border border-[#E5E5E5]">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-white">
            <tr className="border-b border-[#E5E5E5] text-xs text-[#6B7280]">
              <th className="px-4 py-2 font-medium">Turn</th>
              <th className="px-4 py-2 font-medium">점수</th>
              <th className="px-4 py-2 font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.turn} className="border-b border-[#F3F4F6] last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{r.turn}</td>
                <td className="px-4 py-2 font-semibold text-[#1A1A1A]">{r.score}</td>
                <td className="px-4 py-2 text-[#6B7280]">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function QualityMetricsSection({ data }: { data: RubricJsonRecord }) {
  const qm = data.code_quality_metrics ?? data.codeQualityMetrics
  if (!isRecord(qm)) return null

  const radon = isRecord(qm.radon_cc) ? qm.radon_cc : isRecord(qm.radonCc) ? qm.radonCc : null
  const refRadon = isRecord(qm.reference_radon_cc)
    ? qm.reference_radon_cc
    : isRecord(qm.referenceRadonCc)
      ? qm.referenceRadonCc
      : null
  const deltaRef = isRecord(qm.delta_cc_vs_reference)
    ? qm.delta_cc_vs_reference
    : isRecord(qm.deltaCcVsReference)
      ? qm.deltaCcVsReference
      : null
  const deltaCc = isRecord(qm.delta_cc) ? qm.delta_cc : isRecord(qm.deltaCc) ? qm.deltaCc : null
  const v2Radon = isRecord(qm.v2_metrics) && isRecord(qm.v2_metrics.radon_cc) ? qm.v2_metrics.radon_cc : null
  const functionLines = collectFunctionComplexityDisplayLines(
    qm.functions,
    radon?.functions,
    v2Radon?.functions
  )

  const metrics: { key: string; label: string; value: string }[] = []
  const push = (metricKey: string, v: unknown) => {
    const n = asNumber(v)
    const s = asString(v)
    const label = formatCodeQualityMetricLabel(metricKey)
    if (n !== null) metrics.push({ key: metricKey, label, value: formatScoreDisplay(n) })
    else if (s) metrics.push({ key: metricKey, label, value: s })
  }

  if (radon) {
    push("radon_cc.avg_cc", radon.avg_cc ?? radon.avgCc)
    push("radon_cc.max_cc", radon.max_cc ?? radon.maxCc)
  }
  if (refRadon) {
    push("reference_radon_cc.avg_cc", refRadon.avg_cc ?? refRadon.avgCc)
    push("reference_radon_cc.max_cc", refRadon.max_cc ?? refRadon.maxCc)
  }
  if (deltaRef) {
    push("delta_cc_vs_reference.delta_cc_pct", deltaRef.delta_cc_pct ?? deltaRef.deltaCcPct)
  }
  if (deltaCc && !deltaRef) {
    push("delta_cc.delta_cc_pct", deltaCc.delta_cc_pct ?? deltaCc.deltaCcPct)
  }

  if (metrics.length === 0 && functionLines.length === 0) return null

  return (
    <Section title="6. 코드 품질 메트릭">
      {metrics.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {metrics.map((m) => (
            <MetricCell key={m.key} label={m.label} value={m.value} />
          ))}
        </div>
      )}
      {functionLines.length > 0 && (
        <div className="rounded-lg border border-[#F3F4F6] bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            함수별 복잡도
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-[#374151]">
            {functionLines.map((fn, i) => (
              <li key={i} className="break-words">
                {fn}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

function RawJsonSection({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#374151]"
      >
        7. 원본 JSON 보기
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <pre className="max-h-[360px] overflow-auto border-t border-[#E5E5E5] p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-[#1A1A1A]">
          {raw}
        </pre>
      )}
    </section>
  )
}

function StructuredReport({ data, rawPretty }: { data: RubricJsonRecord; rawPretty: string }) {
  const hasStructured = rubricHasStructuredFields(data)

  return (
    <div className="space-y-4">
      {!hasStructured && (
        <p className="text-sm text-[#6B7280]">
          파싱된 루브릭 데이터에 표시할 구조화 필드가 없습니다. 아래 원본 JSON을 확인하세요.
        </p>
      )}
      <SummarySection data={data} />
      <HolisticSection data={data} />
      <CodeEvalReportSection data={data} />
      <DebateSection data={data} />
      <TurnScoresSection data={data} />
      <QualityMetricsSection data={data} />
      <RawJsonSection raw={rawPretty} />
    </div>
  )
}

export function ParticipantEvaluationRubricReport({
  rubricJson,
  isLoading = false,
}: ParticipantEvaluationRubricReportProps) {
  const parsed = useMemo(() => parseRubricJson(rubricJson ?? null), [rubricJson])

  if (isLoading) {
    return <p className="text-sm text-[#6B7280]">AI 평가 리포트를 불러오는 중…</p>
  }

  if (!rubricJson?.trim()) {
    return (
      <p className="text-sm text-[#6B7280]">
        채점 루브릭 JSON(<code className="rounded bg-[#F3F4F6] px-1">scores.rubric_json</code>)이
        아직 없습니다.
      </p>
    )
  }

  if (!parsed) {
    return <Unavailable />
  }

  if (!parsed.ok) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-800">
          rubricJson JSON 파싱에 실패했습니다. 원본 문자열을 표시합니다.
          {parsed.error ? ` (${parsed.error})` : ""}
        </p>
        <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4 font-mono text-xs text-[#1A1A1A]">
          {parsed.raw}
        </pre>
      </div>
    )
  }

  const rawPretty = formatRubricJsonPretty(parsed.data)
  return <StructuredReport data={parsed.data} rawPretty={rawPretty} />
}
