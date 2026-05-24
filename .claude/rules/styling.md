---
description: スタイリングのルール。CSSカスタムプロパティの使い方とtheme.tsの扱い方。
globs: ["src/**/*.tsx", "src/**/*.ts", "src/styles/**"]
alwaysApply: false
---

## スタイリングルール

- スタイルは `src/styles/theme.ts` の CSS カスタムプロパティ（`var(--token-name)`）を使う
- TailwindCSS は**インストールされていないため使わない**
- className によるユーティリティクラスも使わない
- スタイルはインラインスタイル（`style={{ color: 'var(--color-primary)' }}`）か CSS モジュールで適用する
- 新しいデザイントークンが必要なら `src/styles/theme.ts` に追加してから使う。コンポーネントにハードコードしない
