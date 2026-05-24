# 技術仕様書（SPA版）

## システムアーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (3つのSPA)                        │
│              React + Vite (静的ホスティング)                 │
├──────────────────┬──────────────────┬───────────────────────┤
│  ホストSPA        │  プレイヤーSPA    │  共有画面SPA          │
│  /host           │  /play           │  /display/:roomCode  │
│  (PC/タブレット)  │  (スマートフォン)  │  (プロジェクター)      │
│                  │                  │                       │
│  状態管理で       │  状態管理で       │  状態管理で           │
│  表示を切り替え   │  表示を切り替え   │  表示を切り替え       │
│  ページ遷移なし   │  ページ遷移なし   │  ページ遷移なし       │
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
         │      In-Memory Map           │
         │   (ゲームセッション管理)       │
         └──────────────────────────────┘
```

### 3つのSPA構成

| SPA | URL | デバイス | 役割 | 特徴 |
|-----|-----|---------|------|------|
| ホストSPA | `/host` | PC/タブレット | ゲーム進行制御 | 単一URL、フェーズで表示切替 |
| プレイヤーSPA | `/play?room=CODE` | スマートフォン | 回答入力 | 単一URL、フェーズで表示切替 |
| 共有画面SPA | `/display/:roomCode` | プロジェクター | 問題・結果表示 | 単一URL、フェーズで表示切替 |

### SPA設計の利点

✅ **ページ遷移なし**: WebSocket接続が途切れない
✅ **再接続簡便**: リロード時も同じURLで状態復元
✅ **状態管理簡素化**: 1つのコンテキストで全フェーズ管理
✅ **静的ホスティング対応**: Vercel/Netlifyで簡単デプロイ
✅ **メンテナンス性**: コンポーネント単位で独立

---

## 技術スタック詳細

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UIフレームワーク |
| TypeScript | 5.x | 型安全性 |
| Vite | 5.x | ビルドツール（静的ホスティング対応） |
| Socket.io-client | 4.x | WebSocket通信 |
| React Router | 6.x | SPAルーティング（最小限） |
| React Context API | 18.x | 状態管理（グローバルステート） |

**Note**: TailwindCSSは使用せず、インラインスタイルまたはCSS Modulesを使用

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Node.js | 18.x+ | ランタイム |
| TypeScript | 5.x | 型安全性 |
| Socket.io | 4.x | WebSocketサーバー |
| Express | 4.x | HTTPサーバー |
| Redis | 7.x | セッションストア（オプション） |

### 開発ツール

| 技術 | 用途 |
|------|------|
| ESLint | コード品質 |
| Prettier | コードフォーマット |
| Vitest | ユニットテスト |
| tsx | TypeScript実行 |

---

## データモデル

### GameRoom（ゲームルーム）

```typescript
interface GameRoom {
  id: string;                    // ルームID（6桁の英数字）
  hostId: string;                // ホストのSocket ID
  hostName: string;              // ホスト名
  players: Map<string, Player>;  // プレイヤー一覧
  status: GameStatus;            // ゲーム状態
  currentQuiz: Quiz | null;      // 現在の問題
  quizHistory: QuizResult[];     // 過去の問題結果
  createdAt: Date;               // 作成日時
  settings: GameSettings;        // ゲーム設定
}

type GameStatus =
  | 'waiting'     // 待機中
  | 'playing'     // プレイ中
  | 'answering'   // 回答受付中
  | 'scoring'     // 採点中
  | 'result'      // 結果表示中
  | 'finished';   // 終了
```

### Player（プレイヤー）

```typescript
interface Player {
  id: string;           // Socket ID
  name: string;         // 表示名
  score: number;        // 累積スコア
  isHost: boolean;      // ホストかどうか
  isConnected: boolean; // 接続状態
  avatar?: string;      // アバターURL（将来実装）
  joinedAt: Date;       // 参加日時
}
```

### Quiz（クイズ）

```typescript
interface Quiz {
  id: string;                    // 問題ID
  question: string;              // 問題文
  choices: [string, string, string, string]; // 4択
  correctAnswer: number;         // 正解（0-3）
  timeLimit: number;             // 制限時間（秒）
  startedAt: Date;               // 開始時刻
  answers: Map<string, Answer>;  // 回答一覧
}

