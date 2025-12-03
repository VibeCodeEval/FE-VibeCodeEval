"use client"

import { Server, Database, Cpu, Wifi, Activity, HardDrive, Users } from "lucide-react"

const servicesData = [
  { id: 1, name: "API Server", icon: Server, latency: "45ms", status: "Operational" },
  { id: 2, name: "Database", icon: Database, latency: "12ms", status: "Operational" },
  { id: 3, name: "AI Gateway", icon: Cpu, latency: "230ms", status: "Operational" },
  { id: 4, name: "WebSocket", icon: Wifi, latency: "8ms", status: "Operational" },
]

const metricsData = [
  { id: 1, label: "CPU Usage", value: "34%", icon: Activity },
  { id: 2, label: "Memory", value: "2.4 GB / 8 GB", icon: HardDrive },
  { id: 3, label: "Active Connections", value: "4", icon: Users },
]

export function ServerStatusContent() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="shrink-0 px-8 py-6 border-b border-[#E5E5E5] bg-white">
        <h1 className="text-2xl font-semibold text-[#111111]">Server Status</h1>
        <p className="text-sm text-[#6B7280] mt-1">System health and performance</p>
      </div>

      {/* Main Content Section */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white border border-[#E5E5E5] rounded-xl px-12 py-6">
          {/* Services Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-4">Services</h2>
            <div className="flex flex-col gap-3">
              {servicesData.map((service) => {
                const IconComponent = service.icon
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between px-5 py-4 bg-white border border-[#E5E5E5] rounded-lg"
                  >
                    {/* Left: Icon + Name */}
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-[#6B7280]" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-[#111111]">{service.name}</span>
                    </div>

                    {/* Right: Latency + Status */}
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-[#6B7280]">{service.latency}</span>
                      <span className="px-3 py-1 text-xs font-medium text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-full">
                        {service.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* System Metrics Section */}
          <div>
            <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wide mb-4">System Metrics</h2>
            <div className="flex flex-col gap-3">
              {metricsData.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between px-5 py-4 bg-white border border-[#E5E5E5] rounded-lg"
                  >
                    {/* Left: Icon + Label */}
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-[#6B7280]" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-[#111111]">{metric.label}</span>
                    </div>

                    {/* Right: Value */}
                    <span className="text-sm font-semibold text-[#111111]">{metric.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
