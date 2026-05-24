# .claude/ ディレクトリについて

このディレクトリには、Claude Codeがプロジェクト開発を効率的に進めるための設定ファイルが含まれています。

## 構成

```
.claude/
├── commands/              # スラッシュコマンド
│   ├── dev-server.md     # 開発サーバー起動
│   ├── setup-project.md  # プロジェクトセットアップ
│   ├── review-api.md     # API仕様レビュー
│   ├── explain-scoring.md # 得点システム説明
│   ├── create-component.md # コンポーネント作成
│   └── test-socket.md    # WebSocket接続テスト
├── context/              # プロジェクトコンテキスト
│   ├── project.md        # プロジェクト概要
│   ├── architecture.md   # アーキテクチャ設計
│   ├── coding-standards.md # コーディング規約
│   └── development-workflow.md # 開発ワークフロー
├── skills/               # カスタムスキル（将来追加予定）
└── README.md            # このファイル
```

## スラッシュコマンドの使い方

Claude Codeで以下のコマンドを使用できます:

- `/dev-server` - サーバーとクライアントの開発環境を起動
- `/setup-project` - プロジェクトの初期セットアップを実行
- `/review-api` - WebSocket API仕様をレビュー
- `/explain-scoring` - 得点システムのルールを説明
- `/create-component <名前>` - Reactコンポーネントのテンプレートを作成
- `/test-socket` - WebSocket接続をテスト

## コンテキストファイル

Claudeはこれらのファイルを参照して、プロジェクトの全体像を把握します:

### project.md
プロジェクトの概要、技術スタック、開発フェーズ、重要な仕様など

### architecture.md
システムアーキテクチャ、ディレクトリ構造、クラス設計、データフロー

### coding-standards.md
TypeScript、React、Socket.ioのコーディング規約とベストプラクティス

### development-workflow.md
開発フェーズ、Git運用、デバッグ方法、トラブルシューティング

## 参考

- [プロジェクトREADME](../README.md)
- [技術仕様書](../docs/TECHNICAL_SPEC.md)
