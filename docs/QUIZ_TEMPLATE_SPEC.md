# クイズテンプレート仕様書

## 概要

クイズゲームで使用する問題セットをテンプレートファイルとして管理します。
- **デフォルトテンプレート**: サーバーに事前配置
- **外部テンプレート**: ホストがルーム作成時にアップロード

---

## テンプレートファイル形式

### JSON形式（推奨）

```json
{
  "title": "日本の地理クイズ",
  "description": "日本の都道府県や地形に関する問題",
  "author": "クイズマスター",
  "version": "1.0",
  "createdAt": "2024-01-01T00:00:00Z",

  "settings": {
    "defaultTimeLimit": 30,
    "shuffleQuestions": false,
    "shuffleChoices": true
  },

  "quizzes": [
    {
      "id": 1,
      "question": "日本の首都は？",
      "choices": [
        "東京",
        "大阪",
        "京都",
        "名古屋"
      ],
      "correctAnswer": 0,
      "timeLimit": 30,
      "category": "地理",
      "difficulty": "easy",
      "explanation": "日本の首都は東京です。1868年の明治維新以降、政治・経済の中心地となりました。"
    },
    {
      "id": 2,
      "question": "この建物は何？",
      "image": {
        "url": "https://example.com/images/tokyo-tower.jpg",
        "alt": "東京タワーの写真",
        "caption": "東京にある有名な建造物"
      },
      "choices": [
        "東京タワー",
        "スカイツリー",
        "通天閣",
        "五重塔"
      ],
      "correctAnswer": 0,
      "category": "地理",
      "difficulty": "easy",
      "explanation": "東京タワーは1958年に完成した高さ333mの電波塔です。"
    },
    {
      "id": 3,
      "question": "富士山がある都道府県は？",
      "choices": [
        "静岡県のみ",
        "山梨県のみ",
        "静岡県と山梨県",
        "長野県と山梨県"
      ],
      "correctAnswer": 2,
      "timeLimit": 30,
      "category": "地理",
      "difficulty": "medium",
      "explanation": "富士山は静岡県と山梨県の県境にまたがっています。"
    }
  ]
}
```

---

## 型定義（TypeScript）

```typescript
/**
 * クイズテンプレート全体
 */
interface QuizTemplate {
  // ========== メタデータ ==========

  /** テンプレートのタイトル（必須、1-100文字） */
  title: string;

  /** 説明（オプション、1-500文字） */
  description?: string;

  /** 作成者（オプション、1-50文字） */
  author?: string;

  /** バージョン（必須、例: "1.0", "2.1.3"） */
  version: string;

  /** 作成日時（オプション、ISO 8601形式） */
  createdAt?: string;

  // ========== 設定 ==========

  settings: QuizSettings;

  // ========== 問題リスト ==========

  /** 問題リスト（必須、1-100問） */
  quizzes: Quiz[];
}

/**
 * クイズ設定
 */
interface QuizSettings {
  /** デフォルト制限時間（必須、5-300秒） */
  defaultTimeLimit: number;

  /** 問題をシャッフル（オプション、デフォルト: false） */
  shuffleQuestions?: boolean;

  /** 選択肢をシャッフル（オプション、デフォルト: false） */
  shuffleChoices?: boolean;
}

/**
 * 個別の問題
 */
interface Quiz {
  /** 問題ID（必須、テンプレート内で一意） */
  id: number | string;

  /** 問題文（必須、1-500文字） */
  question: string;

  /** 問題画像（オプション、URL形式） */
  image?: QuizImage;

  /** 4択の選択肢（必須、各1-200文字） */
  choices: [string, string, string, string];

  /** 選択肢画像（オプション、4つの選択肢に対応） */
  choiceImages?: [QuizImage | null, QuizImage | null, QuizImage | null, QuizImage | null];

  /** 正解のインデックス（必須、0-3） */
  correctAnswer: 0 | 1 | 2 | 3;

  /** 個別の制限時間（オプション、省略時はdefaultTimeLimit） */
  timeLimit?: number;

  /** カテゴリー（オプション、1-50文字） */
  category?: string;

  /** 難易度（オプション） */
  difficulty?: 'easy' | 'medium' | 'hard';

  /** 解説（オプション、1-1000文字）将来的に結果画面で表示 */
  explanation?: string;
}

/**
 * クイズ画像
 */
interface QuizImage {
  /** 画像URL（必須、https://推奨） */
  url: string;

  /** 代替テキスト（オプション、1-200文字） */
  alt?: string;

  /** キャプション（オプション、1-200文字） */
  caption?: string;
}
```

