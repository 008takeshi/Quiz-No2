/**
 * WebSocketイベントの型定義
 * 状態管理仕様書に基づいたイベント定義
 */

import type {
  GamePhase,
  RoomSettings,
  Player,
  Quiz,
  QuizTemplate,
  TemplateInfo,
  ChoiceStatistics,
  PlayerQuizResult,
  FinalResult,
  SerializedRoomState,
} from './game';

// ============================================
// クライアント → サーバー イベント
// ============================================

/**
 * ルーム作成リクエスト
 */
export interface CreateRoomRequest {
  template: SelectTemplateRequest;              // 問題テンプレート（必須）
  settings?: Partial<RoomSettings>;             // ルーム設定（オプション）
}

/**
 * ルーム参加リクエスト（プレイヤー）
 */
export interface JoinRoomRequest {
  roomCode: string;                             // 6桁の参加コード
  playerName: string;                           // プレイヤー名（1-20文字）
}

/**
 * 共有画面として参加リクエスト
 */
export interface JoinAsDisplayRequest {
  roomCode: string;                             // 6桁の参加コード
}

/**
 * ゲーム開始リクエスト（ホストのみ）
 * テンプレートが選択済みであることが前提
 */
export interface StartGameRequest {
  // パラメータなし（テンプレートは selectTemplate で事前設定済み）
}

/**
 * テンプレート選択リクエスト（ホストのみ、ロビーで実行）
 */
export type SelectTemplateRequest =
  | { source: 'server'; templateId: string }
  | { source: 'upload'; template: QuizTemplate };

/**
 * テンプレート選択完了イベント（ブロードキャスト）
 */
export interface TemplateSelectedEvent {
  templateId: string;
  templateTitle: string;
  totalQuizCount: number;
}

/**
 * テンプレート一覧レスポンス
 */
export interface GetTemplatesResponse {
  templates: TemplateInfo[];
}

/**
 * イントロ表示リクエスト（ホストのみ）
 */
export interface ShowIntroRequest {
  // パラメータなし
}

/**
 * 問題準備画面へ遷移リクエスト（ホストのみ）
 */
export interface GoToQuizPrepRequest {
  // パラメータなし
}

/**
 * 出題開始リクエスト（ホストのみ）
 * サーバーが preparedQuizzes から自動的に次の問題を選択する
 */
export interface StartQuizShowRequest {
  // パラメータなし
}

/**
 * 次へ（出題フェーズ内での進行）（ホストのみ）
 */
export interface NextQuizShowStepRequest {
  // パラメータなし
}

/**
 * 回答開始リクエスト（ホストのみ）
 */
export interface StartAnswerRequest {
  // パラメータなし
}

/**
 * 回答送信（プレイヤー）
 */
export interface SubmitAnswerRequest {
  choiceIndex: number;                          // 選択した選択肢（0-3）
}

/**
 * スタンプ送信リクエスト（プレイヤーのみ）
 */
export interface SendStampRequest {
  stampId: string;                              // スタンプID（例: "stamp_heart"）
}

/**
 * 回答締切リクエスト（ホストのみ）
 */
export interface CloseQuizRequest {
  // パラメータなし
}

/**
 * 結果発表開始リクエスト（ホストのみ）
 */
export interface ShowResultsRequest {
  // パラメータなし
}

/**
 * 次へ（結果フェーズ内での進行）（ホストのみ）
 */
export interface NextResultStepRequest {
  // パラメータなし
}

/**
 * 次の問題へリクエスト（ホストのみ）
 */
export interface NextQuizRequest {
  // パラメータなし
}

/**
 * ゲーム終了リクエスト（ホストのみ）
 */
export interface EndGameRequest {
  // パラメータなし
}

/**
 * ルームを閉じるリクエスト（ホストのみ）
 */
export interface CloseRoomRequest {
  // パラメータなし
}

/**
 * 1位を発表するリクエスト（ホストのみ）
 */
export interface RevealWinnerRequest {
  // パラメータなし
}

/**
 * プレイヤーをキックリクエスト（ホストのみ）
 */
export interface KickPlayerRequest {
  playerId: string;                             // キックするプレイヤーID
}

/**
 * ルーム退出リクエスト
 */
export interface LeaveRoomRequest {
  // パラメータなし
}

/**
 * ルーム削除リクエスト（ホストのみ）
 */
export interface DeleteRoomRequest {
  // パラメータなし
}

