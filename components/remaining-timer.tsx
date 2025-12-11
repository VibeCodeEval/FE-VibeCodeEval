"use client"

import { useState, useEffect, useRef } from "react"

type RemainingTimerProps = {
  endAt: string;        // 종료 시각 (ISO 문자열, 예: "2025-12-10T16:00:00Z")
  onTimeOver?: () => void; // 남은 시간이 0이 되는 순간 한 번 호출될 콜백 (선택)
}

export function RemainingTimer({ endAt, onTimeOver }: RemainingTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const onTimeOverCalledRef = useRef(false)

  useEffect(() => {
    // endAt을 timestamp로 변환
    const endTimestamp = new Date(endAt).getTime()
    
    // 현재 시각과 비교하여 남은 시간 계산
    const calculateRemaining = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTimestamp - now) / 1000))
      return remaining
    }

    // 초기 계산
    const initialRemaining = calculateRemaining()
    setRemainingSeconds(initialRemaining)

    // 이미 시간이 지났다면 즉시 처리
    if (initialRemaining <= 0 && !onTimeOverCalledRef.current && onTimeOver) {
      onTimeOverCalledRef.current = true
      onTimeOver()
    }

    // 1초마다 갱신
    const intervalId = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingSeconds(remaining)

      // 남은 시간이 0 이하가 되면
      if (remaining <= 0) {
        clearInterval(intervalId)
        
        // onTimeOver 콜백이 있고 아직 호출하지 않았다면 한 번만 호출
        if (!onTimeOverCalledRef.current && onTimeOver) {
          onTimeOverCalledRef.current = true
          onTimeOver()
        }
      }
    }, 1000)

    // cleanup 함수에서 interval 정리
    return () => {
      clearInterval(intervalId)
    }
  }, [endAt, onTimeOver])

  // HH:MM:SS 형식으로 포맷팅
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <span className="font-mono text-xl text-[#2563EB] font-bold">
      {formatTime(remainingSeconds)}
    </span>
  )
}

