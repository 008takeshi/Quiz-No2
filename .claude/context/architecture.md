# アーキテクチャ設計

## システム概要

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (SPA)                          │
│                   React + Vite + TailwindCSS                │
├──────────────────┬──────────────────┬───────────────────────┤
│  ホスト画面       │  プレイヤー画面   │  共有画面             │
│  /host/*         │  /play/*         │  /display/*          │
│  (PC/タブレット)  │  (スマートフォン)  │  (プロジェクター)      │
└────────┬─────────┴────────┬─────────┴──────────┬───────────┘
         │                  │                     │
         │         WebSocket (Socket.io-client)   │
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            ▼
         ┌──────────────────────────────┐
         │      Backend Server          │
         │      Node.js + Express       │
         │      Socket.io Server        │
         └───────────┬──────────────────┘
                     │
                     ▼
         ┌──────────────────────────────┐
         │       Data Store             │
         │    Redis / In-Memory         │
         │   (ゲームセッション管理)       │
         └──────────────────────────────┘
```

## フロントエンド構成

### ディレクトリ構造

```
client/
├── src/
│   ├── pages/              # ページコンポーネント
│   │   ├── host/           # ホスト画面
│   │   │   ├── index.tsx   # ホームページ
│   │   │   ├── Room.tsx    # ルーム管理画面
│   │   │   └── Results.tsx # 結果集計画面
│   │   ├── player/         # プレイヤー画面
│   │   │   ├── index.tsx   # 参加画面
│   │   │   ├── Lobby.tsx   # 待機画面
│   │   │   └── Quiz.tsx    # 回答画面
│   │   └── display/        # 共有画面
│   │       ├── index.tsx   # 接続画面
│   │       ├── Lobby.tsx   # 待機画面
│   │       ├── Question.tsx # 問題表示
│   │       └── Results.tsx # 結果表示
│   ├── components/         # 共通コンポーネント
│   │   ├── common/         # 汎用コンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Timer.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── quiz/           # クイズ関連
│   │   │   ├── QuizCard.tsx
│   │   │   ├── ChoiceButton.tsx
│   │   │   └── ResultChart.tsx
│   │   └── room/           # ルーム関連
│   │       ├── PlayerList.tsx
│   │       ├── RoomCode.tsx
│   │       └── Leaderboard.tsx
│   ├── hooks/              # カスタムフック
│   │   ├── useSocket.ts    # WebSocket管理
│   │   ├── useGameRoom.ts  # ゲームルーム状態
│   │   ├── useQuiz.ts      # クイズ状態
│   │   └── useTimer.ts     # タイマー管理
│   ├── store/              # 状態管理（Zustand）
│   │   ├── gameStore.ts    # ゲーム全体の状態
│   │   ├── playerStore.ts  # プレイヤー情報
│   │   └── quizStore.ts    # クイズ状態
│   ├── services/           # ビジネスロジック
│   │   ├── socket.ts       # Socket.io設定
│   │   ├── api.ts          # API通信
│   │   └── storage.ts      # LocalStorage管理
│   ├── types/              # 型定義
│   │   ├── game.ts
│   │   ├── player.ts
│   │   ├── quiz.ts
│   │   └── events.ts
│   ├── utils/              # ユーティリティ
│   │   ├── validation.ts   # バリデーション
│   │   ├── format.ts       # フォーマット
│   │   └── constants.ts    # 定数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### 状態管理（Zustand）

```typescript
// store/gameStore.ts
interface GameState {
  roomId: string | null;
  status: GameStatus;
  players: Player[];
  currentQuiz: Quiz | null;
  results: QuizResult[];

  // アクション
  setRoomId: (roomId: string) => void;
  setStatus: (status: GameStatus) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setCurrentQuiz: (quiz: Quiz) => void;
  addResult: (result: QuizResult) => void;
  reset: () => void;
}
```

### カスタムフック

```typescript
// hooks/useSocket.ts
const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_WS_URL);

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, connected };
};

// hooks/useGameRoom.ts
const useGameRoom = (roomId: string) => {
  const { socket } = useSocket();
  const { players, setPlayers, setStatus } = useGameStore();

  useEffect(() => {
    if (!socket) return;

    socket.on('playerJoined', (data) => {
      setPlayers([...players, data.player]);
    });

    socket.on('playerLeft', (data) => {
      setPlayers(players.filter(p => p.id !== data.playerId));
    });

    socket.on('roomState', (data) => {
      setPlayers(data.players);
      setStatus(data.status);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('roomState');
    };
  }, [socket, players]);

  return { players };
};
```

## バックエンド構成

### ディレクトリ構造

```
server/
├── src/
│   ├── index.ts            # エントリーポイント
│   ├── server.ts           # Expressサーバー設定
│   ├── socket.ts           # Socket.ioサーバー設定
│   ├── game/               # ゲームロジック
│   │   ├── GameRoom.ts     # ルーム管理クラス
│   │   ├── Player.ts       # プレイヤークラス
│   │   ├── Quiz.ts         # クイズクラス
│   │   └── ScoreCalculator.ts # 得点計算
│   ├── handlers/           # イベントハンドラ
│   │   ├── roomHandlers.ts # ルーム関連
│   │   ├── quizHandlers.ts # クイズ関連
│   │   └── playerHandlers.ts # プレイヤー関連
│   ├── services/           # サービス層
│   │   ├── RoomService.ts  # ルーム管理サービス
│   │   ├── QuizService.ts  # クイズ管理サービス
│   │   └── StorageService.ts # データストア
│   ├── types/              # 型定義
│   │   ├── game.ts
│   │   ├── player.ts
│   │   ├── quiz.ts
│   │   └── events.ts
│   ├── utils/              # ユーティリティ
│   │   ├── validation.ts   # バリデーション
│   │   ├── generator.ts    # ID生成
│   │   └── logger.ts       # ロギング
│   └── constants/          # 定数
│       └── config.ts
├── package.json
└── tsconfig.json
```

### クラス設計

```typescript
// game/GameRoom.ts
class GameRoom {
  id: string;
  hostId: string;
  players: Map<string, Player>;
  status: GameStatus;
  currentQuiz: Quiz | null;
  quizHistory: QuizResult[];
  settings: GameSettings;
  createdAt: Date;
  lastActivity: Date;

  constructor(hostId: string, settings?: Partial<GameSettings>) {
    this.id = generateRoomId();
    this.hostId = hostId;
    this.players = new Map();
    this.status = 'waiting';
    this.currentQuiz = null;
    this.quizHistory = [];
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addPlayer(player: Player): void {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('ROOM_FULL');
    }
    this.players.set(player.id, player);
    this.lastActivity = new Date();
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.lastActivity = new Date();
  }

  startQuiz(quiz: Quiz): void {
    if (this.status !== 'waiting') {
      throw new Error('INVALID_STATUS');
    }
    this.currentQuiz = quiz;
    this.status = 'answering';
    this.lastActivity = new Date();
  }

  endQuiz(): QuizResult {
    if (!this.currentQuiz) {
      throw new Error('NO_ACTIVE_QUIZ');
    }

    const result = ScoreCalculator.calculate(this.currentQuiz, this.players);
    this.quizHistory.push(result);
    this.currentQuiz = null;
    this.status = 'result';
    this.lastActivity = new Date();

    return result;
  }
}

// game/ScoreCalculator.ts
class ScoreCalculator {
  static calculate(quiz: Quiz, players: Map<string, Player>): QuizResult {
    // 各選択肢の得票数をカウント
    const voteCounts = [0, 0, 0, 0];
    quiz.answers.forEach(answer => {
      voteCounts[answer.choice]++;
    });

    // 順位付け
    const rankings = this.rankChoices(voteCounts, quiz.correctAnswer);

    // 各プレイヤーの得点計算
    const playerResults = Array.from(quiz.answers.entries()).map(([playerId, answer]) => {
      const points = this.calculatePlayerPoints(answer.choice, quiz.correctAnswer, rankings);
      const player = players.get(playerId)!;
      player.score += points;

      return {
        playerId,
        playerName: player.name,
        choice: answer.choice,
        earnedPoints: points,
        totalScore: player.score
      };
    });

    return {
      quizId: quiz.id,
      question: quiz.question,
      choices: quiz.choices,
      correctAnswer: quiz.correctAnswer,
      voteCounts,
      rankings,
      playerResults
    };
  }

  private static rankChoices(voteCounts: number[], correctAnswer: number): ChoiceRanking[] {
    // 得票数で順位付け
    const withIndex = voteCounts.map((votes, index) => ({ choice: index, votes }));
    withIndex.sort((a, b) => b.votes - a.votes);

    return withIndex.map((item, index) => ({
      choice: item.choice,
      votes: item.votes,
      rank: index + 1,
      isCorrect: item.choice === correctAnswer,
      points: this.getPointsForRank(index + 1, item.choice === correctAnswer)
    }));
  }

  private static getPointsForRank(rank: number, isCorrect: boolean): number {
    if (rank === 2 && isCorrect) return 3;
    if (isCorrect) return 1;
    if (rank === 2) return 2;
    return 0;
  }

  private static calculatePlayerPoints(
    choice: number,
    correctAnswer: number,
    rankings: ChoiceRanking[]
  ): number {
    const ranking = rankings.find(r => r.choice === choice);
    return ranking?.points ?? 0;
  }
}
```

### イベントハンドラ

```typescript
// handlers/roomHandlers.ts
export const registerRoomHandlers = (io: Server, socket: Socket) => {
  socket.on('createRoom', (data: CreateRoomRequest) => {
    try {
      const { hostName, settings } = data;

      // バリデーション
      if (!validatePlayerName(hostName)) {
        socket.emit('error', { code: 'INVALID_PLAYER_NAME', message: 'Invalid host name' });
        return;
      }

      // ルーム作成
      const room = RoomService.createRoom(socket.id, hostName, settings);

      // ソケットをルームに参加
      socket.join(room.id);

      // レスポンス
      socket.emit('roomCreated', {
        roomId: room.id,
        hostId: socket.id,
        hostName,
        settings: room.settings
      });

      logger.info(`Room created: ${room.id} by ${hostName}`);
    } catch (error) {
      socket.emit('error', { code: 'INTERNAL_ERROR', message: error.message });
    }
  });

  socket.on('joinRoom', (data: JoinRoomRequest) => {
    try {
      const { roomId, playerName } = data;

      // バリデーション
      if (!validateRoomId(roomId)) {
        socket.emit('error', { code: 'INVALID_ROOM_ID', message: 'Invalid room ID' });
        return;
      }

      if (!validatePlayerName(playerName)) {
        socket.emit('error', { code: 'INVALID_PLAYER_NAME', message: 'Invalid player name' });
        return;
      }

      // プレイヤーを追加
      const player = RoomService.addPlayer(roomId, socket.id, playerName);

      // ソケットをルームに参加
      socket.join(roomId);

      // 本人にレスポンス
      socket.emit('roomJoined', {
        roomId,
        playerId: socket.id,
        playerName
      });

      // ルーム全体に通知
      io.to(roomId).emit('playerJoined', {
        player: {
          id: player.id,
          name: player.name,
          score: player.score,
          isHost: player.isHost
        },
        totalPlayers: RoomService.getPlayerCount(roomId)
      });

      // 現在のルーム状態を送信
      const roomState = RoomService.getRoomState(roomId);
      socket.emit('roomState', roomState);

      logger.info(`Player ${playerName} joined room ${roomId}`);
    } catch (error) {
      if (error.message === 'ROOM_NOT_FOUND') {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      } else if (error.message === 'ROOM_FULL') {
        socket.emit('error', { code: 'ROOM_FULL', message: 'Room is full' });
      } else {
        socket.emit('error', { code: 'INTERNAL_ERROR', message: error.message });
      }
    }
  });

  socket.on('disconnect', () => {
    try {
      const roomId = RoomService.findRoomByPlayerId(socket.id);
      if (roomId) {
        const player = RoomService.removePlayer(roomId, socket.id);

        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          playerName: player.name,
          totalPlayers: RoomService.getPlayerCount(roomId)
        });

        logger.info(`Player ${player.name} left room ${roomId}`);
      }
    } catch (error) {
      logger.error('Error handling disconnect:', error);
    }
  });
};
```

## データフロー

### 1. ルーム作成フロー

```
Host                    Server                     Store
  │                       │                          │
  │   createRoom          │                          │
  ├──────────────────────►│                          │
  │                       │  generateRoomId()        │
  │                       │  new GameRoom()          │
  │                       ├─────────────────────────►│
  │                       │                          │
  │   roomCreated         │                          │
  │◄──────────────────────┤                          │
  │   { roomId: "ABC123" }│                          │
```

### 2. クイズ出題・回答フロー

```
Host              Server              Players           Display
  │                 │                    │                │
  │  startQuiz      │                    │                │
  ├────────────────►│                    │                │
  │                 │  quizStarted       │                │
  │                 ├───────────────────►│                │
  │                 ├────────────────────────────────────►│
  │                 │                    │                │
  │                 │  submitAnswer      │                │
  │                 │◄───────────────────┤                │
  │                 │  answerReceived    │                │
  │                 ├───────────────────►│                │
  │  answerCount    │  answerCount       │                │
  │◄────────────────┤────────────────────────────────────►│
  │                 │                    │                │
  │                 │  [timeout]         │                │
  │                 │  calculate()       │                │
  │                 │                    │                │
  │  quizResult     │  quizResult        │  quizResult    │
  │◄────────────────┼───────────────────►┼───────────────►│
```

## セキュリティ

### 入力検証

```typescript
// utils/validation.ts
export const validatePlayerName = (name: string): boolean => {
  return (
    name.length >= 1 &&
    name.length <= 20 &&
    /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/.test(name)
  );
};

export const validateRoomId = (roomId: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(roomId);
};

export const validateChoice = (choice: number): boolean => {
  return Number.isInteger(choice) && choice >= 0 && choice <= 3;
};
```

### レート制限

```typescript
// services/RateLimiter.ts
class RateLimiter {
  private limits: Map<string, number> = new Map();

  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const lastRequest = this.limits.get(key) || 0;

    if (now - lastRequest < windowMs) {
      return false; // レート制限超過
    }

    this.limits.set(key, now);
    return true;
  }
}

// 使用例
const rateLimiter = new RateLimiter();

socket.on('createRoom', (data) => {
  const ip = socket.handshake.address;

  if (!rateLimiter.check(`create-${ip}`, 1, 5 * 60 * 1000)) {
    socket.emit('error', {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many room creation requests'
    });
    return;
  }

  // ルーム作成処理
});
```

## パフォーマンス最適化

### メモリ管理

```typescript
// 非アクティブなルームの自動削除
const ROOM_TIMEOUT = 60 * 60 * 1000; // 1時間

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of RoomService.getAllRooms()) {
    if (now - room.lastActivity.getTime() > ROOM_TIMEOUT) {
      RoomService.deleteRoom(roomId);
      logger.info(`Room ${roomId} deleted due to inactivity`);
    }
  }
}, 10 * 60 * 1000); // 10分ごとにチェック
```

### ブロードキャスト最適化

```typescript
// 特定のルームにのみブロードキャスト
io.to(roomId).emit('quizResult', result);

// 送信者を除くルームメンバーにブロードキャスト
socket.to(roomId).emit('playerJoined', playerData);

// 圧縮を有効化
const io = new Server(server, {
  perMessageDeflate: true
});
```