/**
 * ゲームリセットリクエスト（ホストのみ）
 * ゲーム状態をLOBBYフェーズに戻す
 */
export interface ResetGameRequest {
  // パラメータなし
}

/**
 * ホスト再接続リクエスト
 */
export interface ReconnectHostRequest {
  roomCode: string;                             // ルームコード
  playerName?: string;                          // ホスト名
}

/**
 * プレイヤー再接続リクエスト
 */
export interface ReconnectPlayerRequest {
  roomCode: string;                             // ルームコード
  playerId: string;                             // プレイヤーID（UUID）
  playerName: string;                           // プレイヤー名
}

/**
 * 共有画面再接続リクエスト
 */
export interface ReconnectDisplayRequest {
  roomCode: string;                             // ルームコード
}

/**
 * 状態復帰リクエスト（再接続時）- deprecated、後方互換性のため残す
 */
export interface ReconnectRequest {
  roomCode: string;                             // ルームコード
  playerId?: string;                            // プレイヤーID（既存の場合）
  playerName?: string;                          // プレイヤー名（ホスト/プレイヤー用）
  isHost?: boolean;                             // ホストかどうか
  isDisplay?: boolean;                          // 共有画面かどうか
}

/**
 * クライアント → サーバー イベントの統合型
 */
export type ClientToServerEvents = {
  createRoom: (data: CreateRoomRequest, callback?: (response: CreateRoomResponse | ErrorResponse) => void) => void;
  joinRoom: (data: JoinRoomRequest, callback?: (response: JoinRoomResponse | ErrorResponse) => void) => void;
  joinAsDisplay: (data: JoinAsDisplayRequest, callback?: (response: JoinAsDisplayResponse | ErrorResponse) => void) => void;
  reconnect: (data: ReconnectRequest, callback?: (response: JoinRoomResponse | JoinAsDisplayResponse | ErrorResponse) => void) => void;
  reconnectHost: (data: ReconnectHostRequest, callback?: (response: JoinRoomResponse | ErrorResponse) => void) => void;
  reconnectPlayer: (data: ReconnectPlayerRequest, callback?: (response: JoinRoomResponse | ErrorResponse) => void) => void;
  reconnectDisplay: (data: ReconnectDisplayRequest, callback?: (response: JoinAsDisplayResponse | ErrorResponse) => void) => void;
  leaveRoom: (data: LeaveRoomRequest) => void;

  // ホスト操作
  startGame: (data: StartGameRequest) => void;
  selectTemplate: (data: SelectTemplateRequest, callback?: (response: TemplateSelectedEvent | ErrorResponse) => void) => void;
  showIntro: (data: ShowIntroRequest) => void;
  goToQuizPrep: (data: GoToQuizPrepRequest) => void;
  startQuizShow: (data: StartQuizShowRequest) => void;
  nextQuizShowStep: (data: NextQuizShowStepRequest) => void;
  startAnswer: (data: StartAnswerRequest) => void;
  closeQuiz: (data: CloseQuizRequest) => void;
  showResults: (data: ShowResultsRequest) => void;
  nextResultStep: (data: NextResultStepRequest) => void;
  nextQuiz: (data: NextQuizRequest) => void;
  endGame: (data: EndGameRequest) => void;
  closeRoom: (data: CloseRoomRequest) => void;
  revealWinner: (data: RevealWinnerRequest) => void;
  kickPlayer: (data: KickPlayerRequest) => void;
  deleteRoom: (data: DeleteRoomRequest, callback: (response: SuccessResponse | ErrorResponse) => void) => void;
  resetGame: (data: ResetGameRequest, callback: (response: SuccessResponse | ErrorResponse) => void) => void;

  // プレイヤー操作
  submitAnswer: (data: SubmitAnswerRequest) => void;
  sendStamp: (data: SendStampRequest) => void;

  // ユーティリティ
  ping: () => void;
};

// ============================================
// サーバー → クライアント イベント
// ============================================

/**
 * ルーム作成完了レスポンス
 */
export interface CreateRoomResponse {
  roomId: string;                               // ルームID（UUID）
  roomCode: string;                             // 6桁の参加コード
  hostId: string;                               // ホストのプレイヤーID
  settings: RoomSettings;                       // ルーム設定
}

/**
 * ルーム参加完了レスポンス
 */
export interface JoinRoomResponse {
  roomId: string;                               // ルームID
  roomCode: string;                             // ルームコード
  playerId: string;                             // プレイヤーID
  playerName: string;                           // プレイヤー名
  currentPhase: GamePhase;                      // 現在のフェーズ
}

