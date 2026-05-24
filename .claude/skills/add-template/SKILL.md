---
description: 指定テーマでクイズテンプレートJSONを生成してserver/templatesとtemplatesに追加
---

テーマを指定するだけで、ゲームのユニークな得点システム（2番目人気狙い）を意識したクイズテンプレートを生成し、必要なディレクトリに配置します。

## 使い方

```
/add-template <テーマ> [--questions N] [--difficulty easy|medium|hard] [--time S]
```

| 引数 | 説明 | デフォルト |
|---|---|---|
| `テーマ` | クイズのテーマ（例: 「日本の歴史」「プログラミング」「映画」） | 必須 |
| `--questions` | 問題数 | 10 |
| `--difficulty` | 難易度 | medium |
| `--time` | 1問あたりの制限時間（秒） | 20 |

## 手順

1. テーマと設定を確認する。

2. `docs/QUIZ_TEMPLATE_SPEC.md` のスキーマに従ってJSONを生成する:
   - `id`: `<theme>-<4桁ランダム英数字>` 形式
   - `metadata.title`, `description`, `category`, `difficulty`, `tags` を設定
   - `settings.defaultTimeLimit`: 引数の `--time` 値
   - `questions`: 指定数の問題（各問4択）

3. 問題を作成する際の注意点（このゲームのユニークな得点システムを活かす）:
   - **誘い選択肢を意図的に含める**: 正解に似た選択肢（引っかかりやすい）を1つ用意する。この選択肢が「2番目人気」になりやすく、高得点を取れる
   - **全選択肢に意味を持たせる**: ランダムな選択肢ではなく、それぞれに理由がある選択肢を
   - **問題文は明確に**: 読み間違いがないよう簡潔に

4. ファイルを2箇所に保存する:
   - `server/templates/<id>.json`
   - `templates/<id>.json`

5. 生成したテンプレートの概要をユーザーに報告:
   ```
   テンプレート追加完了: <タイトル>
   - ID: <id>
   - 問題数: N問
   - カテゴリ: <category>
   - 難易度: <difficulty>
   - 制限時間: Xs/問
   
   問題一覧:
   1. <問題文1> (正解: <選択肢>)
   2. <問題文2> (正解: <選択肢>)
   ...
   ```

## テンプレートJSON形式参照

`server/templates/default.json` を参照してフォーマットを確認すること。
詳細スキーマは `docs/QUIZ_TEMPLATE_SPEC.md` を参照。
