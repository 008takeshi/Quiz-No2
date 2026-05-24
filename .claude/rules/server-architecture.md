---
description: サーバーのアーキテクチャルール。インメモリ管理、Manager分離など。
globs: ["server/**"]
alwaysApply: false
---

## サーバーアーキテクチャルール

- 状態管理はインメモリのみ。Redis・外部DBは使わない
- ルーム・プレイヤー・ゲーム進行の責務は各 Manager クラスに分離する
  - `RoomManager` — ルームの作成・削除・取得
  - `PlayerManager` — プレイヤーの追加・削除・更新
  - `GameFlowManager` — ゲーム進行・フェーズ遷移・採点
  - `TemplateManager` — クイズテンプレートの読み込み・検証
- `server/socket/handlers.ts` にビジネスロジックを書かない。Manager を呼ぶだけにする
- クイズテンプレートは `server/templates/` に JSON で配置する。コードにハードコードしない
