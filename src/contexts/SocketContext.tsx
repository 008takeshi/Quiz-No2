import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { TypedSocket } from '../lib/socket';

// ロールの型定義
export type Role = 'host' | 'player' | 'display';

interface SocketContextValue {
  socket: TypedSocket | null;
  setSocket: (socket: TypedSocket | null) => void;
  roomId: string | null;
  setRoomId: (roomId: string | null) => void;
  roomCode: string | null;
  setRoomCode: (roomCode: string | null) => void;
  playerName: string | null;
  setPlayerName: (name: string | null) => void;
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  role: Role;
  clearStorage: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// LocalStorageのキー（ホスト、プレイヤー、共有画面で完全に分離）
const STORAGE_KEYS = {
  host: {
    ROOM_ID: 'quize_host_room_id',
    ROOM_CODE: 'quize_host_room_code',
    PLAYER_NAME: 'quize_host_player_name',
    PLAYER_ID: 'quize_host_player_id',
  },
  player: {
    ROOM_ID: 'quize_player_room_id',
    ROOM_CODE: 'quize_player_room_code',
    PLAYER_NAME: 'quize_player_player_name',
    PLAYER_ID: 'quize_player_player_id',
  },
  display: {
    ROOM_ID: 'quize_display_room_id',
    ROOM_CODE: 'quize_display_room_code',
    PLAYER_NAME: 'quize_display_player_name',
    PLAYER_ID: 'quize_display_player_id',
  },
};

interface SocketProviderProps {
  children: ReactNode;
  role: Role;
}

export function SocketProvider({ children, role }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);

  // 現在のロールに対応するストレージキーを取得
  const keys = STORAGE_KEYS[role];

  // playerはsessionStorage（タブごとに独立）、それ以外はlocalStorage
  const storage = role === 'player' ? sessionStorage : localStorage;

  // Storageから初期値を読み込み（ロール固定）
  const [roomId, setRoomIdState] = useState<string | null>(() => {
    return storage.getItem(keys.ROOM_ID);
  });

  const [roomCode, setRoomCodeState] = useState<string | null>(() => {
    return storage.getItem(keys.ROOM_CODE);
  });

  const [playerName, setPlayerNameState] = useState<string | null>(() => {
    return storage.getItem(keys.PLAYER_NAME);
  });

  const [playerId, setPlayerIdState] = useState<string | null>(() => {
    return storage.getItem(keys.PLAYER_ID);
  });

  // Storageに保存する関数（ロール固定）
  const setRoomId = (id: string | null) => {
    setRoomIdState(id);
    if (id) {
      storage.setItem(keys.ROOM_ID, id);
    } else {
      storage.removeItem(keys.ROOM_ID);
    }
  };

  const setRoomCode = (code: string | null) => {
    setRoomCodeState(code);
    if (code) {
      storage.setItem(keys.ROOM_CODE, code);
    } else {
      storage.removeItem(keys.ROOM_CODE);
    }
  };

  const setPlayerName = (name: string | null) => {
    setPlayerNameState(name);
    if (name) {
      storage.setItem(keys.PLAYER_NAME, name);
    } else {
      storage.removeItem(keys.PLAYER_NAME);
    }
  };

  const setPlayerId = (id: string | null) => {
    setPlayerIdState(id);
    if (id) {
      storage.setItem(keys.PLAYER_ID, id);
    } else {
      storage.removeItem(keys.PLAYER_ID);
    }
  };

  // このロールのストレージをクリアする関数
  const clearStorage = () => {
    storage.removeItem(keys.ROOM_ID);
    storage.removeItem(keys.ROOM_CODE);
    storage.removeItem(keys.PLAYER_NAME);
    storage.removeItem(keys.PLAYER_ID);
    setRoomIdState(null);
    setRoomCodeState(null);
    setPlayerNameState(null);
    setPlayerIdState(null);
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        setSocket,
        roomId,
        setRoomId,
        roomCode,
        setRoomCode,
        playerName,
        setPlayerName,
        playerId,
        setPlayerId,
        role,
        clearStorage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