---

## バリデーションルール

### メタデータ

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| `title` | ✅ | string | 1-100文字 |
| `description` | ❌ | string | 1-500文字 |
| `author` | ❌ | string | 1-50文字 |
| `version` | ✅ | string | 1-20文字、セマンティックバージョニング推奨 |
| `createdAt` | ❌ | string | ISO 8601形式 |

### 設定

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| `defaultTimeLimit` | ✅ | number | 5-300秒 |
| `shuffleQuestions` | ❌ | boolean | true/false |
| `shuffleChoices` | ❌ | boolean | true/false |

### 問題

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| `id` | ✅ | number or string | テンプレート内で一意 |
| `question` | ✅ | string | 1-500文字 |
| `image` | ❌ | QuizImage | 問題画像（URL形式） |
| `choices` | ✅ | string[4] | 各1-200文字 |
| `choiceImages` | ❌ | QuizImage[4] | 選択肢画像（各nullも可） |
| `correctAnswer` | ✅ | 0\|1\|2\|3 | 0-3の整数 |
| `timeLimit` | ❌ | number | 5-300秒 |
| `category` | ❌ | string | 1-50文字 |
| `difficulty` | ❌ | enum | 'easy', 'medium', 'hard' |
| `explanation` | ❌ | string | 1-1000文字 |

### 画像（QuizImage）

| フィールド | 必須 | 型 | 制約 |
|-----------|------|-----|------|
| `url` | ✅ | string | 画像URL（https://推奨、最大500文字） |
| `alt` | ❌ | string | 代替テキスト（1-200文字） |
| `caption` | ❌ | string | キャプション（1-200文字） |

### 全体の制約

- 問題数: 1-100問
- ファイルサイズ: 最大5MB

---

## デフォルトテンプレート

### サーバー配置場所

```
server/
├── templates/
│   ├── default.json              # デフォルトクイズ（10問）
│   ├── geography-japan.json      # 日本地理クイズ（20問）
│   ├── general-knowledge.json    # 一般知識クイズ（30問）
│   ├── science.json              # 理科クイズ（20問）
│   └── history-japan.json        # 日本史クイズ（25問）
```

### テンプレート一覧取得API

**HTTP GET `/api/templates`**

レスポンス:
```json
{
  "templates": [
    {
      "id": "default",
      "title": "デフォルトクイズ",
      "description": "サンプル問題10問",
      "questionCount": 10,
      "categories": ["雑学", "地理"]
    },
    {
      "id": "geography-japan",
      "title": "日本地理クイズ",
      "description": "都道府県や地形に関する問題",
      "questionCount": 20,
      "categories": ["地理"]
    }
  ]
}
```

---

## 外部テンプレート読み込み

### ルーム作成時の選択

ホスト画面のルーム作成フォームで選択:

1. **デフォルトテンプレートを使用**
   - ドロップダウンからテンプレートを選択
   - サーバーに配置されたテンプレートを使用

2. **ファイルをアップロード**
   - JSON/YAML形式のファイルを選択
   - ドラッグ&ドロップ対応
   - アップロード後、サーバー側でバリデーション

### WebSocket API

**Client → Server: `createRoom`**

```typescript
interface CreateRoomRequest {
  hostName: string;
  settings?: Partial<GameSettings>;

  template: {
    type: 'default';
    name: string;  // 'default', 'geography-japan', etc.
  } | {
    type: 'upload';
    data: QuizTemplate;
  };
}

// 例1: デフォルトテンプレート
socket.emit('createRoom', {
  hostName: 'ホスト太郎',
  template: {
    type: 'default',
    name: 'geography-japan'
  }
});

// 例2: アップロード
socket.emit('createRoom', {
  hostName: 'ホスト太郎',
  template: {
    type: 'upload',
    data: {
      title: "カスタムクイズ",
      version: "1.0",
      settings: { defaultTimeLimit: 30 },
      quizzes: [...]
    }
  }
});
```

**Server → Client: `roomCreated`**

```typescript
interface RoomCreatedResponse {
  roomId: string;
  hostId: string;
  hostName: string;
  settings: GameSettings;
  template: {
    title: string;
    totalQuestions: number;
  };
}
```

### エラーハンドリング

