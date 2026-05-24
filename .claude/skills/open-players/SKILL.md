---
description: プレイヤー画面をブラウザで複数タブ/ウィンドウ開く
---

プレイヤー画面（http://localhost:5173/play）をブラウザで複数開きます。

## 引数

引数は以下の形式で受け取る：

```
[count] [--room ROOM_CODE]
```

| 引数 | 説明 | デフォルト |
|---|---|---|
| `count` | 開く台数 | 10 |
| `--room` | ルームコード（指定するとURLに `?room=CODE` が付く） | なし |

## 手順

1. 引数を解析して台数とルームコードを取得する。
2. ルームコードが指定されていれば URL は `http://localhost:5173/play?room=ROOM_CODE`、なければ `http://localhost:5173/play`。
3. macOSの `open -na "Google Chrome" --args` を使ってタブを開く。

## 実行コマンド

台数を N、URLを URL とすると、以下を実行する：

```bash
for i in $(seq 1 N); do open -na "Google Chrome" --args "URL"; sleep 0.2; done
```

## 補足

- サーバーとクライアントが起動していない場合は先に `/dev-server` を実行するよう案内する
