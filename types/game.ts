/**
 * ゲーム全体の型定義
 * 状態管理仕様書に基づいた型定義
 */

// ============================================
// クイズテンプレート関連
// ============================================

/**
 * テンプレート内の個別問題（JSONファイル形式）
 */
export interface TemplateQuiz {
  id: number | string;
  question: string;
  image?: { url: string; alt?: string; caption?: string };
  choices: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  timeLimit?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

/**
 * クイズテンプレート全体
 */
export interface QuizTemplate {
  title: string;
  description?: string;
  author?: string;
  version: string;
  settings: {
    defaultTimeLimit: number;
    shuffleQuestions?: boolean;
    shuffleChoices?: boolean;
  };
  quizzes: TemplateQuiz[];
}

/**
 * テンプレート一覧用の情報（クライアントに送る）
 */
export interface TemplateInfo {
  id: string;                  // 'default', 'geography-japan' など
  title: string;
  description?: string;
  totalQuizCount: number;
  source: 'server';
}

// ============================================
// ゲームフェーズ（状態）
// ============================================

/**
 * ゲーム全体のフェーズ
 */
export enum GamePhase {
  // 初期フェーズ
  LOBBY = 'LOBBY',                              // ロビー（参加者待ち）
  RECEPTION_CLOSED = 'RECEPTION_CLOSED',        // 受付終了（途中参加不可）
  GAME_INTRO = 'GAME_INTRO',                    // ゲームイントロ（開始演出）
  QUIZ_PREPARE = 'QUIZ_PREPARE',                // 問題準備中（ホストが問題作成中）

  // 出題フェーズ（段階的表示）
  QUIZ_SHOWING_QUESTION = 'QUIZ_SHOWING_QUESTION', // 問題文表示中
  QUIZ_SHOWING_IMAGE = 'QUIZ_SHOWING_IMAGE',       // 問題画像表示中（画像がある場合）
  QUIZ_SHOWING_CHOICES = 'QUIZ_SHOWING_CHOICES',   // 選択肢表示中

  // 回答フェーズ
  QUIZ_ACTIVE = 'QUIZ_ACTIVE',                  // 回答受付中
  QUIZ_CLOSED = 'QUIZ_CLOSED',                  // 回答締切・採点完了

  // 結果表示フェーズ（段階的表示）
  RESULT_SHOWING_ANNOUNCE = 'RESULT_SHOWING_ANNOUNCE', // 結果発表画面（問題文のみ）
  RESULT_SHOWING_ANSWER = 'RESULT_SHOWING_ANSWER',   // 正解発表中（共有画面）
  RESULT_SHOWING_VOTES = 'RESULT_SHOWING_VOTES',     // 得票数表示中（共有画面）
  RESULT_SHOWING_POINTS = 'RESULT_SHOWING_POINTS',   // ポイント発表中（プレイヤー画面のみ）※現在未使用

  // 途中経過フェーズ
  INTERIM_LEADERBOARD = 'INTERIM_LEADERBOARD',       // 途中経過発表（半分終了時点）