/**
 * 共有画面参加完了レスポンス
 */
export interface JoinAsDisplayResponse {
  roomId: string;                               // ルームID
  roomCode: string;                             // ルームコード
  displayId: string;                            // ディスプレイID
  currentPhase: GamePhase;                      // 現在のフェーズ
}

/**
 * プレイヤー参加イベント（ブロードキャスト）
 */
export interface PlayerJoinedEvent {
  player: Player;                               // 参加したプレイヤー
  totalPlayers: number;                         // 総参加者数
}

/**
 * プレイヤー退出イベント（ブロードキャスト）
 */
export interface PlayerLeftEvent {
  playerId: string;                             // 退出したプレイヤーID
  playerName: string;                           // 退出したプレイヤー名
  totalPlayers: number;                         // 残り参加者数
}

/**
 * フェーズ変更イベント（ブロードキャスト）
 */
export interface PhaseChangedEvent {
  phase: GamePhase;                             // 新しいフェーズ
  timestamp: number;                            // タイムスタンプ
  nextQuizNumber?: number;                      // QUIZ_PREPAREフェーズ時の次の問題番号
}

/**
 * 問題文表示イベント（ブロードキャスト）
 */
export interface QuizQuestionShowEvent {
  quizNumber: number;                           // 問題番号
  question: string;                             // 問題文
  hasImage: boolean;                            // 画像があるか
}

/**
 * 問題画像表示イベント（ブロードキャスト）
 */
export interface QuizImageShowEvent {
  quizNumber: number;                           // 問題番号
  questionImage: string;                        // 問題画像URL
}

/**
 * 選択肢表示イベント（ブロードキャスト）
 */
export interface QuizChoicesShowEvent {
  quizNumber: number;                           // 問題番号
  choices: Array<{                              // 選択肢（画面によって表示内容が異なる）
    text: string;
    image?: string;
  }>;
}

/**
 * 回答受付開始イベント（ブロードキャスト）
 */
export interface QuizActiveEvent {
  quiz: Quiz;                                   // 問題全体
  timeLimit: number;                            // 制限時間（秒）
  endsAt: number;                               // 終了予定時刻（タイムスタンプ）
}

/**
 * 回答受付確認（個別通知）
 */
export interface AnswerReceivedEvent {
  choiceIndex: number;                          // 選択した選択肢
  timeSpent: number;                            // 回答にかかった時間（秒）
}

/**
 * 回答数更新イベント（ホストと共有画面のみ）
 */
export interface AnswerCountEvent {
  answerCount: number;                          // 回答済み人数
  totalPlayers: number;                         // 総参加者数
  percentage: number;                           // 回答率（0-100）
}

/**
 * 回答締切イベント（ブロードキャスト）
 */
export interface QuizClosedEvent {
  reason: 'timeout' | 'host' | 'all_answered';  // 締切理由
}

/**
 * 得票数表示イベント（ブロードキャスト）
 */
export interface ResultVotesShowEvent {
  quizNumber: number;                           // 問題番号
  statistics: ChoiceStatistics[];               // 選択肢ごとの統計
  leaderboard: import('./game').LeaderboardEntry[]; // 現在のリーダーボード
}

/**
 * 正解発表イベント（ブロードキャスト）
 */
export interface ResultAnswerShowEvent {
  quizNumber: number;                           // 問題番号
  correctIndex: number;                         // 正解の選択肢
  statistics: ChoiceStatistics[];               // 選択肢ごとの統計（正解をハイライト）
  explanation?: string;                         // 正解解説
}

/**
 * ポイント発表イベント（個別通知 - プレイヤーのみ）
 */
export interface ResultPointsShowEvent {
  quizNumber: number;                           // 問題番号
  myResult: PlayerQuizResult;                   // 自分の結果
  totalScore: number;                           // 累積スコア
  rank: number;                                 // 現在の順位
  rankChange: number;                           // 順位変動（前回からの変化）
}

/**
 * 途中経過リーダーボードイベント（半分終了時点、ブロードキャスト）
 */
export interface InterimLeaderboardShowEvent {
  completedQuizCount: number;                   // 完了した問題数
  totalQuizCount: number;                       // 総問題数
  topEntries: Array<{
    rank: number;                               // 順位
    playerName: string | null;                  // 名前（1位は null で伏せる）
    totalScore: number;                         // 累積スコア
    hideScore: boolean;                         // 1位（同率含む）はスコアを伏せる
  }>;
}