```typescript
socket.on('error', (error) => {
  if (error.code === 'INVALID_TEMPLATE') {
    // テンプレートのバリデーションエラー
    console.error('Template errors:', error.details);
    // error.details = ['問題1: 選択肢は4つ必要です', ...]
  }
});
```

---

## ゲーム進行フロー

### 自動出題モード（推奨）

テンプレートに含まれる問題を順番に自動出題:

```typescript
// ホスト画面でゲーム開始
socket.emit('startGame');

// サーバーが自動的に最初の問題を出題
// → quizStarted イベント

// プレイヤーが回答
// → 制限時間終了 or 全員回答

// サーバーが結果を送信
// → quizResult イベント

// ホストが「次へ」をクリック
socket.emit('nextQuiz');

// サーバーが次の問題を出題
// → quizStarted イベント

// ... 繰り返し

// 全問題終了
// → gameOver イベント
```

### 問題番号の表示

```typescript
interface QuizStartedEvent {
  quizId: string;
  questionNumber: number;      // 現在の問題番号（1始まり）
  totalQuestions: number;      // 総問題数
  question: string;
  choices: [string, string, string, string];
  timeLimit: number;
  startedAt: string;
  endsAt: string;
}
```

画面には「問題 3/10」のように表示

---

## シャッフル機能

### 問題のシャッフル

`settings.shuffleQuestions: true` の場合、ゲーム開始時にランダムな順序で出題

```typescript
if (template.settings.shuffleQuestions) {
  template.quizzes = shuffleArray(template.quizzes);
}
```

### 選択肢のシャッフル

`settings.shuffleChoices: true` の場合、各問題で選択肢をランダムに並び替え

```typescript
if (template.settings.shuffleChoices) {
  const shuffled = shuffleChoices(quiz.choices, quiz.correctAnswer);
  quiz.choices = shuffled.choices;
  quiz.correctAnswer = shuffled.correctAnswer;
}

function shuffleChoices(
  choices: [string, string, string, string],
  correctAnswer: number
): { choices: [string, string, string, string], correctAnswer: number } {
  const correctChoice = choices[correctAnswer];
  const shuffled = shuffleArray([...choices]);
  const newCorrectAnswer = shuffled.indexOf(correctChoice);

  return {
    choices: shuffled as [string, string, string, string],
    correctAnswer: newCorrectAnswer as 0 | 1 | 2 | 3
  };
}
```

**重要**: シャッフル後も正解のインデックスを正しく更新する

---

## サンプルテンプレート

### default.json（シンプル版）

```json
{
  "title": "デフォルトクイズ",
  "version": "1.0",
  "settings": {
    "defaultTimeLimit": 30
  },
  "quizzes": [
    {
      "id": 1,
      "question": "1 + 1 = ?",
      "choices": ["1", "2", "3", "4"],
      "correctAnswer": 1
    },
    {
      "id": 2,
      "question": "地球で最も大きな海は？",
      "choices": ["大西洋", "太平洋", "インド洋", "北極海"],
      "correctAnswer": 1
    }
  ]
}
```

### geography-japan.json（詳細版）

```json
{
  "title": "日本地理クイズ",
  "description": "都道府県、地形、気候に関する20問",
  "author": "地理教師",
  "version": "2.0",
  "createdAt": "2024-01-15T00:00:00Z",

  "settings": {
    "defaultTimeLimit": 30,
    "shuffleQuestions": true,
    "shuffleChoices": true
  },

  "quizzes": [
    {
      "id": "geo_001",
      "question": "日本で最も面積が大きい都道府県は？",
      "choices": ["北海道", "岩手県", "福島県", "長野県"],
      "correctAnswer": 0,
      "category": "都道府県",
      "difficulty": "easy",
      "explanation": "北海道は83,424 km²で日本最大の面積を持ちます。"
    },
    {
      "id": "geo_002",
      "question": "日本で最も人口が多い都道府県は？",
      "choices": ["東京都", "神奈川県", "大阪府", "愛知県"],
      "correctAnswer": 0,
      "timeLimit": 20,
      "category": "都道府県",
      "difficulty": "easy",
      "explanation": "東京都は約1400万人で日本最多の人口です。"
    }
  ]
}
```

---

## テンプレート作成ガイド

### 推奨事項

1. **問題の難易度バランス**
   - easy: 60%
   - medium: 30%
   - hard: 10%