interface Answer {
  playerId: string;   // プレイヤーID
  choice: number;     // 選択肢（0-3）
  answeredAt: Date;   // 回答時刻
  timeTaken: number;  // 回答にかかった時間（ミリ秒）
}
```

### QuizResult（クイズ結果）

```typescript
interface QuizResult {
  quizId: string;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: number;
  voteCounts: [number, number, number, number]; // 各選択肢の得票数
  rankings: ChoiceRanking[];  // 順位付き
  playerResults: PlayerQuizResult[];
}

interface ChoiceRanking {
  choice: number;      // 選択肢
  votes: number;       // 得票数
  rank: number;        // 順位（1-4）
  isCorrect: boolean;  // 正解かどうか
  points: number;      // この選択肢のポイント（0, 1, 2, 3）
}

interface PlayerQuizResult {
  playerId: string;
  playerName: string;
  choice: number;
  points: number;        // 今回獲得したポイント
  totalScore: number;    // 累積スコア
}
```

### GameSettings（ゲーム設定）

```typescript
interface GameSettings {
  maxPlayers: number;       // 最大プレイヤー数（デフォルト: 100）
  defaultTimeLimit: number; // デフォルト制限時間（秒、デフォルト: 30）
  allowLateJoin: boolean;   // 途中参加許可（デフォルト: false）
  showLiveResults: boolean; // リアルタイム結果表示（デフォルト: false）
}
```

---

## WebSocket通信プロトコル

詳細は [API_SPEC.md](./API_SPEC.md) を参照。

---

## データフロー

### 1. ゲーム作成フロー

```
ホスト                    サーバー                     データストア
  │                          │                              │
  ├─ createRoom ────────────►│                              │
  │                          ├─ ルームID生成                │
  │                          ├─ GameRoom作成 ──────────────►│
  │◄─ roomCreated ───────────┤                              │
  │   (roomId: "ABC123")     │                              │
```

### 2. プレイヤー参加フロー

```
プレイヤー                サーバー                     全員
  │                          │                          │
  ├─ joinRoom ──────────────►│                          │
  │   (roomId, playerName)   ├─ 参加者追加              │
  │                          ├─ playerJoined ──────────►│
  │◄─ roomState ─────────────┤   (新プレイヤー情報)     │
  │   (現在の部屋状態)       │                          │
```

### 3. クイズ出題フロー

```
ホスト                    サーバー                     全プレイヤー
  │                          │                              │
  ├─ startQuiz ─────────────►│                              │
  │   (quiz)                 ├─ Quiz作成                    │
  │                          ├─ quizStarted ───────────────►│
  │                          │   (問題・選択肢・制限時間)   │
  │                          │                              │
  │                          ├─ タイマー開始                │
  │                          │   (30秒後に自動締切)         │
```

### 4. 回答送信フロー

```
プレイヤー                サーバー                     ホスト
  │                          │                          │
  ├─ submitAnswer ──────────►│                          │
  │   (choice)               ├─ 回答を記録              │
  │                          ├─ answerReceived ────────►│
  │◄─ answerConfirmed ───────┤   (回答者数更新)         │
  │                          │                          │
```

### 5. 結果集計フロー

```
サーバー                     全員                      データストア
  │                          │                              │
  ├─ 制限時間終了             │                              │
  ├─ 得点計算実行             │                              │
  ├─ スコア更新 ──────────────┼─────────────────────────────►│
  ├─ quizResult ─────────────►│                              │
  │   (各選択肢の得票数)      │                              │
  │   (各プレイヤーの得点)    │                              │
  │   (ランキング)            │                              │
```

---

## セキュリティ考慮事項

### 1. 入力検証

```typescript
// プレイヤー名の検証
const validatePlayerName = (name: string): boolean => {
  return name.length >= 1 &&
         name.length <= 20 &&
         /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/.test(name);
};

