# 状態管理仕様書

## 概要

Quize Secondは複数画面間でリアルタイムに状態を同期する必要があります。この仕様書では、ゲーム開始から終了までの状態遷移、データ構造、同期戦略を定義します。

**実装状況**: この仕様書は現在の実装と一致しています。すべての型定義は `types/game.ts` および `types/events.ts` に実装済みです。

## 状態管理の3つの柱

1. **ゲーム全体の状態** - ルーム・ゲームセッション全体の状態
2. **プレイヤーの状態** - 個々のプレイヤーの状態とスコア
3. **クイズの状態** - 現在の問題と回答状況

---

## 1. ゲーム全体の状態遷移

### 状態定義

```typescript
enum GamePhase {
  // 初期フェーズ
  LOBBY = 'LOBBY',                              // ロビー（参加者待ち）
  RECEPTION_CLOSED = 'RECEPTION_CLOSED',        // 受付終了（途中参加不可）
  GAME_INTRO = 'GAME_INTRO',                    // ゲームイントロ（開始演出）
  QUIZ_PREPARE = 'QUIZ_PREPARE',                // 問題準備中

  // 出題フェーズ（段階的表示）
  QUIZ_SHOWING_QUESTION = 'QUIZ_SHOWING_QUESTION', // 問題文表示中
  QUIZ_SHOWING_IMAGE = 'QUIZ_SHOWING_IMAGE',       // 問題画像表示中（画像がある場合）
  QUIZ_SHOWING_CHOICES = 'QUIZ_SHOWING_CHOICES',   // 選択肢表示中

  // 回答フェーズ
  QUIZ_ACTIVE = 'QUIZ_ACTIVE',                  // 回答受付中
  QUIZ_CLOSED = 'QUIZ_CLOSED',                  // 回答締切・採点完了

  // 結果表示フェーズ（段階的表示）
  RESULT_SHOWING_ANNOUNCE = 'RESULT_SHOWING_ANNOUNCE', // 結果発表開始（問題文表示）
  RESULT_SHOWING_ANSWER = 'RESULT_SHOWING_ANSWER',     // 正解発表中
  RESULT_SHOWING_VOTES = 'RESULT_SHOWING_VOTES',       // 得票数表示中
  RESULT_SHOWING_POINTS = 'RESULT_SHOWING_POINTS',     // ポイント発表中（プレイヤー画面のみ・現在未使用）

  // 途中経過フェーズ（半分終了時点）
  INTERIM_LEADERBOARD = 'INTERIM_LEADERBOARD',         // 途中経過リーダーボード

  // 最終結果フェーズ
  FINAL_RESULT = 'FINAL_RESULT',                // 最終ランキング表示中
  GAME_OVER = 'GAME_OVER',                      // ゲーム終了
}

interface RoomState {
  roomId: string;
  roomCode: string;                   // 6桁の参加コード
  phase: GamePhase;
  hostId: string;
  settings: RoomSettings;             // totalQuizCount を含む
  players: Map<string, Player>;       // playerId -> Player
  currentQuiz: Quiz | null;
  quizHistory: QuizResult[];          // 過去の問題結果
  selectedTemplateId: string | null;  // 選択されたテンプレートID
  preparedQuizzes: QuizForm[];        // テンプレートから読み込んだ問題リスト
  winnerRevealed: boolean;            // 1位が発表済みかどうか
  createdAt: number;
  updatedAt: number;
}

interface RoomSettings {
  hostName: string;
  maxPlayers: number;
  defaultTimeLimit: number;
  allowLateJoin: boolean;
  totalQuizCount: number;             // テンプレートから自動設定
}
```

### 状態遷移図

```
LOBBY
  ↓ startGame（ホスト）
RECEPTION_CLOSED
  ↓ showIntro（ホスト）
GAME_INTRO
  ↓ goToQuizPrep（ホスト）
QUIZ_PREPARE
  ↓ startQuizShow（ホスト）

  ┌─────────────── 出題フェーズ ───────────────┐
  QUIZ_SHOWING_QUESTION（問題文表示）
    ↓ nextQuizShowStep（ホスト）
  QUIZ_SHOWING_IMAGE（画像表示 ※画像がある場合のみ）
    ↓ nextQuizShowStep（ホスト）
  QUIZ_SHOWING_CHOICES（選択肢表示）
    ↓ startAnswer（ホスト）
  └────────────────────────────────────────────┘

QUIZ_ACTIVE（回答受付中）
  ↓ タイムアウト / 全員回答 / closeQuiz（ホスト）
QUIZ_CLOSED（回答締切・採点完了）
  ↓ showResults（ホスト）

  ┌─────────────── 結果フェーズ ───────────────┐
  RESULT_SHOWING_ANNOUNCE（結果発表開始・問題文表示）
    ↓ nextResultStep（ホスト）
  RESULT_SHOWING_ANSWER（正解発表）
    ↓ nextResultStep（ホスト）
  RESULT_SHOWING_VOTES（得票数表示）
    ↓ nextResultStep（ホスト）→ 自動ルーティング
  └────────────────────────────────────────────┘

  ┌── 自動ルーティング（RESULT_SHOWING_VOTES から）──┐
  │ 全問終了 → FINAL_RESULT                       │
  │ 半分終了時点 → INTERIM_LEADERBOARD            │
  │ それ以外 → QUIZ_PREPARE（次の問題）            │
  └────────────────────────────────────────────────┘

INTERIM_LEADERBOARD（途中経過リーダーボード）
  ↓ nextQuiz（ホスト）
QUIZ_PREPARE（次の問題へループ）

FINAL_RESULT（最終ランキング表示）
  ↓ closeRoom（ホスト）
GAME_OVER
```