  // 最終結果フェーズ
  FINAL_RESULT = 'FINAL_RESULT',                // 最終ランキング表示中（共有画面）
  GAME_OVER = 'GAME_OVER',                      // ゲーム終了
}

// ============================================
// ルーム関連
// ============================================

/**
 * ルーム設定
 */
export interface RoomSettings {
  hostName: string;                             // ホスト名（1-20文字）
  maxPlayers: number;                           // 最大参加者数（10-100）
  defaultTimeLimit: number;                     // デフォルト回答時間（10-120秒）
  allowLateJoin: boolean;                       // 途中参加許可
  totalQuizCount: number;                       // 総問題数（テンプレートから自動設定）
}

/**
 * ルーム全体の状態
 */
export interface RoomState {
  roomId: string;                               // ルームID（UUID）
  roomCode: string;                             // 6桁の参加コード
  phase: GamePhase;                             // 現在のフェーズ
  hostId: string;                               // ホストのプレイヤーID
  settings: RoomSettings;                       // ルーム設定
  players: Map<string, Player>;                 // playerId -> Player
  currentQuiz: Quiz | null;                     // 現在の問題（nullの場合は問題なし）
  quizHistory: QuizResult[];                    // 過去の問題結果
  selectedTemplateId: string | null;            // 選択されたテンプレートID
  preparedQuizzes: QuizForm[];                  // テンプレートから読み込んだ問題リスト
  winnerRevealed: boolean;                      // 1位が発表済みかどうか
  createdAt: number;                            // 作成日時（タイムスタンプ）
  updatedAt: number;                            // 更新日時（タイムスタンプ）
}

// ============================================
// プレイヤー関連
// ============================================

/**
 * プレイヤーの接続状態
 */
export enum PlayerStatus {
  CONNECTED = 'CONNECTED',                      // 接続中
  DISCONNECTED = 'DISCONNECTED',                // 切断中（30秒以内に再接続可能）
  KICKED = 'KICKED',                            // キックされた
}

/**
 * プレイヤー情報
 */
export interface Player {
  id: string;                                   // プレイヤーID（UUID）
  name: string;                                 // プレイヤー名（1-20文字）
  status: PlayerStatus;                         // 接続状態
  totalScore: number;                           // 累積スコア
  rank: number;                                 // 現在の順位（1-indexed）
  answers: PlayerAnswer[];                      // 回答履歴
  joinedAt: number;                             // 参加日時（タイムスタンプ）
  lastSeenAt: number;                           // 最終確認日時（タイムスタンプ）
}

/**
 * プレイヤーの回答記録
 */
export interface PlayerAnswer {
  quizNumber: number;                           // 問題番号（1-indexed）
  choiceIndex: number;                          // 選択した選択肢（0-3）
  answeredAt: number;                           // 回答日時（タイムスタンプ）
  timeSpent: number;                            // 回答にかかった時間（秒）
  earnedPoints: number;                         // 獲得ポイント
  wasCorrect: boolean;                          // 正解かどうか
}

// ============================================
// クイズ関連
// ============================================

/**
 * 選択肢
 */
export interface Choice {
  text: string;                                 // 選択肢のテキスト（1-100文字）
  image?: string;                               // 選択肢の画像URL（オプション）
}

/**
 * クイズ（問題）
 */
export interface Quiz {
  quizNumber: number;                           // 問題番号（1から順番）
  question: string;                             // 問題文（1-200文字）
  questionImage?: string;                       // 問題画像URL（オプション）
  choices: [Choice, Choice, Choice, Choice];    // 選択肢（必ず4つ）
  correctIndex: number;                         // 正解の選択肢（0-3）
  timeLimit: number;                            // 制限時間（秒）
  startedAt: number;                            // 出題開始時刻（タイムスタンプ）
  endsAt: number;                               // 終了予定時刻（タイムスタンプ）
  explanation?: string;                         // 正解解説（オプション）
}

/**
 * クイズ作成フォーム（ホストが入力）
 */
export interface QuizForm {
  question: string;                             // 問題文（必須、1-200文字）
  questionImage?: string;                       // 問題画像URL（オプション）
  choices: [Choice, Choice, Choice, Choice];    // 選択肢（各1-100文字）
  correctAnswer: number;                        // 正解（0-3）
  timeLimit: number;                            // 制限時間（秒）
  explanation?: string;                         // 正解解説（オプション）
}

/**
 * クイズの状態（回答状況）
 */
export interface QuizState {
  quiz: Quiz | null;                            // 現在の問題
  answers: Map<string, number>;                 // playerId -> choiceIndex
  answerCount: number;                          // 回答済み人数
  totalPlayers: number;                         // 参加者総数
  isEnded: boolean;                             // 回答受付が終了したか
}

/**
 * 選択肢の統計情報
 */
export interface ChoiceStatistics {
  choiceIndex: number;                          // 選択肢のインデックス（0-3）
  text: string;                                 // 選択肢のテキスト
  voteCount: number;                            // 得票数
  percentage: number;                           // 得票率（0-100）
  rank: number;                                 // 順位（1-4）
  isCorrect: boolean;                           // 正解かどうか
  isSecondPlace: boolean;                       // 2位の選択肢かどうか
  points: number;                               // この選択肢で獲得できるポイント
}

/**
 * プレイヤーごとのクイズ結果
 */
export interface PlayerQuizResult {
  playerId: string;                             // プレイヤーID
  playerName: string;                           // プレイヤー名
  choiceIndex: number;                          // 選択した選択肢（0-3）
  earnedPoints: number;                         // 獲得ポイント
  wasCorrect: boolean;                          // 正解かどうか
  isSecondPlace: boolean;                       // 2位の選択肢を選んだか
}

/**
 * クイズ結果（全体）
 */
export interface QuizResult {
  quizNumber: number;                           // 問題番号
  question: string;                             // 問題文
  correctIndex: number;                         // 正解の選択肢
  voteCounts: [number, number, number, number]; // 各選択肢の得票数
  statistics: ChoiceStatistics[];               // 選択肢ごとの統計
  secondPlaceChoice: number;                    // 2位の選択肢（最高得点）
  playerResults: Record<string, PlayerQuizResult>; // プレイヤーごとの結果
  leaderboard: LeaderboardEntry[];              // 問題後のリーダーボード
}

/**
 * リーダーボードエントリ
 */
export interface LeaderboardEntry {
  playerId: string;                             // プレイヤーID
  playerName: string;                           // プレイヤー名
  totalScore: number;                           // 累積スコア
  rank: number;                                 // 順位（1-indexed）
  rankChange?: number;                          // 順位変動（前回からの変化）
}

// ============================================
// 最終結果
// ============================================

/**
 * ゲーム最終結果
 */
export interface FinalResult {
  roomId: string;                               // ルームID
  totalQuizCount: number;                       // 総問題数
  totalPlayers: number;                         // 総参加者数
  winner: LeaderboardEntry;                     // 優勝者
  leaderboard: LeaderboardEntry[];              // 最終順位（全員）
  statistics: {
    averageAnswerTime: number;                  // 平均回答時間（秒）
    hardestQuiz: {                              // 最も難しかった問題
      quizNumber: number;
      question: string;
      correctRate: number;                      // 正解率（0-100）
    };
    easiestQuiz: {                              // 最も簡単だった問題
      quizNumber: number;
      question: string;
      correctRate: number;                      // 正解率（0-100）
    };
  };
  startedAt: number;                            // ゲーム開始時刻
  endedAt: number;                              // ゲーム終了時刻
}

// ============================================
// シリアライズ用の型（JSON送信用）
// ============================================

/**
 * MapをJSON化したもの
 */
export type SerializedMap<K extends string | number, V> = Record<K, V>;

/**
 * シリアライズされたRoomState
 */
export interface SerializedRoomState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  hostId: string;
  settings: RoomSettings;
  players: SerializedMap<string, Player>;       // Map -> Object
  currentQuiz: Quiz | null;
  quizHistory: QuizResult[];
  selectedTemplateId: string | null;            // 選択されたテンプレートID
  winnerRevealed: boolean;                      // 1位が発表済みかどうか
  createdAt: number;
  updatedAt: number;
}

/**
 * シリアライズされたQuizResult
 */
export interface SerializedQuizResult {
  quizNumber: number;
  question: string;
  correctIndex: number;
  voteCounts: [number, number, number, number];
  statistics: ChoiceStatistics[];
  secondPlaceChoice: number;
  playerResults: SerializedMap<string, PlayerQuizResult>; // Map -> Object
  leaderboard: LeaderboardEntry[];
}

// ============================================
// ヘルパー関数の型
// ============================================

/**
 * Map <-> Object 変換
 */
export type MapToObject = <K extends string | number, V>(map: Map<K, V>) => Record<K, V>;
export type ObjectToMap = <K extends string | number, V>(obj: Record<K, V>) => Map<K, V>;

/**
 * RoomStateのシリアライズ
 */
export type SerializeRoomState = (roomState: RoomState) => SerializedRoomState;

/**
 * QuizResultのシリアライズ
 */
export type SerializeQuizResult = (quizResult: QuizResult) => SerializedQuizResult;
