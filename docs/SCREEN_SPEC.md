# 画面仕様書（SPA版）

## 設計思想

このシステムは3つの役割別シングルページアプリケーション（SPA）で構成されます。
各SPAはゲームの進行状態（フェーズ）に応じて表示を切り替え、**ページ遷移を行いません**。

### SPAの利点
- **再接続の簡便性**: リロード時も同じURLで自動的に状態を復元
- **状態管理の簡素化**: 1つのコンテキストで全フェーズを管理
- **WebSocket接続の永続化**: ページ遷移がないため接続が途切れない

---

## 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (3 SPAs)                       │
│                   React + Vite (静的ホスティング)            │
├──────────────────┬──────────────────┬───────────────────────┤
│  ホストSPA        │  プレイヤーSPA    │  共有画面SPA          │
│  /host           │  /play           │  /display/:roomCode  │
│  (PC/タブレット)  │  (スマートフォン)  │  (プロジェクター)      │
└────────┬─────────┴────────┬─────────┴──────────┬───────────┘
         │                  │                     │
         └──────── WebSocket (Socket.io) ─────────┘
                            ▼
         ┌──────────────────────────────┐
         │      Backend Server          │
         │      Node.js + Socket.io     │
         └──────────────────────────────┘
```

### 3つのSPA

| SPA | URL | 役割 | デバイス |
|-----|-----|------|---------|
| ホストSPA | `/host` | ゲーム進行制御 | PC/タブレット |
| プレイヤーSPA | `/play?room=ABC123` | 回答入力 | スマートフォン |
| 共有画面SPA | `/display/:roomCode` | 問題・結果表示 | プロジェクター |

---

## 1. ホストSPA（/host）

### フェーズとコンポーネントの対応

| ゲームフェーズ | 表示コンポーネント | ファイル |
|--------------|------------------|---------|
| 未作成 | `HostSetup` | `HostSetup.tsx` |
| `LOBBY` | `HostLobby` | *(HostApp.tsx 内)* |
| `RECEPTION_CLOSED` | `HostLobby`（受付終了表示） | |
| `GAME_INTRO` | *(イントロ画面)* | |
| `QUIZ_PREPARE` | `HostQuizPrepare` | `HostQuizPrepare.tsx` |
| `QUIZ_SHOWING_*` | `HostQuizShowing` | `HostQuizShowing.tsx` |
| `QUIZ_ACTIVE` | `HostQuizActive` | `HostQuizActive.tsx` |
| `QUIZ_CLOSED` | `HostQuizClosed` | `HostQuizClosed.tsx` |
| `RESULT_SHOWING_ANNOUNCE` | `HostQuizShowing` | |
| `RESULT_SHOWING_ANSWER` | `HostResultVotes` | `HostResultVotes.tsx` |
| `RESULT_SHOWING_VOTES` | `HostResultVotes` | |
| `INTERIM_LEADERBOARD` | `HostInterimLeaderboard` | `HostInterimLeaderboard.tsx` |
| `FINAL_RESULT` | `HostFinalResult` | `HostFinalResult.tsx` |

### コンポーネント詳細

#### 1-1. HostSetup（ルーム作成）
**表示条件**: ルームが未作成
- テンプレート選択（サーバーテンプレート一覧またはJSONアップロード）
- 制限時間などの設定
- `createRoom` イベント送信

#### 1-2. HostLobby（参加者待ち）
**表示条件**: `LOBBY` フェーズ
- ルームコード・QRコード表示
- 参加者リスト（キック機能付き）
- 「共有画面を開く」ボタン
- 「ゲームを開始」ボタン

#### 1-3. HostQuizPrepare（問題準備）
**表示条件**: `QUIZ_PREPARE` フェーズ
- 問題番号・残り問題数の表示
- 「出題開始」ボタン（`startQuizShow` 送信）
- テンプレートから自動的に問題が準備されるため入力フォームは不要

#### 1-4. HostQuizShowing（出題フェーズ）
**表示条件**: `QUIZ_SHOWING_QUESTION / IMAGE / CHOICES` フェーズ
- 現在表示中のコンテンツのプレビュー
- 「次へ」ボタン（`nextQuizShowStep` 送信）
- 選択肢表示後は「回答開始」ボタン（`startAnswer` 送信）

#### 1-5. HostQuizActive（回答受付中）
**表示条件**: `QUIZ_ACTIVE` フェーズ
- 回答状況（カウンター・パーセンテージ）
- カウントダウンタイマー
- 「回答を締め切る」ボタン（`closeQuiz` 送信）

#### 1-6. HostQuizClosed（回答締切）
**表示条件**: `QUIZ_CLOSED` フェーズ
- 「回答締め切り」表示
- 「結果を発表する」ボタン（`showResults` 送信）

#### 1-7. HostResultVotes（結果表示）
**表示条件**: `RESULT_SHOWING_ANNOUNCE / ANSWER / VOTES` フェーズ
- 正解・得票数・統計データの表示
- 「次へ」ボタン（`nextResultStep` 送信）
- `RESULT_SHOWING_VOTES` では次フェーズが自動判断されるため「次へ」でOK

#### 1-8. HostInterimLeaderboard（途中経過リーダーボード）
**表示条件**: `INTERIM_LEADERBOARD` フェーズ
- 「X / Y 問終了時点」の表示
- トップ3のランキング
  - 1位: 実際の名前とスコアを表示（「共有画面では非表示」と注記）
  - 2位・3位: 通常表示
- 「次の問題へ →」ボタン（`nextQuiz` 送信）

#### 1-9. HostFinalResult（最終結果）
**表示条件**: `FINAL_RESULT / GAME_OVER` フェーズ
- 最終順位（全員）
- ゲーム統計（参加者数、平均回答時間、最難問など）
- 「ルームを閉じる」ボタン（`closeRoom` 送信）

---

## 2. プレイヤーSPA（/play）

### フェーズとコンポーネントの対応

| 状態 | 表示コンポーネント | ファイル |
|-----|------------------|---------|
| 未参加 | PlayerJoin（参加フォーム） | *(PlayerApp.tsx 内)* |
| `LOBBY` 〜 `QUIZ_SHOWING_*` | `PlayerQuizWaiting` | `PlayerQuizWaiting.tsx` |
| `QUIZ_ACTIVE` | `PlayerQuizActive` | `PlayerQuizActive.tsx` |
| `QUIZ_CLOSED` | `PlayerQuizWaiting`（集計中表示） | |
| `RESULT_SHOWING_*` | `PlayerResultVotes` | `PlayerResultVotes.tsx` |
| `INTERIM_LEADERBOARD` | `PlayerQuizWaiting`（待機） | |
| `FINAL_RESULT` / `GAME_OVER` | `PlayerFinalResult` | `PlayerFinalResult.tsx` |

### コンポーネント詳細

#### 2-1. PlayerJoin（参加）
- ルームコード入力
- プレイヤー名入力
- `joinRoom` イベント送信

#### 2-2. PlayerQuizWaiting（待機中）
**表示条件**: 回答フェーズ以外で回答中でない
- フェーズに応じたメッセージ（「問題準備中」「共有画面をご覧ください」など）
- 現在のスコアと順位の表示

#### 2-3. PlayerQuizActive（回答中）
**表示条件**: `QUIZ_ACTIVE` フェーズ かつ 未回答
- カウントダウンタイマー
- 1〜4の選択肢ボタン（番号のみ、問題文・選択肢テキストは共有画面に表示）
- 回答送信後: チェックマーク + 「回答を送信しました」表示

#### 2-4. PlayerResultVotes（結果表示）
**表示条件**: `RESULT_SHOWING_*` フェーズ
- 自分の選択内容と獲得ポイント
- 累積スコアと順位（前回からの変動）
- トップ3のリーダーボード

#### 2-5. PlayerFinalResult（最終結果）
**表示条件**: `FINAL_RESULT / GAME_OVER` フェーズ
- 自分の最終順位とスコア（メダル表示）
- 全員の最終順位
- ゲーム統計

---

## 3. 共有画面SPA（/display/:roomCode）

URLにルームコードを含み、自動的に参加・表示するプロジェクター向けSPA。

### フェーズとコンポーネントの対応

| ゲームフェーズ | 表示コンポーネント | ファイル |
|--------------|------------------|---------|
| `LOBBY` | DisplayLobby | *(DisplayApp.tsx 内)* |
| `RECEPTION_CLOSED` / `GAME_INTRO` | DisplayIntro | |
| `QUIZ_SHOWING_*` | `DisplayQuizShowing` | `DisplayQuizShowing.tsx` |
| `QUIZ_ACTIVE` | `DisplayQuizActive` | `DisplayQuizActive.tsx` |
| `QUIZ_CLOSED` | `DisplayQuizActive`（集計中表示） | |
| `RESULT_SHOWING_ANNOUNCE` | `DisplayQuizShowing`（問題文のみ） | |
| `RESULT_SHOWING_ANSWER` / `RESULT_SHOWING_VOTES` | `DisplayResultVotes` | `DisplayResultVotes.tsx` |
| `INTERIM_LEADERBOARD` | `DisplayInterimLeaderboard` | `DisplayInterimLeaderboard.tsx` |
| `FINAL_RESULT` / `GAME_OVER` | `DisplayFinalResult` | `DisplayFinalResult.tsx` |

### コンポーネント詳細

#### 3-1. DisplayLobby（ロビー）
- 参加案内（ルームコード、QRコード、URL）
- 参加者リスト（アニメーション付き）

#### 3-2. DisplayQuizShowing（出題フェーズ）
**表示条件**: `QUIZ_SHOWING_*` フェーズ
- 問題文の大画面表示
- 画像フェーズでは問題画像を表示
- 選択肢フェーズでは選択肢カードを表示

#### 3-3. DisplayQuizActive（回答受付中）
**表示条件**: `QUIZ_ACTIVE` フェーズ
- 問題文 + 選択肢の全表示
- カウントダウンタイマー（大きく表示）
- 回答状況プログレスバー（人数のみ、誰が何を選んだかは非表示）

#### 3-4. DisplayResultVotes（結果発表）
**表示条件**: `RESULT_SHOWING_ANSWER / VOTES` フェーズ
- 得票数の棒グラフ（全選択肢）
- 正解のハイライト表示
- 現在のリーダーボード（上位）

#### 3-5. DisplayInterimLeaderboard（途中経過リーダーボード）
**表示条件**: `INTERIM_LEADERBOARD` フェーズ
- 「X / Y 問終了時点」の見出し
- 1位: 名前を `???`、スコアを `??? pt` で表示
- 2位・3位: 通常表示（🥈🥉絵文字付き）
- ホストが「次の問題へ」を押すまで表示継続

#### 3-6. DisplayFinalResult（最終結果）
**表示条件**: `FINAL_RESULT / GAME_OVER` フェーズ
- 紙吹雪アニメーション
- 優勝者のドラマチック発表
- 全員の最終ランキング
- ゲーム統計（総問題数、参加者数、平均回答時間）

---

## 4. 再接続・状態復元

### リロード時の動作

1. LocalStorageから保存済みの `roomCode`・`playerId`・`playerName` などを読み込み
2. WebSocket再接続（`reconnectPlayer` / `reconnectHost` / `reconnectDisplay`）
3. `stateSync` イベントで受信した `SerializedRoomState` を元に状態を復元
4. 必要に応じて `src/lib/gameUtils.ts` の `reconstructFinalResult` / `reconstructInterimLeaderboard` を使用

### gameUtils.ts の役割

```typescript
// 再接続時にFINAL_RESULTフェーズの場合、finalResultイベントが再送されないため
// SerializedRoomStateから再構築する
reconstructFinalResult(roomState: SerializedRoomState): FinalResult