### 状態遷移条件

| 現在の状態 | イベント（クライアント→サーバー） | 次の状態 | 実行者 | 備考 |
|----------|---------|---------|--------|------|
| LOBBY | `startGame` | RECEPTION_CLOSED | ホスト | 途中参加を締め切り |
| RECEPTION_CLOSED | `showIntro` | GAME_INTRO | ホスト | |
| GAME_INTRO | `goToQuizPrep` | QUIZ_PREPARE | ホスト | |
| QUIZ_PREPARE | `startQuizShow` | QUIZ_SHOWING_QUESTION | ホスト | |
| QUIZ_SHOWING_QUESTION | `nextQuizShowStep` | QUIZ_SHOWING_IMAGE | ホスト | 画像がある場合 |
| QUIZ_SHOWING_QUESTION | `nextQuizShowStep` | QUIZ_SHOWING_CHOICES | ホスト | 画像がない場合 |
| QUIZ_SHOWING_IMAGE | `nextQuizShowStep` | QUIZ_SHOWING_CHOICES | ホスト | |
| QUIZ_SHOWING_CHOICES | `startAnswer` | QUIZ_ACTIVE | ホスト | |
| QUIZ_ACTIVE | `closeQuiz` | QUIZ_CLOSED | ホスト | 手動締切 |
| QUIZ_ACTIVE | （タイムアウト） | QUIZ_CLOSED | システム | |
| QUIZ_ACTIVE | （全員回答） | QUIZ_CLOSED | システム | |
| QUIZ_CLOSED | `showResults` | RESULT_SHOWING_ANNOUNCE | ホスト | |
| RESULT_SHOWING_ANNOUNCE | `nextResultStep` | RESULT_SHOWING_ANSWER | ホスト | `resultAnswerShow`イベント発火 |
| RESULT_SHOWING_ANSWER | `nextResultStep` | RESULT_SHOWING_VOTES | ホスト | `resultVotesShow`イベント発火 |
| RESULT_SHOWING_VOTES | `nextResultStep` | FINAL_RESULT | ホスト | 全問終了時 |
| RESULT_SHOWING_VOTES | `nextResultStep` | INTERIM_LEADERBOARD | ホスト | 半分終了時点 |
| RESULT_SHOWING_VOTES | `nextResultStep` | QUIZ_PREPARE | ホスト | それ以外 |
| INTERIM_LEADERBOARD | `nextQuiz` | QUIZ_PREPARE | ホスト | |
| FINAL_RESULT | `closeRoom` | GAME_OVER | ホスト | |

**途中経過リーダーボードの発生条件**:
- `completedCount === Math.floor(totalCount / 2)` かつ `completedCount < totalCount`
- 例: 10問中5問終了時点

### 画面別の表示内容

| 状態 | ホスト画面 | プレイヤー画面 | 共有画面 |
|-----|-----------|--------------|---------|
| QUIZ_SHOWING_QUESTION | 問題文プレビュー + 「次へ」ボタン | 「問題が出題されます」待機表示 | 問題文を大きく表示 |
| QUIZ_SHOWING_IMAGE | 画像プレビュー + 「次へ」ボタン | 「共有画面を見てください」 | 問題画像を大きく表示 |
| QUIZ_SHOWING_CHOICES | 選択肢プレビュー + 「回答開始」ボタン | 「まもなく回答開始」待機表示 | 選択肢を表示 |
| QUIZ_ACTIVE | 回答状況・タイマー・「締め切り」ボタン | 選択肢ボタン（番号のみ）+ タイマー + スコア | 問題全体 + 回答バー + タイマー |
| QUIZ_CLOSED | 「回答締め切り」 + 「結果を発表する」ボタン | 「集計中...」待機表示 | 「集計中...」表示 |
| RESULT_SHOWING_ANNOUNCE | 問題文 + 「次へ」ボタン | 「正解発表中...」待機 | 問題文のみ表示 |
| RESULT_SHOWING_ANSWER | 正解表示 + 「次へ」ボタン | 「正解発表中...」待機 | 正解をハイライト |
| RESULT_SHOWING_VOTES | 得票数データ + 「次へ」ボタン | 自分の結果 + 累積スコア | 得票数グラフ（棒グラフ） |
| INTERIM_LEADERBOARD | 1位表示（スコアは共有画面では非表示と注記） + 「次の問題へ」ボタン | 待機 | 1位を???、2位・3位を表示 |
| FINAL_RESULT | 最終結果 + 「ルームを閉じる」ボタン | 自分の最終順位 | 最終ランキング（全員） |

