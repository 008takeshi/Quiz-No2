---
description: WebSocketイベントの追加・変更時のルール。types/events.tsを先に更新することなど。
globs: ["types/events.ts", "server/socket/**", "src/contexts/SocketContext.tsx"]
alwaysApply: false
---

## WebSocket イベントルール

- 新しいイベントを実装する前に**必ず先に** `types/events.ts` を更新する
- サーバーの `emit` 名とクライアントの `on` 名は `types/events.ts` の型定義上で一致させる
- イベントの追加・変更は `docs/API_SPEC.md` にも反映する
- ビジネスロジックは `server/managers/` に書く。`server/socket/handlers.ts` は Manager を呼ぶだけにする
- クライアント側のイベント受信は `src/contexts/SocketContext.tsx` に集約する。各コンポーネントで直接 `socket.on` しない

### 命名規則

- Client → Server: `camelCase`（動詞始まり）例: `startGame`, `submitAnswer`
- Server → Client: `camelCase`（名詞・動詞混在可）例: `quizActive`, `playerJoined`
