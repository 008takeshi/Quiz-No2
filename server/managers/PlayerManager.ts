import type { RoomState, Player } from '../../types/game';
import { PlayerStatus } from '../../types/game';

/**
 * プレイヤー管理クラス
 */
export class PlayerManager {
  // socket.id -> playerId のマッピング
  private socketToPlayer = new Map<string, string>();

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
   * プレイヤーを追加（新規参加）
   */
  addPlayer(room: RoomState, socketId: string, playerName: string): Player {
    // ルームが満員かチェック
    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    // 同じ名前のプレイヤーが既に存在するかチェック
    const existingPlayer = Array.from(room.players.values()).find(
      (p) => p.name === playerName
    );
    if (existingPlayer) {
      throw new Error('Player name already exists');
    }

    // 新しいUUIDを発行
    const playerId = this.generateUUID();

    const player: Player = {
      id: playerId,
      name: playerName,
      status: PlayerStatus.CONNECTED,
      totalScore: 0,
      rank: room.players.size + 1,
      answers: [],
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    room.players.set(playerId, player);
    this.socketToPlayer.set(socketId, playerId);
    console.log(`👤 Player joined: ${playerName} (${playerId}) in room ${room.roomCode}`);
    return player;
  }

  /**
   * プレイヤーを再接続（既存プレイヤー）
   */
  reconnectPlayer(room: RoomState, socketId: string, playerId: string): Player | null {
    const player = room.players.get(playerId);
    if (!player) {
      return null;
    }

    // 古いsocket.idのマッピングを削除
    for (const [oldSocketId, pid] of this.socketToPlayer.entries()) {
      if (pid === playerId) {
        this.socketToPlayer.delete(oldSocketId);
      }
    }

    // 新しいsocket.idをマッピング
    this.socketToPlayer.set(socketId, playerId);
    player.status = PlayerStatus.CONNECTED;
    player.lastSeenAt = Date.now();

    console.log(`🔄 Player reconnected: ${player.name} (${playerId}) in room ${room.roomCode}`);
    return player;
  }

  /**
   * socket.idからplayerIdを取得
   */
  getPlayerIdBySocketId(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  /**
   * プレイヤーを削除
   */
  removePlayer(room: RoomState, socketId: string): Player | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) {
      return undefined;
    }

    const player = room.players.get(playerId);
    if (player) {
      // ゲーム中の場合はDISCONNECTED状態にするだけ
      if (room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER') {
        player.status = PlayerStatus.DISCONNECTED;
        console.log(`⚠️  Player disconnected: ${player.name} (${playerId}) from room ${room.roomCode}`);
      } else {
        // ロビーまたはゲーム終了時は完全に削除
        room.players.delete(playerId);
        this.socketToPlayer.delete(socketId);
        console.log(`👋 Player left: ${player.name} (${playerId}) from room ${room.roomCode}`);
      }
      return player;
    }
    return undefined;
  }

  /**
   * プレイヤーを取得
   */
  getPlayer(room: RoomState, playerId: string): Player | undefined {
    return room.players.get(playerId);
  }

  /**
   * socket.idからプレイヤーを取得
   */
  getPlayerBySocketId(room: RoomState, socketId: string): Player | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) {
      return undefined;
    }
    return room.players.get(playerId);
  }
}
