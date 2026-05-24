import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../types/events';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Socket.IO接続を作成
 */
export function createSocket(): TypedSocket {
  const socket: TypedSocket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to server:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Disconnected from server:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
}
