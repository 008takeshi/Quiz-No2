# CLAUDE.md — Quize Second

WebSocketを使ったリアルタイム4択クイズゲーム。3画面構成（ホスト/プレイヤー/ディスプレイ）。
「2番目に多く選ばれた選択肢」を選んだプレイヤーに高得点が付与されるユニークな得点システム。

## 現在のフェーズ

Phase 4（テスト・デプロイ）進行中。Phase 1〜3（設計・サーバー・UI）は完了済み。

## 主要ドキュメント

| 内容 | ファイル |
|---|---|
| WebSocket API | `docs/API_SPEC.md` |
| 得点ルール | `docs/SCORING_RULES.md` |
| 画面仕様 | `docs/SCREEN_SPEC.md` |
| 状態管理・フェーズ遷移 | `docs/STATE_MANAGEMENT.md` |
| テンプレート仕様 | `docs/QUIZ_TEMPLATE_SPEC.md` |

## ルール

詳細ルールは `.claude/rules/` を参照:

- `styling.md` — CSS カスタムプロパティの使い方（TailwindCSS禁止）
- `typescript-types.md` — GamePhase enumの使い方・型管理ルール
- `websocket-events.md` — イベント追加前に types/events.ts を更新
- `three-screen-sync.md` — 3画面は常に同期して変更する
- `server-architecture.md` — インメモリ管理・Manager分離