// ルームIDの検証
const validateRoomId = (roomId: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(roomId);
};
```

### 2. レート制限

```typescript
// 回答送信のレート制限（1問につき1回のみ）
const answerRateLimit = new Map<string, Set<string>>();
// key: quizId, value: Set of playerIds

// ルーム作成のレート制限（1 IPにつき5分に1回）
const roomCreationRateLimit = new Map<string, number>();
// key: IP address, value: timestamp
```

### 3. 権限チェック

```typescript
// ホストのみが実行できるアクション
const hostOnlyActions = [
  'startQuiz',
  'endQuiz',
  'kickPlayer',
  'closeRoom'
];

// 参加者が実行できるアクション
const playerActions = [
  'submitAnswer',
  'leaveRoom'
];
```

### 4. XSS対策

- 全てのユーザー入力をサニタイズ
- HTMLタグのエスケープ処理
- Content Security Policy (CSP) の設定

---

## パフォーマンス最適化

### 1. 接続管理

```typescript
// Socket.io設定
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,  // 1MB
  transports: ['websocket', 'polling']
});
```

### 2. メモリ管理

```typescript
// 非アクティブなルームの自動削除（1時間後）
const ROOM_TIMEOUT = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.lastActivity > ROOM_TIMEOUT) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted due to inactivity`);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes
```

### 3. ブロードキャスト最適化

```typescript
// 特定のルームにのみブロードキャスト
io.to(roomId).emit('event', data);

// 送信者を除くルームメンバーにブロードキャスト
socket.to(roomId).emit('event', data);
```

---

## エラーハンドリング

### エラーコード定義

```typescript
enum ErrorCode {
  // ルーム関連
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ALREADY_STARTED = 'ROOM_ALREADY_STARTED',

  // プレイヤー関連
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  PLAYER_ALREADY_EXISTS = 'PLAYER_ALREADY_EXISTS',
  NOT_HOST = 'NOT_HOST',

  // クイズ関連
  QUIZ_NOT_FOUND = 'QUIZ_NOT_FOUND',
  ALREADY_ANSWERED = 'ALREADY_ANSWERED',
  ANSWER_TIMEOUT = 'ANSWER_TIMEOUT',
  INVALID_CHOICE = 'INVALID_CHOICE',

  // システム
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
}
```

---

## デプロイ構成

### 開発環境

```
Frontend: http://localhost:5173 (Vite dev server)
Backend:  http://localhost:3000 (Node.js)
```

### 本番環境

```
Frontend: https://quize-second.vercel.app
Backend:  https://quize-second-api.railway.app
```

### 環境変数

**フロントエンド (.env)**
```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

**バックエンド (.env)**
```bash
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379  # オプション
```

---

## モニタリング・ロギング

### ログレベル

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

### 記録するイベント

- ルーム作成・削除
- プレイヤー参加・退出
- クイズ開始・終了
- 回答送信
- エラー発生
- パフォーマンスメトリクス（応答時間、メモリ使用量）

---

## テスト戦略

### ユニットテスト

- 得点計算ロジック
- バリデーション関数
- ユーティリティ関数

### 統合テスト

- WebSocket接続・切断
- ルーム作成・参加
- クイズフロー全体

### 負荷テスト

```bash
# Artillery を使用した負荷テスト
artillery run load-test.yml
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 users/sec
      name: Warm up
    - duration: 120
      arrivalRate: 50  # 50 users/sec
      name: Ramp up
    - duration: 60
      arrivalRate: 100 # 100 users/sec
      name: Sustained load
```

---

## 将来の拡張性

### スケーラビリティ

- **水平スケーリング**: Redis Adapter for Socket.io
  ```typescript
  import { createAdapter } from '@socket.io/redis-adapter';
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  ```

- **負荷分散**: Nginx / AWS ALB

### 機能拡張

- ユーザー認証（OAuth）
- パーシスタントなユーザープロフィール
- クイズテンプレート機能
- リプレイ機能
- チャット機能
