---
description: TypeScriptの型定義に関するルール。GamePhaseの使い方など。
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

## TypeScript 型定義ルール

- ゲームフェーズは `types/game.ts` の `GamePhase` enum を使う。文字列リテラルで代替しない
- 新しいゲーム状態のプロパティは `types/game.ts` の `RoomState` インターフェースに追加する
- 型定義はサーバー・クライアント共通の `types/` ディレクトリで一元管理する。各ディレクトリに独自型を作らない
