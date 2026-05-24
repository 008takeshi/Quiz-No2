# 開発ワークフロー

## 開発環境セットアップ

### 1. 初回セットアップ

```bash
# プロジェクトのクローン
cd quize-second

# サーバーのセットアップ
cd server
npm install

# クライアントのセットアップ
cd ../client
npm install
```

### 2. 環境変数の設定

**サーバー（server/.env）**
```
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379  # オプション
```

**クライアント（client/.env）**
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 3. 開発サーバー起動

```bash
# サーバー起動（ターミナル1）
cd server
npm run dev

# クライアント起動（ターミナル2）
cd client
npm run dev
```

## 開発フェーズ

### Phase 1: 基本セットアップ

**目標**: プロジェクト構造の構築とWebSocket接続テスト

**タスク**:
1. サーバープロジェクトのセットアップ
2. クライアントプロジェクトのセットアップ
3. WebSocket接続テスト

### Phase 2: コア機能実装

**目標**: ゲームの基本機能を実装

**タスク**:
1. バックエンド実装（GameRoom, Player, Quiz, ScoreCalculator）
2. フロントエンド実装（状態管理、カスタムフック）
3. WebSocket API実装

### Phase 3: UI/UX実装

**目標**: 3つの画面のUIを完成させる

### Phase 4: テスト・デプロイ

**目標**: 品質保証とデプロイ

## Git ワークフロー

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
```
