import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useExamSessionStore } from '@/lib/stores/exam-session-store';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

interface SendMessageResponse {
  sessionId: number;
  turnId: number | undefined; // BE는 @JsonProperty("turn")으로 직렬화하므로 "turn" 키로 옴
  turn: number | undefined;   // BE JSON 실제 키
  role: string;
  content: string;
  tokenCount: number | null;
  totalCount: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/** JWT 만료 여부 확인 (클라이언트 사이드) */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function useChatSocket(
  examId: number,
  participantId: number,
  onMessageReceived: (message: Message, response: SendMessageResponse) => void,
  onError?: (message: string) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  // 셀렉터로 구독: accessToken 변경 시 effect 재실행 → 로그인 후 소켓 연결 보장
  const accessToken = useExamSessionStore((state) => state.accessToken);

  // 콜백을 ref로 관리: 최신 함수 참조를 유지하면서 STOMP 재연결을 방지
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onErrorRef = useRef(onError);
  useEffect(() => { onMessageReceivedRef.current = onMessageReceived; }, [onMessageReceived]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    // STOMP CONNECT 시 JWT를 헤더로 전달해 서버 Principal(userId) 설정을 가능하게 함
    // BE의 StompPrincipalInterceptor가 이 토큰을 파싱해 participantId를 Principal로 등록
    // → convertAndSendToUser(participantId, "/queue/chat", response) 라우팅이 정상 동작
    const token = accessToken;

    // 만료된 토큰으로 연결 시 Principal이 설정되지 않아 convertAndSendToUser가 무음 실패함
    if (!token || isTokenExpired(token)) {
      console.warn('[STOMP Chat] JWT 토큰이 없거나 만료됨 - 재로그인 필요');
      onErrorRef.current?.('세션이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP Chat] ' + str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('[STOMP Chat] Connected: ' + frame);
      setIsConnected(true);

      // 에러 큐 구독 - BE에서 처리 실패 시 로딩 해제용
      client.subscribe(`/user/queue/chat-error`, (message) => {
        try {
          const err = JSON.parse(message.body);
          console.error('[STOMP Chat] 서버 에러:', err.message);
          onErrorRef.current?.(err.message ?? 'AI 응답 처리 중 오류가 발생했습니다.');
        } catch {
          onErrorRef.current?.('AI 응답 처리 중 오류가 발생했습니다.');
        }
      });

      // 개인 큐 구독
      client.subscribe(`/user/queue/chat`, (message) => {
        try {
          const response: SendMessageResponse = JSON.parse(message.body);
          // BE는 @JsonProperty("turn")으로 직렬화 → "turn" 키로 옴, "AI" role 정규화
          const role = response.role?.toLowerCase();
          const normalizedRole: 'assistant' | 'user' =
            role === 'user' ? 'user' : 'assistant';
          const newMessage: Message = {
            id: Date.now(),
            role: normalizedRole,
            content: response.content,
          };
          onMessageReceivedRef.current(newMessage, response);
        } catch (err) {
          console.error('[STOMP Chat] 메시지 처리 실패:', err, message.body);
        }
      });
    };

    client.onDisconnect = () => {
      console.log('[STOMP Chat] Disconnected');
      setIsConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('[STOMP Chat] Error: ' + frame.headers['message']);
      console.error('[STOMP Chat] Details: ' + frame.body);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [examId, participantId, accessToken]); // 콜백은 ref로 관리하므로 deps에서 제거; accessToken 변경 시 재연결

  const sendMessage = useCallback((content: string, turn: number) => {
    if (stompClientRef.current && isConnected) {
      const payload = {
        examId,
        participantId,
        turn,
        role: 'USER',
        content,
      };

      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
      
      return true;
    }
    return false;
  }, [examId, participantId, isConnected]);

  return { isConnected, sendMessage };
}
