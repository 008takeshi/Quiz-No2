# WebSocket API 仕様書

## 概要

Socket.ioを使用したWebSocket通信のAPI仕様です。型定義は `types/events.ts` に実装済みです。

---

## 接続

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

---

## イベント一覧

### クライアント → サーバー

| イベント名 | 説明 | 送信者 |
|-----------|------|--------|
| `createRoom` | ゲームルームを作成（テンプレート選択を含む） | ホスト |
| `joinRoom` | プレイヤーとして参加 | プレイヤー |
| `joinAsDisplay` | 共有画面として参加 | 共有画面 |
| `reconnectHost` | ホストとして再接続 | ホスト |
| `reconnectPlayer` | プレイヤーとして再接続 | プレイヤー |
| `reconnectDisplay` | 共有画面として再接続 | 共有画面 |
| `leaveRoom` | ルームから退出 | 全員 |
| `startGame` | ゲーム開始（LOBBY → RECEPTION_CLOSED） | ホスト |
| `showIntro` | イントロへ（RECEPTION_CLOSED → GAME_INTRO） | ホスト |
| `goToQuizPrep` | 問題準備へ（GAME_INTRO → QUIZ_PREPARE） | ホスト |
| `startQuizShow` | 出題開始（QUIZ_PREPARE → QUIZ_SHOWING_QUESTION） | ホスト |
| `nextQuizShowStep` | 出題フェーズ内で次へ | ホスト |
| `startAnswer` | 回答開始（QUIZ_SHOWING_CHOICES → QUIZ_ACTIVE） | ホスト |
| `closeQuiz` | 回答締切（QUIZ_ACTIVE → QUIZ_CLOSED） | ホスト |
| `showResults` | 結果発表開始（QUIZ_CLOSED → RESULT_SHOWING_ANNOUNCE） | ホスト |
| `nextResultStep` | 結果フェーズ内で次へ（ANNOUNCE→ANSWER→VOTES→自動） | ホスト |
| `nextQuiz` | 次の問題へ（INTERIM_LEADERBOARD → QUIZ_PREPARE） | ホスト |
| `endGame` | ゲーム終了（RESULT_SHOWING_VOTES → FINAL_RESULT） | ホスト |
| `closeRoom` | ルームを閉じる（FINAL_RESULT → GAME_OVER） | ホスト |
| `revealWinner` | 1位を発表（winnerRevealedフラグを立てる） | ホスト |
| `submitAnswer` | 回答を送信 | プレイヤー |
| `kickPlayer` | プレイヤーをキック | ホスト |
| `deleteRoom` | ルームを削除 | ホスト |
| `resetGame` | ゲームをリセット（LOBBYに戻す） | ホスト |
| `ping` | 接続確認 | 全員 |

### サーバー → クライアント

| イベント名 | 説明 | 受信者 |
|-----------|------|--------|
| `playerJoined` | プレイヤー参加通知 | ルーム全体 |
| `playerLeft` | プレイヤー退出通知 | ルーム全体 |
| `phaseChanged` | フェーズ変更通知 | ルーム全体 |
| `quizQuestionShow` | 問題文表示 | ルーム全体 |
| `quizImageShow` | 問題画像表示 | ルーム全体 |
| `quizChoicesShow` | 選択肢表示 | ルーム全体 |
| `quizActive` | 回答受付開始 | ルーム全体 |
| `answerReceived` | 回答受付確認 | プレイヤー個別 |
| `answerCount` | 回答者数更新 | ホスト・共有画面 |
| `quizClosed` | 回答締切通知 | ルーム全体 |
| `resultAnswerShow` | 正解発表 | ルーム全体 |
| `resultVotesShow` | 得票数発表 | ルーム全体 |
| `resultPointsShow` | ポイント発表（個別） | プレイヤー個別 |
| `interimLeaderboardShow` | 途中経過リーダーボード | ルーム全体 |
| `finalResult` | 最終結果 | ルーム全体 |
| `winnerRevealed` | 1位発表 | ルーム全体 |
| `roomClosed` | ルーム閉鎖通知 | ルーム全体 |
| `roomDeleted` | ルーム削除通知 | ルーム全体 |
| `gameReset` | ゲームリセット通知 | ルーム全体 |
| `templateSelected` | テンプレート選択通知 | ルーム全体 |
| `stateSync` | 状態同期（再接続時） | 個別 |
| `error` | エラー通知 | 個別 |
| `pong` | Ping応答 | 個別 |

