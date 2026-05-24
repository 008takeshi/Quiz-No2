import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  JoinAsDisplayRequest,
  JoinAsDisplayResponse,
  ReconnectRequest,
  ReconnectPlayerRequest,
  DeleteRoomRequest,
  ResetGameRequest,
  SuccessResponse,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  ErrorResponse,
  ErrorCode,
  StateSyncEvent,
} from '../../types/events';
import type { RoomManager } from '../managers/RoomManager';
import type { GameFlowManager } from '../managers/GameFlowManager';
import type { PlayerManager } from '../managers/PlayerManager';
import type { TemplateManager } from '../managers/TemplateManager';
import type { RoomSettings } from '../../types/game';
import { suggestPlayerName } from '../utils/nameGenerator';

// クイズタイマー管理（roomId → タイムアウトID）
const quizTimers = new Map<string, ReturnType<typeof setTimeout>>();

const stampCooldowns = new Map<string, number>();
const STAMP_COOLDOWN_MS = 1000;

const VALID_STAMP_IDS = new Set([
  'stamp_bakusho', 'stamp_bomb', 'stamp_broken_heart',
  'stamp_btn_a', 'stamp_btn_b', 'stamp_btn_c', 'stamp_btn_d',
  'stamp_clap', 'stamp_face_blank', 'stamp_face_cry',
  'stamp_face_sob', 'stamp_ghost', 'stamp_heart',
  'stamp_no', 'stamp_ok', 'stamp_skull',
  'stamp_thumbsdown_bad', 'stamp_thumbsup', 'stamp_win',
]);

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

interface Managers {
  roomManager: RoomManager;
  gameFlowManager: GameFlowManager;
  playerManager: PlayerManager;
  templateManager: TemplateManager;
}

/**
 * Socket.IOハンドラーのセットアップ
 */
