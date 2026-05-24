---
description: 指定したゲームフェーズの実装全体（サーバー・クライアント3画面）をトレースしてデバッグ支援
---

問題が起きているゲームフェーズを指定すると、関連するサーバー・クライアントコードを全て調査してデバッグ情報を提供します。

## 使い方

```
/debug-phase <PHASE_NAME>
```

例:
```
/debug-phase QUIZ_ACTIVE
/debug-phase RESULT_SHOWING_VOTES
/debug-phase INTERIM_LEADERBOARD
```

## フェーズ一覧

| フェーズ名 | 説明 | 前のフェーズ | 次のフェーズ |
|---|---|---|---|
| `LOBBY` | ロビー（プレイヤー待機中） | - | RECEPTION_CLOSED |
| `RECEPTION_CLOSED` | 受付終了 | LOBBY | GAME_INTRO |
| `GAME_INTRO` | ゲーム開始演出 | RECEPTION_CLOSED | QUIZ_PREPARE |
| `QUIZ_PREPARE` | 問題準備中 | GAME_INTRO / INTERIM_LEADERBOARD | QUIZ_SHOWING_QUESTION |
| `QUIZ_SHOWING_QUESTION` | 問題文表示 | QUIZ_PREPARE | QUIZ_SHOWING_IMAGE |
| `QUIZ_SHOWING_IMAGE` | 問題画像表示 | QUIZ_SHOWING_QUESTION | QUIZ_SHOWING_CHOICES |
| `QUIZ_SHOWING_CHOICES` | 選択肢表示 | QUIZ_SHOWING_IMAGE | QUIZ_ACTIVE |
| `QUIZ_ACTIVE` | 回答受付中（タイマー） | QUIZ_SHOWING_CHOICES | QUIZ_CLOSED |
| `QUIZ_CLOSED` | 回答締切 | QUIZ_ACTIVE | RESULT_SHOWING_ANNOUNCE |
| `RESULT_SHOWING_ANNOUNCE` | 正解発表前 | QUIZ_CLOSED | RESULT_SHOWING_ANSWER |
| `RESULT_SHOWING_ANSWER` | 正解発表 | RESULT_SHOWING_ANNOUNCE | RESULT_SHOWING_VOTES |
| `RESULT_SHOWING_VOTES` | 得票数グラフ表示 | RESULT_SHOWING_ANSWER | QUIZ_PREPARE / INTERIM_LEADERBOARD / FINAL_RESULT |
| `INTERIM_LEADERBOARD` | 途中経過リーダーボード | RESULT_SHOWING_VOTES | QUIZ_PREPARE |
| `FINAL_RESULT` | 最終ランキング | RESULT_SHOWING_VOTES | GAME_OVER |
| `GAME_OVER` | ゲーム終了 | FINAL_RESULT | - |

## 調査手順

指定されたフェーズに対して、以下のファイルを全て読み込んでトレースする:

### サーバーサイド

1. `server/managers/GameFlowManager.ts`
   - フェーズ遷移メソッド
   - イベント emit タイミング
   - 採点・集計ロジック

2. `server/socket/handlers.ts`
   - このフェーズに入るイベントハンドラー
   - このフェーズから出るイベントハンドラー

3. `types/events.ts`
   - 使用するイベントの型定義

### クライアントサイド（3画面）

4. `src/pages/host/components/Host<フェーズ名に対応>.tsx`
5. `src/pages/player/components/Player<フェーズ名に対応>.tsx`
6. `src/pages/display/components/Display<フェーズ名に対応>.tsx`
7. `src/contexts/SocketContext.tsx`（フェーズ変更の受信処理）

### 調査レポート形式

```
## フェーズ: <PHASE_NAME> デバッグレポート

### イベントフロー
入口イベント: <サーバーがemitするevent名>
  └─ ホスト画面: <受信・表示内容>
  └─ プレイヤー画面: <受信・表示内容>
  └─ ディスプレイ画面: <受信・表示内容>

出口イベント: <クライアントがemitするevent名>
  └─ トリガー: <ホストのボタン操作など>

### サーバー処理
- <フェーズ遷移時に実行される処理>
- <データ更新内容>

### 疑わしい箇所
- <潜在的なバグ・問題点があれば指摘>

### よくある問題
- <このフェーズで起きやすい問題と解決策>
```

ユーザーが「〇〇が動かない」と具体的な症状を教えてくれた場合は、その症状に対応する原因を特定して修正案を提示する。