---

## イベント詳細

### 1. ルーム作成

**Client → Server: `createRoom`**

```typescript
interface CreateRoomRequest {
  template: SelectTemplateRequest;   // テンプレート（必須）
  settings?: {
    maxPlayers?: number;             // デフォルト: 100
    defaultTimeLimit?: number;       // 秒、デフォルト: 30
    allowLateJoin?: boolean;         // デフォルト: false
  };
}

type SelectTemplateRequest =
  | { source: 'server'; templateId: string }    // 'default', 'geography-japan' など
  | { source: 'upload'; template: QuizTemplate }; // カスタムJSONアップロード

socket.emit('createRoom', {
  template: { source: 'server', templateId: 'default' },
  settings: { defaultTimeLimit: 30 }
}, (response) => {
  if ('code' in response) {
    console.error(response.message);
  } else {
    console.log('Room created:', response.roomCode);
    // response.roomCode を保存してプレイヤーに共有
  }
});
```

**Response: `CreateRoomResponse`**

```typescript
interface CreateRoomResponse {
  roomId: string;      // ルームID（UUID）
  roomCode: string;    // 6桁の参加コード（例: "ABC123"）
  hostId: string;      // ホストのSocket ID
  settings: RoomSettings;
}
```

---

### 2. ルーム参加（プレイヤー）

**Client → Server: `joinRoom`**

```typescript
socket.emit('joinRoom', {
  roomCode: 'ABC123',
  playerName: 'プレイヤー1'
}, (response) => {
  if ('code' in response) {
    console.error(response.message);
  } else {
    localStorage.setItem('playerId', response.playerId);
    localStorage.setItem('roomCode', response.roomCode);
  }
});
```

**Response: `JoinRoomResponse`**

```typescript
interface JoinRoomResponse {
  roomId: string;
  roomCode: string;
  playerId: string;        // UUID（再接続時に必要）
  playerName: string;
  currentPhase: GamePhase;
}
```

---

### 3. 共有画面の参加

**Client → Server: `joinAsDisplay`**

```typescript
socket.emit('joinAsDisplay', { roomCode: 'ABC123' }, (response) => {
  if ('code' in response) {
    console.error(response.message);
  } else {
    console.log('Display connected:', response.roomCode);
  }
});
```

**特記事項**:
- 共有画面はプレイヤーとしてカウントされない
- 回答不可（表示専用）
- 1ルームに複数接続可能

---

### 4. 再接続

**プレイヤー再接続**:

```typescript
socket.emit('reconnectPlayer', {
  roomCode: localStorage.getItem('roomCode'),
  playerId: localStorage.getItem('playerId'),
  playerName: localStorage.getItem('playerName')
}, (response) => { ... });
```

再接続に成功すると、`stateSync` イベントで現在の状態が送信されます。

**Server → Client: `stateSync`**

```typescript
interface StateSyncEvent {
  roomState: SerializedRoomState;  // ルーム全体の状態
  playerState?: Player;            // 自分のプレイヤー状態（プレイヤーのみ）
}
```

---

### 5. 回答送信

**Client → Server: `submitAnswer`**

```typescript
socket.emit('submitAnswer', { choiceIndex: 2 });  // 0-3
```

**Server → Client: `answerReceived`**（個別）

```typescript
interface AnswerReceivedEvent {
  choiceIndex: number;
  timeSpent: number;  // 秒
}
```

**Server → ホスト・共有画面: `answerCount`**

```typescript
interface AnswerCountEvent {
  answerCount: number;
  totalPlayers: number;
  percentage: number;   // 0-100
}
```

---

### 6. 回答締切・採点

回答締切のトリガー:
- タイムアウト（自動）
- 全員回答（自動）
- ホストが `closeQuiz` を送信

**Server → All: `quizClosed`**

```typescript
interface QuizClosedEvent {
  reason: 'timeout' | 'host' | 'all_answered';
}
```

---

### 7. 結果フェーズ

#### 7-1. `showResults`（QUIZ_CLOSED → RESULT_SHOWING_ANNOUNCE）

`phaseChanged` イベントのみ発火。

#### 7-2. `nextResultStep`（ANNOUNCE → ANSWER）

`resultAnswerShow` イベントが発火:

