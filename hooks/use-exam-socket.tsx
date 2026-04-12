import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '@/lib/auth/cookie-utils';

export type ExamState = 'WAITING' | 'RUNNING' | 'ENDED';

export interface ExamStateEvent {
  examId: number;
  state: ExamState;
  startsAt: string;
  endsAt: string;
  version: number;
  serverTime: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 시험 상태 변경 WebSocket 구독 훅
 *
 * BE의 StartExamUseCase / EndExamUseCase / ExtendExamUseCase가
 * /topic/exam/{examId} 로 ExamStateEvent를 브로드캐스트할 때 수신.
 *
 * REST 폴링(5초)과 병행 사용하여 신뢰성을 높임:
 * - WebSocket 이벤트: 실시간 반응 (< 100ms)
 * - 폴링: WebSocket 단절 시 최대 5초 내 복구
 */
export function useExamSocket(
  examId: number | null,
  onExamStateChange: (event: ExamStateEvent) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const onExamStateChangeRef = useRef(onExamStateChange);

  // 최신 콜백 참조 유지 (의존성 무한 루프 방지)
  useEffect(() => {
    onExamStateChangeRef.current = onExamStateChange;
  }, [onExamStateChange]);

  useEffect(() => {
    if (!examId) return;

    const token = getCookie('user_access_token');

    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP Exam] ' + str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[STOMP Exam] Connected. Subscribing to /topic/exam/${examId}`);
      }

      client.subscribe(`/topic/exam/${examId}`, (message) => {
        try {
          const event: ExamStateEvent = JSON.parse(message.body);
          if (process.env.NODE_ENV === 'development') {
            console.log('[STOMP Exam] State event received:', event);
          }
          onExamStateChangeRef.current(event);
        } catch (e) {
          console.error('[STOMP Exam] Failed to parse exam state event:', e);
        }
      });
    };

    client.onDisconnect = () => {
      setIsConnected(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP Exam] Disconnected');
      }
    };

    client.onStompError = (frame) => {
      console.error('[STOMP Exam] Error:', frame.headers['message']);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      stompClientRef.current?.deactivate();
    };
  }, [examId]);

  return { isConnected };
}