export function setupSocketHandlers(io: TypedServer, managers: Managers) {
  const { roomManager, gameFlowManager, playerManager, templateManager } = managers;

  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ルーム作成
    socket.on('createRoom', (data: CreateRoomRequest, callback) => {
      try {
        // テンプレートを先に処理（エラーがあれば早期リターン）
        let template;
        let templateId: string;
        if (data.template.source === 'server') {
          template = templateManager.loadServerTemplate(data.template.templateId);
          templateId = data.template.templateId;
        } else {
          const errors = templateManager.validate(data.template.template);
          if (errors.length > 0) {
            const err: ErrorResponse = {
              code: 'INTERNAL_ERROR' as ErrorCode,
              message: `テンプレートが無効です: ${errors.join(', ')}`,
            };
            if (callback) callback(err);
            return;
          }
          template = data.template.template;
          templateId = 'upload';
        }

        const roomDefaultTimeLimit = data.settings?.defaultTimeLimit ?? 30;
        const quizForms = templateManager.toQuizForms(template, roomDefaultTimeLimit);

        const settings: RoomSettings = {
          hostName: suggestPlayerName(),
          maxPlayers: data.settings?.maxPlayers ?? 100,
          defaultTimeLimit: roomDefaultTimeLimit,
          allowLateJoin: data.settings?.allowLateJoin ?? false,
          totalQuizCount: quizForms.length,
        };

        const room = roomManager.createRoom(socket.id, settings);

        // テンプレートを適用
        room.selectedTemplateId = templateId;
        room.preparedQuizzes = quizForms;

        // ソケットデータに保存
        socket.data.roomId = room.roomId;
        socket.data.isHost = true;

        // ルームに参加
        socket.join(room.roomId);

        const response: CreateRoomResponse = {
          roomId: room.roomId,
          roomCode: room.roomCode,
          hostId: socket.id,
          settings: room.settings,
        };

        if (callback) {
          callback(response);
        }

        console.log(`✅ Room created: ${room.roomCode} by ${settings.hostName} (template: "${template.title}", ${quizForms.length}問)`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // プレイヤー参加
    socket.on('joinRoom', (data: JoinRoomRequest, callback) => {
      try {
        const roomId = roomManager.getRoomIdByCode(data.roomCode);
        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // 名前が未入力の場合はサーバーで自動生成
        const resolvedName = data.playerName.trim() || suggestPlayerName();

        // プレイヤーを追加（新しいUUIDを発行）
        const player = playerManager.addPlayer(room, socket.id, resolvedName);

        // ソケットデータに保存
        socket.data.roomId = room.roomId;
        socket.data.playerId = player.id; // UUIDを保存
        socket.data.isHost = false;

        // ルームに参加
        socket.join(room.roomId);

        // 参加完了レスポンス
        const response: JoinRoomResponse = {
          roomId: room.roomId,
          roomCode: room.roomCode,
          playerId: player.id, // UUIDを返す
          playerName: player.name,
          currentPhase: room.phase,
        };

        if (callback) {
          callback(response);
        }

        // ルーム全体に通知
        const playerJoinedEvent: PlayerJoinedEvent = {
          player,
          totalPlayers: room.players.size,
        };
        io.to(room.roomId).emit('playerJoined', playerJoinedEvent);

        console.log(
          `👤 Player ${data.playerName} (${player.id}) joined room ${room.roomCode}`
        );
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // 共有画面として参加
    socket.on('joinAsDisplay', (data: JoinAsDisplayRequest, callback) => {
      try {
        const roomId = roomManager.getRoomIdByCode(data.roomCode);
        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // ソケットデータに保存
        socket.data.roomId = room.roomId;
        socket.data.isDisplay = true;

        // ルームに参加（スタンプブロードキャスト用の display 専用ルームにも参加）
        socket.join(room.roomId);
        socket.join(`${room.roomId}:display`);

        // 参加完了レスポンス
        const response: JoinAsDisplayResponse = {
          roomId: room.roomId,
          roomCode: room.roomCode,
          displayId: socket.id,
          currentPhase: room.phase,
        };

        if (callback) {
          callback(response);
        }

        // 現在の状態（プレイヤーリスト含む）を同期
        const stateSync: StateSyncEvent = {
          roomState: roomManager.serializeRoom(room),
        };
        socket.emit('stateSync', stateSync);

        console.log(`📺 Display joined room ${room.roomCode}`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // ホスト再接続
    socket.on('reconnectHost', (data: ReconnectRequest, callback) => {
      try {
        const roomId = roomManager.getRoomIdByCode(data.roomCode);
        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // ホストとして再接続
        socket.data.roomId = room.roomId;
        socket.data.isHost = true;
        socket.join(room.roomId);

        const response: JoinRoomResponse = {
          roomId: room.roomId,
          roomCode: room.roomCode,
          playerId: room.hostId,
          playerName: data.playerName || room.settings.hostName,
          currentPhase: room.phase,
        };

        if (callback) {
          callback(response);
        }

        // 現在の状態を同期
        const stateSync: StateSyncEvent = {
          roomState: roomManager.serializeRoom(room),
        };
        socket.emit('stateSync', stateSync);

        console.log(`🔄 Host reconnected to room ${room.roomCode}`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // プレイヤー再接続
    socket.on('reconnectPlayer', (data: ReconnectPlayerRequest, callback) => {
      try {
        const roomId = roomManager.getRoomIdByCode(data.roomCode);
        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // 既存プレイヤーとして再接続
        const player = playerManager.reconnectPlayer(room, socket.id, data.playerId);

        if (!player) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Player not found in room',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        socket.data.roomId = room.roomId;
        socket.data.playerId = player.id; // UUIDを保存
        socket.data.isHost = false;
        socket.join(room.roomId);

        const response: JoinRoomResponse = {
          roomId: room.roomId,
          roomCode: room.roomCode,
          playerId: player.id, // UUIDを返す
          playerName: player.name,
          currentPhase: room.phase,
        };

        if (callback) {
          callback(response);
        }

        // 現在の状態を同期
        const stateSync: StateSyncEvent = {
          roomState: roomManager.serializeRoom(room),
          playerState: player,
        };
        socket.emit('stateSync', stateSync);

        console.log(`🔄 Player ${player.name} (${player.id}) reconnected to room ${room.roomCode}`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // ゲーム開始（ホストのみ）
    socket.on('startGame', (_data) => {
      try {
        const { roomId, isHost } = socket.data;

        // ホストチェック
        if (!isHost) {
          socket.emit('error', {
            code: 'NOT_HOST' as ErrorCode,
            message: 'Only host can start the game',
          });
          return;
        }

        if (!roomId) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        // テンプレート未選択の場合はゲーム開始不可
        if (!room.selectedTemplateId || room.preparedQuizzes.length === 0) {
          socket.emit('error', {
            code: 'INVALID_PHASE' as ErrorCode,
            message: 'ゲーム開始前にテンプレートを選択してください',
          });
          return;
        }

        // ゲーム開始（LOBBY → RECEPTION_CLOSED）
        gameFlowManager.startGame(room);

        // 全員にフェーズ変更を通知
        io.to(roomId).emit('phaseChanged', {
          phase: room.phase,
          timestamp: Date.now(),
        });

        console.log(`🎮 Game started in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // イントロ表示（ホストのみ）
    socket.on('showIntro', (_data) => {
      try {
        const { roomId, isHost } = socket.data;

        // ホストチェック
        if (!isHost) {
          socket.emit('error', {
            code: 'NOT_HOST' as ErrorCode,
            message: 'Only host can show intro',
          });
          return;
        }

        if (!roomId) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        // イントロ表示（RECEPTION_CLOSED → GAME_INTRO）
        gameFlowManager.showIntro(room);

        // 全員にフェーズ変更を通知
        io.to(roomId).emit('phaseChanged', {
          phase: room.phase,
          timestamp: Date.now(),
        });

        console.log(`🎬 Showing intro in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // 問題準備画面へ遷移（ホストのみ）
    socket.on('goToQuizPrep', (_data) => {
      try {
        const { roomId, isHost } = socket.data;

        // ホストチェック
        if (!isHost) {
          socket.emit('error', {
            code: 'NOT_HOST' as ErrorCode,
            message: 'Only host can go to quiz prep',
          });
          return;
        }

        if (!roomId) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          });
          return;
        }

        // 問題準備画面へ遷移（GAME_INTRO → QUIZ_PREPARE）
        gameFlowManager.goToQuizPrep(room);

        // 全員にフェーズ変更を通知
        io.to(roomId).emit('phaseChanged', {
          phase: room.phase,
          timestamp: Date.now(),
        });

        console.log(`📝 Going to quiz prep in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // テンプレート選択（ホストのみ、ロビーフェーズ）
    socket.on('selectTemplate', (data, callback) => {
      try {
        const { roomId, isHost } = socket.data;

        if (!isHost) {
          const err: ErrorResponse = { code: 'NOT_HOST' as ErrorCode, message: 'ホストのみ操作できます' };
          if (callback) callback(err);
          return;
        }

        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) {
          const err: ErrorResponse = { code: 'ROOM_NOT_FOUND' as ErrorCode, message: 'ルームが見つかりません' };
          if (callback) callback(err);
          return;
        }

        let template;
        let templateId: string;

        if (data.source === 'server') {
          template = templateManager.loadServerTemplate(data.templateId);
          templateId = data.templateId;
        } else {
          // アップロードされたテンプレートをバリデーション
          const errors = templateManager.validate(data.template);
          if (errors.length > 0) {
            const err: ErrorResponse = {
              code: 'INTERNAL_ERROR' as ErrorCode,
              message: `テンプレートが無効です: ${errors.join(', ')}`,
            };
            if (callback) callback(err);
            return;
          }
          template = data.template;
          templateId = 'upload';
        }

        // 問題リストを変換して保存
        const quizForms = templateManager.toQuizForms(template, room.settings.defaultTimeLimit);
        room.selectedTemplateId = templateId;
        room.preparedQuizzes = quizForms;
        room.settings.totalQuizCount = quizForms.length;
        room.updatedAt = Date.now();

        const event = {
          templateId,
          templateTitle: template.title,
          totalQuizCount: quizForms.length,
        };

        // ルーム全体に通知
        io.to(room.roomId).emit('templateSelected', event);

        if (callback) callback(event);

        console.log(`📋 Template selected in room ${room.roomCode}: "${template.title}" (${quizForms.length}問)`);
      } catch (error) {
        const err: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) callback(err);
      }
    });

    // 出題開始（ホストのみ）QUIZ_PREPARE → QUIZ_SHOWING_QUESTION
    socket.on('startQuizShow', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const quiz = gameFlowManager.startQuizShow(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
        io.to(roomId!).emit('quizQuestionShow', {
          quizNumber: quiz.quizNumber,
          question: quiz.question,
          hasImage: !!quiz.questionImage,
        });
        console.log(`📢 Quiz ${quiz.quizNumber} started in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 出題ステップ進行（ホストのみ）
    socket.on('nextQuizShowStep', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room || !room.currentQuiz) return;

        const prevPhase = room.phase;
        const newPhase = gameFlowManager.nextQuizShowStep(room);
        io.to(roomId!).emit('phaseChanged', { phase: newPhase, timestamp: Date.now() });

        if (prevPhase === 'QUIZ_SHOWING_QUESTION' && newPhase === 'QUIZ_SHOWING_IMAGE') {
          io.to(roomId!).emit('quizImageShow', { quizNumber: room.currentQuiz.quizNumber, questionImage: room.currentQuiz.questionImage! });
        } else if (newPhase === 'QUIZ_SHOWING_CHOICES') {
          io.to(roomId!).emit('quizChoicesShow', { quizNumber: room.currentQuiz.quizNumber, choices: room.currentQuiz.choices });
        }
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 回答受付開始（ホストのみ）QUIZ_SHOWING_CHOICES → QUIZ_ACTIVE
    socket.on('startAnswer', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const quiz = gameFlowManager.startAnswer(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
        io.to(roomId!).emit('quizActive', { quiz, timeLimit: quiz.timeLimit, endsAt: quiz.endsAt });

        console.log(`⏱️ Quiz ${quiz.quizNumber} active, ${quiz.timeLimit}s`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 回答送信（プレイヤーのみ）
    socket.on('submitAnswer', (data) => {
      try {
        const { roomId, playerId } = socket.data;
        if (!playerId || !roomId) return;
        const room = roomManager.getRoom(roomId);
        if (!room) return;

        // 既回答チェック
        const qn = room.currentQuiz?.quizNumber;
        const player = room.players.get(playerId);
        if (!player || !qn) return;
        if (player.answers.some(a => a.quizNumber === qn)) {
          socket.emit('error', { code: 'ALREADY_ANSWERED' as ErrorCode, message: '既に回答済みです' });
          return;
        }

        const now = Date.now();
        const timeSpent = room.currentQuiz ? (now - room.currentQuiz.startedAt) / 1000 : 0;
        player.answers.push({ quizNumber: qn, choiceIndex: data.choiceIndex, answeredAt: now, timeSpent, earnedPoints: 0, wasCorrect: false });
        player.lastSeenAt = now;

        socket.emit('answerReceived', { choiceIndex: data.choiceIndex, timeSpent });

        const { answerCount, totalPlayers } = gameFlowManager.getAnswerCount(room);
        const percentage = totalPlayers > 0 ? (answerCount / totalPlayers) * 100 : 0;
        io.to(roomId).emit('answerCount', { answerCount, totalPlayers, percentage });

      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // スタンプ送信（プレイヤーのみ）
    socket.on('sendStamp', (data) => {
      const { roomId, playerId, isHost, isDisplay } = socket.data;
      if (!roomId || !playerId || isHost || isDisplay) return;

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const player = room.players.get(playerId);
      if (!player) return;

      if (!VALID_STAMP_IDS.has(data.stampId)) return;

      const now = Date.now();
      const lastSent = stampCooldowns.get(playerId) ?? 0;
      if (now - lastSent < STAMP_COOLDOWN_MS) return;
      stampCooldowns.set(playerId, now);

      io.to(`${roomId}:display`).emit('stampBroadcast', {
        stampId: data.stampId,
        playerName: player.name,
        playerId: player.id,
      });
    });

    // 回答締切（ホストのみ）QUIZ_ACTIVE → QUIZ_CLOSED
    socket.on('closeQuiz', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const timer = quizTimers.get(roomId!);
        if (timer) clearTimeout(timer);
        quizTimers.delete(roomId!);

        performCloseQuiz(roomId!, room, io, roomManager, gameFlowManager, 'host');
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 結果表示開始（ホストのみ）QUIZ_CLOSED → RESULT_SHOWING_ANNOUNCE
    socket.on('showResults', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const lastResult = room.quizHistory[room.quizHistory.length - 1];
        if (!lastResult) return;

        gameFlowManager.showResults(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
        console.log(`📢 Announcing results for quiz ${lastResult.quizNumber}`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 結果フェーズ進行（ホストのみ）ANNOUNCE→ANSWER→VOTES→次フェーズ自動判断
    socket.on('nextResultStep', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const lastResult = room.quizHistory[room.quizHistory.length - 1];
        if (!lastResult) return;

        const prevPhase = room.phase;

        // VOTESフェーズからは状況に応じてルーティング（ポイント発表はスキップ）
        if (prevPhase === 'RESULT_SHOWING_VOTES') {
          const completedCount = room.quizHistory.length;
          const totalCount = room.settings.totalQuizCount;
          const halfwayPoint = Math.floor(totalCount / 2);

          if (completedCount >= totalCount) {
            // 最終問題 → ゲーム終了
            const finalResult = gameFlowManager.endGame(room);
            io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
            io.to(roomId!).emit('finalResult', { finalResult });
            console.log(`🏆 Game ended in room: ${room.roomCode}`);
          } else if (totalCount >= 2 && completedCount === halfwayPoint) {
            // 半分終了 → 途中経過発表
            gameFlowManager.showInterimLeaderboard(room);
            const topN = 3;
            const topEntries = lastResult.leaderboard
              .filter((e, i, arr) => e.rank !== 1 || arr.findIndex(x => x.rank === 1) === i)
              .slice(0, topN)
              .map(e => ({ rank: e.rank, playerName: e.rank === 1 ? null : e.playerName, totalScore: e.totalScore, hideScore: e.rank === 1 }));
            io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
            io.to(roomId!).emit('interimLeaderboardShow', { completedQuizCount: completedCount, totalQuizCount: totalCount, topEntries });
            console.log(`📊 Interim leaderboard shown in room: ${room.roomCode}`);
          } else {
            // 次の問題へ
            gameFlowManager.nextQuiz(room);
            io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
            console.log(`➡️ Next quiz in room: ${room.roomCode}`);
          }
          return;
        }

        // 通常フロー: ANNOUNCE → ANSWER → VOTES
        gameFlowManager.nextResultStep(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });

        if (prevPhase === 'RESULT_SHOWING_ANNOUNCE') {
          io.to(roomId!).emit('resultAnswerShow', { quizNumber: lastResult.quizNumber, correctIndex: lastResult.correctIndex, statistics: lastResult.statistics, explanation: room.currentQuiz?.explanation });
        } else if (prevPhase === 'RESULT_SHOWING_ANSWER') {
          io.to(roomId!).emit('resultVotesShow', { quizNumber: lastResult.quizNumber, statistics: lastResult.statistics, leaderboard: lastResult.leaderboard });
        }
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 次の問題へ（ホストのみ）RESULT_SHOWING_POINTS → QUIZ_PREPARE
    socket.on('nextQuiz', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        gameFlowManager.nextQuiz(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now(), nextQuizNumber: room.quizHistory.length + 1 });
        console.log(`➡️ Next quiz in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // ゲーム終了（ホストのみ）RESULT_SHOWING_POINTS → FINAL_RESULT
    socket.on('endGame', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        const finalResult = gameFlowManager.endGame(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
        io.to(roomId!).emit('finalResult', { finalResult });
        console.log(`🏆 Game ended in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 1位発表（ホストのみ）FINAL_RESULT フェーズ中
    socket.on('revealWinner', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;
        room.winnerRevealed = true;
        io.to(roomId!).emit('winnerRevealed');
        console.log(`🥇 Winner revealed in room: ${room.roomCode}`);
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // ルーム閉鎖（ホストのみ）FINAL_RESULT → GAME_OVER
    socket.on('closeRoom', () => {
      try {
        const { roomId, isHost } = socket.data;
        if (!isHost) return;
        const room = roomId ? roomManager.getRoom(roomId) : undefined;
        if (!room) return;

        gameFlowManager.closeRoom(room);
        io.to(roomId!).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
        io.to(roomId!).emit('roomClosed', { reason: 'host' });
      } catch (error) {
        socket.emit('error', { code: 'INTERNAL_ERROR' as ErrorCode, message: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // ルーム退出
    socket.on('leaveRoom', () => {
      handleLeaveRoom(socket, roomManager, playerManager, io);
    });

    // ルーム削除（ホストのみ）
    socket.on('deleteRoom', (_data: DeleteRoomRequest, callback) => {
      try {
        const { roomId, isHost } = socket.data;

        // ホストチェック
        if (!isHost) {
          const errorResponse: ErrorResponse = {
            code: 'UNAUTHORIZED' as ErrorCode,
            message: 'Only host can delete the room',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // 全員に削除通知
        io.to(roomId).emit('roomDeleted');

        // ルーム削除
        roomManager.deleteRoom(roomId);

        const response: SuccessResponse = {
          success: true,
          message: 'Room deleted successfully',
        };
        if (callback) {
          callback(response);
        }

        console.log(`🗑️  Room deleted by host: ${room.roomCode}`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // ゲームリセット（ホストのみ）
    socket.on('resetGame', (_data: ResetGameRequest, callback) => {
      try {
        const { roomId, isHost } = socket.data;

        // ホストチェック
        if (!isHost) {
          const errorResponse: ErrorResponse = {
            code: 'UNAUTHORIZED' as ErrorCode,
            message: 'Only host can reset the game',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        if (!roomId) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          const errorResponse: ErrorResponse = {
            code: 'ROOM_NOT_FOUND' as ErrorCode,
            message: 'Room not found',
          };
          if (callback) {
            callback(errorResponse);
          }
          return;
        }

        // ゲーム状態をリセット（LOBBYに戻す）
        gameFlowManager.resetGame(room);

        // 全員にリセット通知とフェーズ変更通知
        io.to(roomId).emit('gameReset');
        io.to(roomId).emit('phaseChanged', {
          phase: room.phase,
          timestamp: Date.now(),
        });

        // ルーム全体にプレイヤーリストを含む状態同期を送信
        const stateSync: StateSyncEvent = {
          roomState: roomManager.serializeRoom(room),
        };
        io.to(roomId).emit('stateSync', stateSync);

        const response: SuccessResponse = {
          success: true,
          message: 'Game reset successfully',
        };
        if (callback) {
          callback(response);
        }

        console.log(`🔄 Game reset by host in room: ${room.roomCode}`);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_ERROR' as ErrorCode,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        if (callback) {
          callback(errorResponse);
        }
      }
    });

    // 切断
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      if (socket.data.playerId) stampCooldowns.delete(socket.data.playerId);
      handleLeaveRoom(socket, roomManager, playerManager, io);
    });

    // Ping/Pong
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });
}

/**
 * クイズ締切処理（手動・タイムアウト共通）
 */
function performCloseQuiz(
  roomId: string,
  room: import('../../types/game').RoomState,
  io: TypedServer,
  _roomManager: RoomManager,
  gameFlowManager: GameFlowManager,
  reason: 'host' | 'timeout' | 'all_answered'
) {
  try {
    const result = gameFlowManager.closeQuiz(room);
    io.to(roomId).emit('phaseChanged', { phase: room.phase, timestamp: Date.now() });
    io.to(roomId).emit('quizClosed', { reason });
    console.log(`🔒 Quiz closed (${reason}) in room: ${room.roomCode}, quiz: ${result.quizNumber}`);
  } catch (error) {
    console.error('performCloseQuiz error:', error);
  }
}

/**
 * ルーム退出処理
 */
function handleLeaveRoom(
  socket: TypedSocket,
  roomManager: RoomManager,
  playerManager: PlayerManager,
  io: TypedServer
) {
  const { roomId, playerId, isDisplay } = socket.data;

  if (!roomId) {
    return;
  }

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return;
  }

  // 共有画面の場合はプレイヤーリストから削除しない
  if (isDisplay) {
    socket.leave(roomId);
    socket.leave(`${roomId}:display`);
    console.log(`📺 Display left room ${room.roomCode}`);
    return;
  }

  if (!playerId) {
    return;
  }

  // プレイヤーを削除
  const player = playerManager.removePlayer(room, playerId);
  if (player) {
    socket.leave(roomId);

    // ルーム全体に通知
    const playerLeftEvent: PlayerLeftEvent = {
      playerId: player.id,
      playerName: player.name,
      totalPlayers: room.players.size,
    };
    io.to(roomId).emit('playerLeft', playerLeftEvent);

    // プレイヤーが0人になったらルームを削除
    if (room.players.size === 0) {
      roomManager.deleteRoom(roomId);
    }
  }
}