/**
 * 最終結果イベント（ブロードキャスト）
 */
export interface FinalResultEvent {
  finalResult: FinalResult;                     // 最終結果
}

/**
 * スタンプブロードキャストイベント（ルーム全体）
 */
export interface StampBroadcastEvent {
  stampId: string;                              // スタンプID
  playerName: string;                           // 送信者のプレイヤー名
  playerId: string;                             // 送信者のプレイヤーID
}

/**
 * ルーム閉鎖イベント（ブロードキャスト）
 */
export interface RoomClosedEvent {
  reason: string;                               // 閉鎖理由
  finalResult?: FinalResult;                    // 最終結果（存在する場合）
}

/**
 * 状態同期イベント（再接続時など）
 */
export interface StateSyncEvent {
  roomState: SerializedRoomState;               // ルーム全体の状態
  playerState?: Player;                         // 自分のプレイヤー状態（プレイヤーの場合のみ）
}

/**
 * 成功レスポンス
 */
export interface SuccessResponse {
  success: true;
  message?: string;                             // オプションのメッセージ
}

/**
 * エラーイベント
 */
export interface ErrorResponse {
  code: ErrorCode;                              // エラーコード
  message: string;                              // エラーメッセージ
  details?: any;                                // 詳細情報
}

/**
 * エラーコード
 */
export enum ErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ALREADY_STARTED = 'ROOM_ALREADY_STARTED',
  INVALID_PLAYER_NAME = 'INVALID_PLAYER_NAME',
  PLAYER_ALREADY_EXISTS = 'PLAYER_ALREADY_EXISTS',
  NOT_HOST = 'NOT_HOST',
  INVALID_PHASE = 'INVALID_PHASE',
  QUIZ_NOT_FOUND = 'QUIZ_NOT_FOUND',
  ALREADY_ANSWERED = 'ALREADY_ANSWERED',
  ANSWER_TIMEOUT = 'ANSWER_TIMEOUT',
  INVALID_CHOICE = 'INVALID_CHOICE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * サーバー → クライアント イベントの統合型
 */
export type ServerToClientEvents = {
  // ルーム管理
  playerJoined: (data: PlayerJoinedEvent) => void;
  playerLeft: (data: PlayerLeftEvent) => void;
  phaseChanged: (data: PhaseChangedEvent) => void;

  // 出題フェーズ
  quizQuestionShow: (data: QuizQuestionShowEvent) => void;
  quizImageShow: (data: QuizImageShowEvent) => void;
  quizChoicesShow: (data: QuizChoicesShowEvent) => void;

  // 回答フェーズ
  quizActive: (data: QuizActiveEvent) => void;
  answerReceived: (data: AnswerReceivedEvent) => void;
  answerCount: (data: AnswerCountEvent) => void;
  quizClosed: (data: QuizClosedEvent) => void;

  // 結果フェーズ
  resultVotesShow: (data: ResultVotesShowEvent) => void;
  resultAnswerShow: (data: ResultAnswerShowEvent) => void;
  resultPointsShow: (data: ResultPointsShowEvent) => void;
  interimLeaderboardShow: (data: InterimLeaderboardShowEvent) => void;

  // 最終結果
  finalResult: (data: FinalResultEvent) => void;
  winnerRevealed: () => void;
  roomClosed: (data: RoomClosedEvent) => void;

  // ホスト操作結果
  roomDeleted: () => void;
  gameReset: () => void;
  templateSelected: (data: TemplateSelectedEvent) => void;

  // スタンプ
  stampBroadcast: (data: StampBroadcastEvent) => void;

  // ユーティリティ
  stateSync: (data: StateSyncEvent) => void;
  error: (data: ErrorResponse) => void;
  pong: () => void;
};

// ============================================
// Socket.io 型定義
// ============================================

/**
 * Socket.io用の型定義
 */
export interface ServerToClientEventsMap extends ServerToClientEvents {}
export interface ClientToServerEventsMap extends ClientToServerEvents {}

/**
 * Inter-server events（複数サーバー間通信用）
 * 現時点では使用しないが、将来的な拡張のために定義
 */
export interface InterServerEvents {}

/**
 * Socket data（接続ごとのメタデータ）
 */
export interface SocketData {
  roomId?: string;                              // 参加中のルームID
  playerId?: string;                            // プレイヤーID
  isHost?: boolean;                             // ホストかどうか
  isDisplay?: boolean;                          // 共有画面かどうか
}
