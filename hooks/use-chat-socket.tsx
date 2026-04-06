import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

interface SendMessageResponse {
  sessionId: number;
  turnId: number;
  role: string;
  content: string;
  tokenCount: number | null;
  totalCount: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export function useChatSocket(
  examId: number,
  participantId: number,
  onMessageReceived: (message: Message, response: SendMessageResponse) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // STOMP CONNECT 시 JWT를 헤더로 전달해 서버 Principal(userId) 설정을 가능하게 함
    // BE의 StompPrincipalInterceptor가 이 토큰을 파싱해 participantId를 Principal로 등록
    // → convertAndSendToUser(participantId, "/queue/chat", response) 라우팅이 정상 동작
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;

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

      // 개인 큐 구독
      client.subscribe(`/user/queue/chat`, (message) => {
        const response: SendMessageResponse = JSON.parse(message.body);
        const newMessage: Message = {
          id: Date.now(),
          role: response.role.toLowerCase() as 'assistant' | 'user',
          content: response.content,
        };
        onMessageReceived(newMessage, response);
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
  }, [examId, participantId, onMessageReceived]);

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