```typescript
interface ResultAnswerShowEvent {
  quizNumber: number;
  correctIndex: number;
  statistics: ChoiceStatistics[];
  explanation?: string;
}
```

#### 7-3. `nextResultStep`（ANSWER → VOTES）

`resultVotesShow` イベントが発火:

```typescript
interface ResultVotesShowEvent {
  quizNumber: number;
  statistics: ChoiceStatistics[];
  leaderboard: LeaderboardEntry[];  // 現在の順位（全員）
}

interface ChoiceStatistics {
  choiceIndex: number;
  text: string;
  voteCount: number;
  percentage: number;
  rank: number;         // 1-4（得票数順）
  isCorrect: boolean;
  isSecondPlace: boolean;
  points: number;       // 0, 1, 2, または 3
}
```

#### 7-4. `nextResultStep`（VOTES → 自動ルーティング）

状況に応じて自動的に次のフェーズへ遷移:

| 条件 | 次のフェーズ | 追加イベント |
|------|------------|------------|
| 全問終了 | `FINAL_RESULT` | `finalResult` |
| 半分終了時点 | `INTERIM_LEADERBOARD` | `interimLeaderboardShow` |
| それ以外 | `QUIZ_PREPARE` | なし |

---

### 8. 途中経過リーダーボード

**Server → All: `interimLeaderboardShow`**

```typescript
interface InterimLeaderboardShowEvent {
  completedQuizCount: number;    // 完了した問題数
  totalQuizCount: number;        // 総問題数
  topEntries: Array<{
    rank: number;
    playerName: string | null;   // 1位（同率含む）は null（伏せる）
    totalScore: number;
    hideScore: boolean;          // 1位はスコアも非表示
  }>;
}
```

**表示ルール**:
- 1位（同率含む）: 共有画面では名前を `???`、スコアを `??? pt` で表示
- ホスト画面では実際の名前・スコアを表示（共有画面では非表示であることを注記）

---

### 9. 最終結果

**Server → All: `finalResult`**

```typescript
interface FinalResultEvent {
  finalResult: FinalResult;
}

interface FinalResult {
  roomId: string;
  totalQuizCount: number;
  totalPlayers: number;
  winner: LeaderboardEntry;
  leaderboard: LeaderboardEntry[];
  statistics: {
    averageAnswerTime: number;
    hardestQuiz: { quizNumber: number; question: string; correctRate: number };
    easiestQuiz: { quizNumber: number; question: string; correctRate: number };
  };
  startedAt: number;
  endedAt: number;
}
```

---

### 10. エラー処理

**Server → Client: `error`**

```typescript
socket.on('error', (error: ErrorResponse) => {
  switch (error.code) {
    case 'ROOM_NOT_FOUND':    // ルームが存在しない
    case 'ROOM_FULL':         // ルームが満員
    case 'NOT_HOST':          // ホスト権限が必要
    case 'INVALID_PHASE':     // 不正なフェーズ遷移
    case 'ALREADY_ANSWERED':  // 既に回答済み
    case 'INTERNAL_ERROR':    // サーバーエラー
    // ...
  }
});
```

---

## エラーコード一覧

| コード | 説明 |
|--------|------|
| `ROOM_NOT_FOUND` | ルームが存在しない |
| `ROOM_FULL` | ルームが満員（maxPlayers超過） |
| `ROOM_ALREADY_STARTED` | ゲーム開始済みで途中参加不可 |
| `INVALID_PLAYER_NAME` | プレイヤー名が無効（1-20文字） |
| `PLAYER_ALREADY_EXISTS` | 同IDのプレイヤーが存在 |
| `NOT_HOST` | ホスト権限が必要な操作 |
| `INVALID_PHASE` | 現在のフェーズでは実行不可 |
| `QUIZ_NOT_FOUND` | クイズが存在しない |
| `ALREADY_ANSWERED` | 既に回答済み（1問につき1回のみ） |
| `ANSWER_TIMEOUT` | 回答時間切れ |
| `INVALID_CHOICE` | 無効な選択肢（0-3の範囲外） |
| `INTERNAL_ERROR` | サーバー内部エラー |
| `RATE_LIMIT_EXCEEDED` | リクエスト過多 |

---

## パフォーマンス

- 1ルームあたり最大100接続（プレイヤー + ホスト + 共有画面）
- `answerCount` イベントは100msスロットリング
