import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const createStompClient = (onConnect: () => void, onDisconnect: () => void) => {
  const socket = new SockJS(`${API_BASE_URL}/ws`);
  const client = new Client({
    webSocketFactory: () => socket,
    debug: (str) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP] ' + str);
      }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  client.onConnect = onConnect;
  client.onDisconnect = onDisconnect;

  return client;
};
