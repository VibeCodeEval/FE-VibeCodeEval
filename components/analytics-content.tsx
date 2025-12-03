"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Download, TrendingUp, TrendingDown, Minus, ChevronDown, X, CheckCircle } from "lucide-react"

type Trend = "High" | "Average" | "Low"
type Status = "Completed" | "In Progress"

interface Participant {
  id: string
  name: string
  entryCode: string
  avgScore: number
  status: Status
  trend: Trend
  sparklineData: number[]
  testDate: Date
  promptScore: number
  performanceScore: number
  correctnessScore: number
}

interface Toast {
  id: string
  title: string
  description: string
}

const participantsData: Participant[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    entryCode: "AIV-2024-001",
    avgScore: 94,
    status: "Completed",
    trend: "High",
    sparklineData: [65, 72, 80, 88, 94],
    testDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    promptScore: 96,
    performanceScore: 92,
    correctnessScore: 94,
  },
  {
    id: "2",
    name: "Michael Chen",
    entryCode: "AIV-2024-001",
    avgScore: 91,
    status: "Completed",
    trend: "High",
    sparklineData: [70, 75, 82, 87, 91],
    testDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    promptScore: 90,
    performanceScore: 88,
    correctnessScore: 95,
  },
  {
    id: "3",
    name: "Emily Davis",
    entryCode: "AIV-2024-002",
    avgScore: 88,
    status: "Completed",
    trend: "High",
    sparklineData: [60, 68, 75, 82, 88],
    testDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    promptScore: 85,
    performanceScore: 90,
    correctnessScore: 89,
  },
  {
    id: "4",
    name: "David Wilson",
    entryCode: "AIV-2024-001",
    avgScore: 86,
    status: "Completed",
    trend: "High",
    sparklineData: [72, 78, 80, 84, 86],
    testDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    promptScore: 88,
    performanceScore: 84,
    correctnessScore: 86,
  },
  {
    id: "5",
    name: "Jessica Lee",
    entryCode: "AIV-2024-003",
    avgScore: 82,
    status: "Completed",
    trend: "Average",
    sparklineData: [78, 80, 79, 81, 82],
    testDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    promptScore: 80,
    performanceScore: 82,
    correctnessScore: 84,
  },
  {
    id: "6",
    name: "Chris Martinez",
    entryCode: "AIV-2024-002",
    avgScore: 78,
    status: "Completed",
    trend: "Average",
    sparklineData: [75, 76, 78, 77, 78],
    testDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    promptScore: 76,
    performanceScore: 78,
    correctnessScore: 80,
  },
  {
    id: "7",
    name: "Amanda Brown",
    entryCode: "AIV-2024-001",
    avgScore: 75,
    status: "In Progress",
    trend: "Average",
    sparklineData: [68, 70, 72, 74, 75],
    testDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    promptScore: 74,
    performanceScore: 75,
    correctnessScore: 76,
  },
  {
    id: "8",
    name: "Ryan Taylor",
    entryCode: "AIV-2024-003",
    avgScore: 72,
    status: "Completed",
    trend: "Average",
    sparklineData: [70, 71, 72, 71, 72],
    testDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    promptScore: 70,
    performanceScore: 72,
    correctnessScore: 74,
  },
  {
    id: "9",
    name: "Nicole Garcia",
    entryCode: "AIV-2024-002",
    avgScore: 68,
    status: "Completed",
    trend: "Average",
    sparklineData: [65, 66, 67, 68, 68],
    testDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    promptScore: 66,
    performanceScore: 68,
    correctnessScore: 70,
  },
  {
    id: "10",
    name: "Kevin Robinson",
    entryCode: "AIV-2024-001",
    avgScore: 55,
    status: "Completed",
    trend: "Low",
    sparklineData: [62, 58, 55, 54, 55],
    testDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    promptScore: 52,
    performanceScore: 55,
    correctnessScore: 58,
  },
  {
    id: "11",
    name: "Laura Thompson",
    entryCode: "AIV-2024-003",
    avgScore: 48,
    status: "In Progress",
    trend: "Low",
    sparklineData: [55, 52, 50, 49, 48],
    testDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    promptScore: 45,
    performanceScore: 48,
    correctnessScore: 51,
  },
  {
    id: "12",
    name: "James Anderson",
    entryCode: "AIV-2024-002",
    avgScore: 42,
    status: "Completed",
    trend: "Low",
    sparklineData: [50, 48, 45, 43, 42],
    testDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    promptScore: 40,
    performanceScore: 42,
    correctnessScore: 44,
  },
]

function Sparkline({ data, trend }: { data: number[]; trend: Trend }) {
  const width = 100
  const height = 32
  const padding = 4

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  const lineColor = trend === "High" ? "#4AA785" : trend === "Low" ? "#D6455D" : "#9CA3AF"

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "High") {
    return <TrendingUp className="h-4 w-4 text-[#4AA785]" strokeWidth={2} />
  } else if (trend === "Low") {
    return <TrendingDown className="h-4 w-4 text-[#D6455D]" strokeWidth={2} />
  }
  return <Minus className="h-4 w-4 text-[#9CA3AF]" strokeWidth={2} />
}

function StatusBadge({ status }: { status: Status }) {
  const styles = status === "Completed" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#E0E7FF] text-[#6366F1]"

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{status}</span>
}