2. **制限時間の設定**
   - 簡単な問題: 15-20秒
   - 標準的な問題: 30秒
   - 難しい問題: 45-60秒

3. **選択肢の作り方**
   - 明らかに間違っている選択肢を1つ入れる（消去法対策）
   - 似ている選択肢を2つ入れる（思考を促す）
   - 正解と紛らわしい選択肢を1つ入れる（上級者向け）

4. **カテゴリー分け**
   - 同じカテゴリーの問題を連続させない
   - バラエティ豊かな内容にする

5. **解説の追加**
   - 正解の理由を簡潔に説明
   - 関連する豆知識を追加（エンターテイメント性）

### 問題作成のコツ

```json
{
  "question": "良い問題の例: 具体的で明確",
  "choices": [
    "正解（明確で短い）",
    "不正解だが妥当性がある",
    "不正解だが紛らわしい",
    "明らかに不正解"
  ],
  "correctAnswer": 0,
  "explanation": "短く分かりやすい解説"
}
```

---

## 画像付き問題の使用例

### パターン1: 問題文に画像を追加

```json
{
  "id": "img_001",
  "question": "この建物は何？",
  "image": {
    "url": "https://example.com/images/tokyo-tower.jpg",
    "alt": "東京タワーの写真",
    "caption": "東京にある有名な建造物"
  },
  "choices": [
    "東京タワー",
    "スカイツリー",
    "通天閣",
    "五重塔"
  ],
  "correctAnswer": 0,
  "category": "建築",
  "difficulty": "easy"
}
```

### パターン2: 選択肢が画像（国旗クイズなど）

```json
{
  "id": "img_002",
  "question": "日本の国旗はどれ？",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "choiceImages": [
    {
      "url": "https://example.com/flags/japan.png",
      "alt": "日本の国旗"
    },
    {
      "url": "https://example.com/flags/china.png",
      "alt": "中国の国旗"
    },
    {
      "url": "https://example.com/flags/korea.png",
      "alt": "韓国の国旗"
    },
    {
      "url": "https://example.com/flags/thailand.png",
      "alt": "タイの国旗"
    }
  ],
  "correctAnswer": 0,
  "category": "国旗",
  "difficulty": "easy"
}
```

### パターン3: 問題と選択肢の一部に画像

```json
{
  "id": "img_003",
  "question": "この動物は何科？",
  "image": {
    "url": "https://example.com/animals/panda.jpg",
    "alt": "パンダの写真"
  },
  "choices": [
    "クマ科",
    "ネコ科",
    "イヌ科",
    "アライグマ科"
  ],
  "correctAnswer": 0,
  "category": "動物",
  "difficulty": "medium"
}
```

### パターン4: 画像なしの通常問題（混在可能）

```json
{
  "id": "normal_001",
  "question": "日本の首都は？",
  "choices": ["東京", "大阪", "京都", "名古屋"],
  "correctAnswer": 0,
  "category": "地理",
  "difficulty": "easy"
}
```

### 画像使用時の注意点

1. **URL形式**
   - HTTPS推奨（セキュリティ）
   - 公開アクセス可能なURL
   - 永続的なURL（短縮URLは避ける）

2. **画像サイズ**
   - 推奨: 1200×800px以下（問題画像）
   - 推奨: 400×400px以下（選択肢画像）
   - ファイルサイズ: 500KB以下推奨

3. **対応フォーマット**
   - JPEG (.jpg, .jpeg)
   - PNG (.png)
   - GIF (.gif)
   - WebP (.webp)

4. **代替テキスト**
   - アクセシビリティのため必ず設定
   - 画像が表示されない場合の説明

5. **画像ホスティングサービス**
   - Imgur
   - Cloudinary
   - GitHub Pages
   - 独自サーバー

### プレイヤー画面での表示

- **基本動作**: 「共有画面を見てください」と表示
- **画像なし**: 通常通り選択肢のみ表示
- **画像あり**: 共有画面（プロジェクター）で大きく表示

---

## 将来的な拡張案

1. **複数正解**
   - `correctAnswers: [0, 2]` 形式

2. **タグ機能**
   - `tags: ['初心者向け', '雑学', '日本']`

3. **問題プール**
   - 100問から20問をランダム抽出

4. **動的難易度調整**
   - プレイヤーの正解率に応じて難易度を変更

5. **音声・動画対応**
   - 音声ファイルの再生
   - 動画クリップの埋め込み