// INTERIM_LEADERBOARDフェーズの場合も同様
reconstructInterimLeaderboard(roomState: SerializedRoomState): InterimLeaderboardShowEvent
```

---

## 5. ルーティング設定

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/host" element={<HostApp />} />
    <Route path="/play" element={<PlayerApp />} />
    <Route path="/display/:roomCode" element={<DisplayApp />} />
    <Route path="/" element={<Navigate to="/play" replace />} />
  </Routes>
</BrowserRouter>
```

---

## 6. コンポーネント階層（現在の実装）

### ホストSPA
```
HostApp
├─ SocketContext（WebSocket接続管理）
├─ HostSetup
├─ HostLobby
├─ HostQuizPrepare
├─ HostQuizShowing
├─ HostQuizActive
├─ HostQuizClosed
├─ HostResultVotes
├─ HostInterimLeaderboard
├─ HostFinalResult
└─ HostOptionsMenu（メニューオーバーレイ）
```

### プレイヤーSPA
```
PlayerApp
├─ SocketContext
├─ PlayerJoin（参加フォーム）
├─ PlayerQuizWaiting
├─ PlayerQuizActive
├─ PlayerResultVotes
└─ PlayerFinalResult
```

### 共有画面SPA
```
DisplayApp
├─ SocketContext
├─ DisplayLobby
├─ DisplayIntro
├─ DisplayQuizShowing
├─ DisplayQuizActive
├─ DisplayResultVotes
├─ DisplayInterimLeaderboard
└─ DisplayFinalResult
```

---

## まとめ

### 設計の特徴
- **ページ遷移なし**: 各SPAは単一URLで動作
- **状態駆動UI**: GamePhaseに応じてコンポーネントを切り替え
- **再接続対応**: リロード時も状態を復元（gameUtils.ts で補完）
- **途中経過リーダーボード**: 1位伏せ演出で盛り上がりを演出
- **コンポーネント分離**: 各フェーズが独立したコンポーネント
