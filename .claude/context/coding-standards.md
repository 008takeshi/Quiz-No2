# コーディング規約

## 全般

- **言語**: TypeScript (厳格な型付け)
- **コードフォーマット**: Prettier
- **Linter**: ESLint
- **命名規則**: camelCase (変数・関数), PascalCase (型・コンポーネント), UPPER_CASE (定数)

## TypeScript

### 型定義

```typescript
// ✅ Good: 明示的な型定義
interface Player {
  id: string;
  name: string;
  score: number;
}

// ❌ Bad: any型の使用
const data: any = {};
```

### 型ガード

```typescript
// ✅ Good: 型ガードの使用
function isPlayer(obj: unknown): obj is Player {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'score' in obj
  );
}
```

## React

### コンポーネント

```typescript
// ✅ Good: 関数コンポーネント + 型定義
interface QuizCardProps {
  question: string;
  choices: string[];
  onAnswer: (index: number) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  choices,
  onAnswer
}) => {
  return (
    <div className="quiz-card">
      <h2>{question}</h2>
      {choices.map((choice, index) => (
        <button key={index} onClick={() => onAnswer(index)}>
          {choice}
        </button>
      ))}
    </div>
  );
};
```

### Hooks

```typescript
// ✅ Good: カスタムフックで状態管理を分離
const useGameRoom = (roomId: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<GameStatus>('waiting');

  useEffect(() => {
    // WebSocket接続処理
  }, [roomId]);

  return { players, status };
};
```

## Socket.io

### イベントハンドラ

```typescript
// ✅ Good: 型安全なイベントハンドラ
socket.on('quizStarted', (data: QuizStartedEvent) => {
  console.log('Quiz started:', data.question);
  setCurrentQuiz(data);
});

// ❌ Bad: 型なしのハンドラ
socket.on('quizStarted', (data) => {
  console.log('Quiz started:', data.question); // dataの型が不明
});
```

### エラーハンドリング

```typescript
// ✅ Good: エラーハンドリング
socket.emit('joinRoom', { roomId, playerName }, (response) => {
  if (response.error) {
    console.error('Failed to join room:', response.error);
    showErrorToast(response.error.message);
    return;
  }
  console.log('Joined room successfully');
});
```

## エラーハンドリング

### エラー型定義

```typescript
// ✅ Good: カスタムエラー型
class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`);
    this.name = 'RoomNotFoundError';
  }
}

// 使用例
try {
  const room = await findRoom(roomId);
} catch (error) {
  if (error instanceof RoomNotFoundError) {
    // 特定のエラー処理
  } else {
    // 一般的なエラー処理
  }
}
```

## バリデーション

```typescript
// ✅ Good: 入力検証
const validatePlayerName = (name: string): boolean => {
  return (
    name.length >= 1 &&
    name.length <= 20 &&
    /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/.test(name)
  );
};

const validateRoomId = (roomId: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(roomId);
};
```

## コメント

```typescript
// ✅ Good: 複雑なロジックには説明を追加
/**
 * 得点を計算する
 * - 正解のみ: 1pt
 * - 2位の選択肢のみ: 2pt
 * - 正解かつ2位: 3pt
 */
const calculatePoints = (
  choice: number,
  correctAnswer: number,
  rankings: ChoiceRanking[]
): number => {
  const isCorrect = choice === correctAnswer;
  const choiceRank = rankings.find(r => r.choice === choice)?.rank ?? 4;
  const isSecondPlace = choiceRank === 2;

  if (isCorrect && isSecondPlace) return 3;
  if (isCorrect) return 1;
  if (isSecondPlace) return 2;
  return 0;
};
```

## ファイル構成

```
src/
├── components/          # UIコンポーネント
│   ├── common/         # 共通コンポーネント
│   ├── host/           # ホスト画面
│   ├── player/         # プレイヤー画面
│   └── display/        # 共有画面
├── hooks/              # カスタムフック
├── store/              # 状態管理（Zustand）
├── services/           # ビジネスロジック
├── types/              # 型定義
├── utils/              # ユーティリティ
└── constants/          # 定数
```

## テスト

```typescript
// ✅ Good: ユニットテスト
describe('calculatePoints', () => {
  it('正解かつ2位の場合は3ポイント', () => {
    const rankings = [
      { choice: 0, rank: 2, votes: 10 },
      { choice: 1, rank: 1, votes: 15 },
      { choice: 2, rank: 3, votes: 5 },
      { choice: 3, rank: 4, votes: 2 },
    ];

    expect(calculatePoints(0, 0, rankings)).toBe(3);
  });

  it('正解のみの場合は1ポイント', () => {
    const rankings = [
      { choice: 0, rank: 1, votes: 20 },
      { choice: 1, rank: 2, votes: 10 },
    ];

    expect(calculatePoints(0, 0, rankings)).toBe(1);
  });
});
```

## 環境変数

```typescript
// ✅ Good: 型安全な環境変数アクセス
interface Env {
  VITE_API_URL: string;
  VITE_WS_URL: string;
}

const getEnv = (): Env => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;

  if (!apiUrl || !wsUrl) {
    throw new Error('Missing required environment variables');
  }

  return { VITE_API_URL: apiUrl, VITE_WS_URL: wsUrl };
};
```

## パフォーマンス

```typescript
// ✅ Good: メモ化で不要な再レンダリングを防ぐ
const QuizList = ({ quizzes }: { quizzes: Quiz[] }) => {
  const sortedQuizzes = useMemo(
    () => quizzes.sort((a, b) => a.id.localeCompare(b.id)),
    [quizzes]
  );

  return (
    <ul>
      {sortedQuizzes.map(quiz => (
        <QuizItem key={quiz.id} quiz={quiz} />
      ))}
    </ul>
  );
};
```
