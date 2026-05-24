import type { RoomState, RoomSettings, SerializedRoomState } from '../../types/game';
import { GamePhase as GamePhaseEnum } from '../../types/game';

/**
 * ルーム管理クラス
 */
export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private roomCodeIndex = new Map<string, string>(); // roomCode -> roomId

  /**
   * ルームを作成
   */
  createRoom(hostId: string, settings: RoomSettings): RoomState {
    const roomId = this.generateUUID();
    const roomCode = this.generateRoomCode();

    const room: RoomState = {
      roomId,
      roomCode,
      phase: GamePhaseEnum.LOBBY,
      hostId,
      settings,
      players: new Map(),
      currentQuiz: null,
      quizHistory: [],
      selectedTemplateId: null,
      preparedQuizzes: [],
      winnerRevealed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.roomCodeIndex.set(roomCode, roomId);

    console.log(`✅ Room created: ${roomCode} (${roomId})`);
    return room;
  }

  /**
   * ルームコードからルームIDを取得
   */
  getRoomIdByCode(roomCode: string): string | undefined {
    return this.roomCodeIndex.get(roomCode);
  }

  /**
   * ルームを取得
   */
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * ルームを削除
   */
  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.roomCodeIndex.delete(room.roomCode);
      this.rooms.delete(roomId);
      console.log(`🗑️  Room deleted: ${room.roomCode} (${roomId})`);
    }
  }

  /**
   * 全ルームを取得（デバッグ用）
   */
  getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  /**
   * RoomStateをシリアライズ（クライアント送信用）
   */
  serializeRoom(room: RoomState): SerializedRoomState {
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      phase: room.phase,
      hostId: room.hostId,
      settings: room.settings,
      players: Object.fromEntries(room.players),
      currentQuiz: room.currentQuiz,
      quizHistory: room.quizHistory,
      selectedTemplateId: room.selectedTemplateId,
      winnerRevealed: room.winnerRevealed,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  /**
   * UUIDを生成
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 6桁のルームコードを生成
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 既に存在する場合は再生成
    if (this.roomCodeIndex.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