function TrendBadge({ trend }: { trend: Trend }) {
  const styles = {
    High: "bg-[#DCFCE7] text-[#16A34A]",
    Average: "bg-[#F3F4F6] text-[#6B7280]",
    Low: "bg-[#FEE2E2] text-[#DC2626]",
  }

  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[trend]}`}>{trend}</span>
}

function MetricCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1A1A1A]">
        {value}
        {suffix && <span className="ml-1 text-base font-normal text-[#6B7280]">{suffix}</span>}
      </p>
    </div>
  )
}

function ParticipantCard({ participant }: { participant: Participant }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#1A1A1A]">{participant.name}</h3>
          <p className="mt-0.5 text-sm text-[#9CA3AF]">{participant.entryCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={participant.status} />
          <TrendBadge trend={participant.trend} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-[#6B7280]">Avg Score</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#1A1A1A]">{participant.avgScore}%</span>
              <TrendIcon trend={participant.trend} />
            </div>
          </div>
        </div>

        <Sparkline data={participant.sparklineData} trend={participant.trend} />
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/admin/results/${encodeURIComponent(participant.entryCode)}/${participant.id}`}
          className="text-sm font-medium text-[#3B82F6] transition-colors hover:text-[#2563EB]"
        >
          View Detail →
        </Link>
      </div>
    </div>
  )
}

export function AnalyticsContent() {
  const [timeRange, setTimeRange] = useState("All time")
  const [testSession, setTestSession] = useState("All Sessions")
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (title: string, description: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, title, description }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleExport = () => {
    const csvContent =
      "Name,Entry Code,Avg Score,Status,Trend,Prompt Score,Performance Score,Correctness Score\n" +
      participantsData
        .map(
          (p) =>
            `${p.name},${p.entryCode},${p.avgScore},${p.status},${p.trend},${p.promptScore},${p.performanceScore},${p.correctnessScore}`,
        )
        .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "analytics-results.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast("Export started", "Analytics results are being downloaded as a CSV file.")
  }

  const filteredParticipants = useMemo(() => {
    const now = new Date()

    let dateThreshold: Date | null = null
    switch (timeRange) {
      case "Last 7 days":
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "Last 14 days":
        dateThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case "Last 30 days":
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "Last 90 days":
        dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        dateThreshold = null
    }

    return participantsData.filter((p) => {
      const passesTimeFilter = dateThreshold === null || p.testDate >= dateThreshold
      const passesSessionFilter = testSession === "All Sessions" || p.entryCode === testSession
      return passesTimeFilter && passesSessionFilter
    })
  }, [timeRange, testSession])

  const metrics = useMemo(() => {
    if (filteredParticipants.length === 0) {
      return {
        promptScore: "–",
        performanceScore: "–",
        correctnessScore: "–",
        userCount: "0",
      }
    }

    const avgPrompt = filteredParticipants.reduce((sum, p) => sum + p.promptScore, 0) / filteredParticipants.length
    const avgPerformance =
      filteredParticipants.reduce((sum, p) => sum + p.performanceScore, 0) / filteredParticipants.length
    const avgCorrectness =
      filteredParticipants.reduce((sum, p) => sum + p.correctnessScore, 0) / filteredParticipants.length

    return {
      promptScore: avgPrompt.toFixed(1),
      performanceScore: avgPerformance.toFixed(1),
      correctnessScore: avgCorrectness.toFixed(1),
      userCount: filteredParticipants.length.toString(),
    }
  }, [filteredParticipants])

  const highPerformers = filteredParticipants.filter((p) => p.avgScore >= 85)
  const midPerformers = filteredParticipants.filter((p) => p.avgScore >= 60 && p.avgScore < 85)
  const lowPerformers = filteredParticipants.filter((p) => p.avgScore < 60)

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Analytics</h1>
          <p className="text-sm text-[#6B7280]">
            Visualize performance, correctness, and system trends across all test sessions.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none rounded-lg border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              >
                <option>Last 7 days</option>
                <option>Last 14 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>All time</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            </div>

            <div className="relative">
              <select
                value={testSession}
                onChange={(e) => setTestSession(e.target.value)}
                className="appearance-none rounded-lg border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
              >
                <option>All Sessions</option>
                <option>AIV-2024-001</option>
                <option>AIV-2024-002</option>
                <option>AIV-2024-003</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            </div>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Export Results (CSV)
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <MetricCard
            label="Prompt Score"
            value={metrics.promptScore}
            suffix={metrics.promptScore !== "–" ? "/ 100" : undefined}
          />
          <MetricCard
            label="Performance Score"
            value={metrics.performanceScore}
            suffix={metrics.performanceScore !== "–" ? "/ 100" : undefined}
          />
          <MetricCard
            label="Correctness Score"
            value={metrics.correctnessScore}
            suffix={metrics.correctnessScore !== "–" ? "/ 100" : undefined}
          />
          <MetricCard label="누적 사용자 수" value={metrics.userCount} />
        </div>

        {filteredParticipants.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5] bg-white py-16">
            <p className="text-lg font-medium text-[#6B7280]">No participants found</p>
            <p className="mt-1 text-sm text-[#9CA3AF]">Try adjusting your filters to see results.</p>
          </div>
        )}

        {highPerformers.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">High Performers (85%+)</h2>
            <div className="grid grid-cols-2 gap-6">
              {highPerformers.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {midPerformers.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">Mid Performers (60–84%)</h2>
            <div className="grid grid-cols-2 gap-6">
              {midPerformers.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}

        {lowPerformers.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#6B7280]">
              Low Performers (&lt;60%)
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {lowPerformers.map((participant) => (
                <ParticipantCard key={participant.id} participant={participant} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex w-[360px] items-start gap-3 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]">
              <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A1A]">{toast.title}</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#6B7280]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
