"use client"

import Link from "next/link"
import { Users, CheckCircle, TrendingUp, Play, Plus, BarChart3, ArrowRight } from "lucide-react"

// Sample recent activity data
const recentActivity = [
  {
    id: 1,
    timestamp: "2024-01-15 14:32",
    status: "Evaluation Completed",
    message: "Participant Kim Minjun completed evaluation",
  },
  { id: 2, timestamp: "2024-01-15 14:15", status: "Room Started", message: "Test session AIV-2024-001 started" },
  {
    id: 3,
    timestamp: "2024-01-15 13:45",
    status: "Entry Code Created",
    message: "New entry code AIV-2024-005 generated",
  },
  {
    id: 4,
    timestamp: "2024-01-15 12:30",
    status: "Evaluation Completed",
    message: "Participant Park Jiyeon completed evaluation",
  },
  { id: 5, timestamp: "2024-01-15 11:20", status: "Room Started", message: "Test session AIV-2024-002 started" },
]

function getStatusColor(status: string) {
  switch (status) {
    case "Room Started":
      return "bg-purple-500"
    case "Evaluation Completed":
      return "bg-green-500"
    case "Entry Code Created":
      return "bg-blue-500"
    case "Room Ended":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function DashboardContent() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Section 2: Top Header Bar - distinct horizontal section */}
      <header className="flex h-[88px] items-center border-b border-[#E5E5E5] bg-white px-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Admin dashboard</h1>
      </header>

      {/* Section 3: Main Content Panel - separate content area */}
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* 1) Metric Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total Participants */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Participants</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">248</p>
            <p className="mt-1 text-xs text-gray-400">Last 7 days</p>
          </div>

          {/* Completed Evaluations */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Completed Evaluations</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">186</p>
            <p className="mt-1 text-xs text-gray-400">75% completion rate</p>
          </div>

          {/* Average Prompt Score */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Average Prompt Score</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">78.5</p>
            <p className="mt-1 text-xs text-gray-400">+2.3 from last week</p>
          </div>

          {/* Active Test Sessions */}
          <div className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <Play className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active Test Sessions</span>
            </div>
            <p className="mt-6 text-4xl font-bold text-gray-900">4</p>
            <p className="mt-1 text-xs text-gray-400">Currently in progress</p>
          </div>
        </div>

        {/* 2) Recent Activity */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Recent Activity</h2>
              <p className="text-sm text-gray-400">Latest system events and actions</p>
            </div>
            <Link
              href="/admin/logs"
              className="flex items-center gap-1 text-[13px] font-normal text-blue-600 transition-all hover:text-blue-700 hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6">
            {recentActivity.length > 0 ? (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-gray-200" />

                <div className="space-y-5">
                  {recentActivity.map((event, index) => (
                    <div key={event.id} className="flex items-start gap-3 pl-6 relative">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${getStatusColor(event.status)}`} />

                      {/* Content */}
                      <div className="flex flex-1 items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">{event.status}</span>
                          <span className="text-sm text-gray-500">{event.message}</span>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{event.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No recent activity.</p>
            )}
          </div>
        </div>

        {/* 3) Quick Actions */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm -mt-3">
          <h2 className="text-lg font-semibold text-gray-700">Quick Actions</h2>
          <p className="text-sm text-gray-400">Frequently used admin functions</p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              href="/admin/entry-codes"
              className="flex items-center gap-2 rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2563EB]"
            >
              <Plus className="h-4 w-4" />
              Create Entry Code
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              View Participants
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4" />
              Open Analytics
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
