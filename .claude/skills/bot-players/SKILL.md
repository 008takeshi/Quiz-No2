---
description: Socket.io Botプレイヤーを複数接続して自動回答させる
---

`scripts/bot-players.ts` を使い、Socket.ioのBotプレイヤーを複数接続して自動回答させます。

## 使い方

```
/bot-players --room <ROOM_CODE> [--count N] [--mode random|correct|wrong] [--delay ms]
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--room` | 参加するルームコード（必須） | - |
| `--count` | Bot台数 | 10 |
| `--mode` | 回答モード | random |
| `--delay` | 回答遅延の最大値[ms] | 3000 |
| `--url` | サーバーURL | http://localhost:3000 |

### 回答モード

- `random` : ランダムに選ぶ（テスト用）
- `correct` : 常に正解を選ぶ（高得点Bot）
- `wrong` : 常に不正解を選ぶ（分布テスト用）

## 手順

1. ユーザーが指定した引数でコマンドを組み立てる。
2. バックグラウンドで以下を実行する（`run_in_background: true`）：

```bash
npx tsx scripts/bot-players.ts --room <ROOM_CODE> [オプション]
```

3. 実行結果（参加成功数など）をユーザーに報告する。
4. Botを止めたい場合は「Botを止めて」と指示してもらう（プロセスをkillする）。

## 例

```
/bot-players --room ABC123 --count 5 --mode correct
```

→ 5人のBotがルームABC123に参加し、全問正解を選び続ける。
