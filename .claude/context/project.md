# プロジェクトコンテキスト: Quize Second

## プロジェクト概要

WebSocketを使用した最大100名参加可能な4択クイズゲームシステム。
「2番目に多く選ばれた選択肢」を選んだプレイヤーに高得点が付与される戦略性の高いゲーム。

## 技術スタック（実際に使用しているもの）

### フロントエンド
- React 18.x + TypeScript
- Vite (ビルドツール)
- Socket.io-client 4.7.2 (WebSocket通信)
- React Router 6.x
- CSS カスタムプロパティ（`src/styles/theme.ts` でデザイントークン管理）
- ※ TailwindCSS・Zustand は**未使用**

### バックエンド
- Node.js 18.x+ + TypeScript
- Socket.io 4.7.2 (WebSocketサーバー)
- Express 4.18.2 (HTTPサーバー)
- インメモリ状態管理（Redis は**未使用**）
- tsx (TypeScript実行・開発時ホットリロード)

### デプロイ先（予定）
- バックエンド: Railway または Render（WebSocket対応）
- フロントエンド: Vercel または Netlify

## アーキテクチャ

### 3画面構成
1. **ホスト画面** (`/host`) - PC/タブレット - ゲーム進行管理
2. **プレイヤー画面** (`/play`) - スマートフォン - 回答入力
3. **共有画面** (`/display/:roomCode`) - プロジェクター - 問題・結果表示

### 実際のプロジェクト構造

```
quize-second/
├── src/                         # フロントエンド（React）
│   ├── App.tsx                  # ルーティング
│   ├── contexts/
│   │   └── SocketContext.tsx    # WebSocket + フェーズ管理コンテキスト
│   ├── lib/
│   │   ├── socket.ts            # Socket.io クライアント
│   │   └── gameUtils.ts         # 状態復元ユーティリティ
│   ├── pages/
│   │   ├── host/               # ホスト画面 (12コンポーネント)
│   │   ├── player/             # プレイヤー画面 (10コンポーネント)
│   │   └── display/            # 共有画面 (12コンポーネント)
│   └── styles/
│       └── theme.ts             # CSS カスタムプロパティ（デザイントークン）
│
├── server/                      # バックエンド（Node.js）
│   ├── index.ts                 # サーバーエントリーポイント
│   ├── managers/
│   │   ├── RoomManager.ts       # ルーム管理
│   │   ├── PlayerManager.ts     # プレイヤー管理
│   │   ├── GameFlowManager.ts   # ゲーム進行・採点ロジック
│   │   └── TemplateManager.ts   # クイズテンプレート管理
│   ├── socket/
│   │   └── handlers.ts          # Socket.io イベントハンドラー
│   └── templates/               # クイズテンプレートJSON
│
├── types/                       # 共通型定義（サーバー・クライアント共有）
│   ├── game.ts                  # ゲーム状態・フェーズ型（GamePhase enum: 16フェーズ）
│   └── events.ts                # WebSocketイベント型（Client→Server: 31個、Server→Client: 21個）
│
├── templates/                   # クライアント側テンプレートJSONのコピー
├── scripts/                     # 開発用スクリプト
│   └── bot-players.ts           # Botプレイヤー自動接続スクリプト
└── docs/                        # 仕様ドキュメント
```

### 得点システム（ユニーク）

| 状況 | ポイント |
|---|---|
| 正解のみ | 1pt |
| 2番目に多く選ばれた選択肢のみ | 2pt |
| 正解かつ2番目人気 | 3pt |
| その他 | 0pt |

詳細: [docs/SCORING_RULES.md](../../docs/SCORING_RULES.md)

## ゲームフェーズ（16フェーズ）

```
LOBBY → RECEPTION_CLOSED → GAME_INTRO → QUIZ_PREPARE
  → QUIZ_SHOWING_QUESTION → QUIZ_SHOWING_IMAGE → QUIZ_SHOWING_CHOICES
  → QUIZ_ACTIVE → QUIZ_CLOSED
  → RESULT_SHOWING_ANNOUNCE → RESULT_SHOWING_ANSWER → RESULT_SHOWING_VOTES
  → [INTERIM_LEADERBOARD →] QUIZ_PREPARE（繰り返し）
  → FINAL_RESULT → GAME_OVER
```

## 開発フェーズ進捗

- **Phase 1** ✅ 基本設計・型定義（完了）
- **Phase 2** ✅ サーバー実装（完了）
- **Phase 3** ✅ UI/UX実装（完了）
- **Phase 4** ⏳ テスト・デプロイ（現在ここ）
  - 負荷テスト（100名同時接続）
  - バグ修正
  - デプロイ設定（Railway + Vercel/Netlify）

## 開発コマンド

```bash
npm run dev          # サーバー + クライアント同時起動（concurrently）
npm run dev:server   # サーバーのみ (port 3000, tsx watch)
npm run dev:client   # クライアントのみ (port 5173, Vite)
npm run type-check   # TypeScript型チェック（全体）
npm run build        # フロントエンド + サーバー両方ビルド
```

## 参考ファイル

- 技術詳細: [docs/TECHNICAL_SPEC.md](../../docs/TECHNICAL_SPEC.md)
- API詳細: [docs/API_SPEC.md](../../docs/API_SPEC.md)
- 得点ロジック: [docs/SCORING_RULES.md](../../docs/SCORING_RULES.md)
- 画面仕様: [docs/SCREEN_SPEC.md](../../docs/SCREEN_SPEC.md)
- 状態管理: [docs/STATE_MANAGEMENT.md](../../docs/STATE_MANAGEMENT.md)
- テンプレート仕様: [docs/QUIZ_TEMPLATE_SPEC.md](../../docs/QUIZ_TEMPLATE_SPEC.md)