---

## 2. プレイヤーの状態管理

### プレイヤーデータ構造

```typescript
enum PlayerStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',    // 切断中（30秒以内に再接続可能）
  KICKED = 'KICKED',
}

interface Player {
  id: string;                       // UUID
  name: string;
  status: PlayerStatus;
  totalScore: number;               // 累積スコア
  rank: number;                     // 現在の順位（1-indexed）
  answers: PlayerAnswer[];          // 回答履歴
  joinedAt: number;
  lastSeenAt: number;
}

interface PlayerAnswer {
  quizNumber: number;
  choiceIndex: number;              // 0-3
  answeredAt: number;
  timeSpent: number;                // 回答にかかった時間（秒）
  earnedPoints: number;
  wasCorrect: boolean;
}
```

---

## 3. クイズの状態管理

### クイズデータ構造

```typescript
interface Quiz {
  quizNumber: number;               // 1から順番
  question: string;
  questionImage?: string;           // 画像URL（オプション）
  choices: [Choice, Choice, Choice, Choice];
  correctIndex: number;             // 正解の選択肢（0-3）
  timeLimit: number;                // 制限時間（秒）
  startedAt: number;
  endsAt: number;
  explanation?: string;             // 正解解説（オプション）
}

interface ChoiceStatistics {
  choiceIndex: number;
  text: string;
  voteCount: number;
  percentage: number;               // 0-100
  rank: number;                     // 1-4
  isCorrect: boolean;
  isSecondPlace: boolean;
  points: number;                   // 0, 1, 2, または 3
}

interface QuizResult {
  quizNumber: number;
  question: string;
  correctIndex: number;
  voteCounts: [number, number, number, number];
  statistics: ChoiceStatistics[];
  secondPlaceChoice: number;
  playerResults: Record<string, PlayerQuizResult>;
  leaderboard: LeaderboardEntry[];
}
```

---

## 4. リアルタイム同期戦略

### 同期の原則

1. **Single Source of Truth**: サーバー側でのみ状態を保持・更新
2. **イベント駆動**: すべての状態変更はイベントとして配信
3. **再接続時の完全同期**: 切断後の再接続時に `stateSync` イベントで完全な状態を送信
4. **状態復元ユーティリティ**: `src/lib/gameUtils.ts` で `SerializedRoomState` から `FinalResult` や `InterimLeaderboardShowEvent` を再構築

### 画面別の受信イベント

| イベント | ホスト | プレイヤー | 共有画面 |
|---------|--------|-----------|---------|
| `playerJoined` | ✅ | - | ✅ |
| `playerLeft` | ✅ | - | ✅ |
| `phaseChanged` | ✅ | ✅ | ✅ |
| `quizQuestionShow` | ✅ | - | ✅ |
| `quizImageShow` | ✅ | - | ✅ |
| `quizChoicesShow` | ✅ | - | ✅ |
| `quizActive` | ✅ | ✅ | ✅ |
| `answerCount` | ✅ | - | ✅ |
| `quizClosed` | ✅ | ✅ | ✅ |
| `resultAnswerShow` | ✅ | - | ✅ |
| `resultVotesShow` | ✅ | ✅ | ✅ |
| `resultPointsShow` | - | ✅（個別） | - |
| `interimLeaderboardShow` | ✅ | - | ✅ |
| `finalResult` | ✅ | ✅ | ✅ |
| `stateSync` | ✅ | ✅ | ✅ |

---

## 5. データ永続化

現バージョンではすべてインメモリで管理。ゲーム終了後にルームが閉じられると状態は消去される。

### メモリ構造

```typescript
// グローバルなルーム管理（RoomManagerクラス内）
private rooms = new Map<string, RoomState>();
private roomCodeIndex = new Map<string, string>(); // roomCode -> roomId
```

---

## 6. エラーハンドリング

### エラーコード

```typescript
enum ErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ALREADY_STARTED = 'ROOM_ALREADY_STARTED',
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  PLAYER_ALREADY_EXISTS = 'PLAYER_ALREADY_EXISTS',
  NOT_HOST = 'NOT_HOST',
  INVALID_PHASE = 'INVALID_PHASE',
  QUIZ_NOT_FOUND = 'QUIZ_NOT_FOUND',
  ALREADY_ANSWERED = 'ALREADY_ANSWERED',
  ANSWER_TIMEOUT = 'ANSWER_TIMEOUT',
  INVALID_CHOICE = 'INVALID_CHOICE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

---

## まとめ

この状態管理設計により:

1. **明確な状態遷移**: 17フェーズが明確に定義され、不正な遷移を防ぐ
2. **リアルタイム同期**: WebSocketで3つの画面すべてが同期される
3. **スケーラビリティ**: 100人のプレイヤーに対応できる効率的な設計
4. **再接続対応**: 切断・再接続時も `stateSync` + `gameUtils.ts` で状態を復元できる
5. **段階的演出**: 結果発表・途中経過リーダーボードによる盛り上がり設計
