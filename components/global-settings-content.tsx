"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type Settings = {
  defaultTestDuration: string
  defaultTokenLimit: string
  logRetentionPeriod: string
  submissionStoragePeriod: string
  autoDeleteExpiredData: boolean
  lastUpdated?: string
}

const STORAGE_KEY = "ai-vibe-global-settings"

const defaultSettings: Settings = {
  defaultTestDuration: "60",
  defaultTokenLimit: "10000",
  logRetentionPeriod: "90 days",
  submissionStoragePeriod: "90 days",
  autoDeleteExpiredData: true,
}

export function GlobalSettingsContent() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Settings
        setSettings(parsed)
        setSavedSettings(parsed)
      }
    } catch (e) {
      // If parsing fails, use defaults
    }
    setIsLoaded(true)
  }, [])

  const isDirty =
    settings.defaultTestDuration !== savedSettings.defaultTestDuration ||
    settings.defaultTokenLimit !== savedSettings.defaultTokenLimit ||
    settings.logRetentionPeriod !== savedSettings.logRetentionPeriod ||
    settings.submissionStoragePeriod !== savedSettings.submissionStoragePeriod ||
    settings.autoDeleteExpiredData !== savedSettings.autoDeleteExpiredData

  const handleSave = () => {
    const duration = Number.parseInt(settings.defaultTestDuration)
    const tokenLimit = Number.parseInt(settings.defaultTokenLimit)

    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Test duration must be a positive number.",
        variant: "destructive",
      })
      return
    }

    if (isNaN(tokenLimit) || tokenLimit <= 0) {
      toast({
        title: "Invalid Token Limit",
        description: "Token limit must be a positive number.",
        variant: "destructive",
      })
      return
    }

    const updatedSettings: Settings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
    setSettings(updatedSettings)
    setSavedSettings(updatedSettings)

    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    })
  }

  const handleCancel = () => {
    setSettings(savedSettings)
  }

  const formatLastUpdated = (isoString?: string) => {
    if (!isoString) return null
    const date = new Date(isoString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Don't render until localStorage is loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] p-6 gap-4">
      {/* Page Header */}
      <div className="mb-2">
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1A1A1A",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            lineHeight: "32px",
          }}
        >
          Global Settings
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6B7280",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            marginTop: "4px",
          }}
        >
          Manage platform-wide configuration and system security policies
        </p>
      </div>

      {/* Settings Cards Container */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Section 1: Test Configuration */}
        <Card className="border border-[#E5E5E5] shadow-sm">
          <CardHeader className="py-4 px-6">
            <CardTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Test Configuration
            </CardTitle>
            <CardDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Configure default test parameters for all evaluations.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Test Duration */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="test-duration"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  }}
                >
                  Default Test Duration
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="test-duration"
                    type="number"
                    value={settings.defaultTestDuration}
                    onChange={(e) => setSettings({ ...settings, defaultTestDuration: e.target.value })}
                    className="flex-1"
                    style={{
                      fontSize: "14px",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Minutes
                  </span>
                </div>
              </div>

              {/* Default Token Limit */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="token-limit"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  }}
                >
                  Default Token Limit
                </Label>
                <Input
                  id="token-limit"
                  type="number"
                  value={settings.defaultTokenLimit}
                  onChange={(e) => setSettings({ ...settings, defaultTokenLimit: e.target.value })}
                  style={{
                    fontSize: "14px",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Data Retention */}
        <Card className="border border-[#E5E5E5] shadow-sm">
          <CardHeader className="py-4 px-6">
            <CardTitle
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#1A1A1A",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Data Retention
            </CardTitle>
            <CardDescription
              style={{
                fontSize: "14px",
                color: "#6B7280",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Manage how long platform records are stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex flex-col gap-6">
              {/* Two column dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Log Retention Period */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="log-retention"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    Log Retention Period
                  </Label>
                  <Select
                    value={settings.logRetentionPeriod}
                    onValueChange={(value) => setSettings({ ...settings, logRetentionPeriod: value })}
                  >
                    <SelectTrigger
                      id="log-retention"
                      className="w-full"
                      style={{
                        fontSize: "14px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 days">30 days</SelectItem>
                      <SelectItem value="90 days">90 days</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submission Storage Period */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="submission-storage"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    Submission Storage Period
                  </Label>
                  <Select
                    value={settings.submissionStoragePeriod}
                    onValueChange={(value) => setSettings({ ...settings, submissionStoragePeriod: value })}
                  >
                    <SelectTrigger
                      id="submission-storage"
                      className="w-full"
                      style={{
                        fontSize: "14px",
                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                      }}
                    >
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 days">30 days</SelectItem>
                      <SelectItem value="90 days">90 days</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-Delete Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="auto-delete"
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1A1A1A",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    Auto-Delete Expired Data
                  </Label>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#6B7280",
                      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    }}
                  >
                    Automatically remove data after retention period.
                  </span>
                </div>
                <Switch
                  id="auto-delete"
                  checked={settings.autoDeleteExpiredData}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoDeleteExpiredData: checked })}
                  className="data-[state=checked]:bg-[#7C3AED]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col items-center gap-2 pt-4 pb-2">
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              paddingLeft: "24px",
              paddingRight: "24px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              backgroundColor: isDirty ? "#7C3AED" : undefined,
              paddingLeft: "24px",
              paddingRight: "24px",
            }}
            className={isDirty ? "hover:bg-[#6D28D9]" : ""}
          >
            Save Changes
          </Button>
        </div>
        {savedSettings.lastUpdated && (
          <span
            style={{
              fontSize: "12px",
              color: "#9CA3AF",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            }}
          >
            Last saved: {formatLastUpdated(savedSettings.lastUpdated)}
          </span>
        )}
      </div>
    </div>
  )
}
