import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './managers/RoomManager';
import { GameFlowManager } from './managers/GameFlowManager';
import { PlayerManager } from './managers/PlayerManager';
import { TemplateManager } from './managers/TemplateManager';
import { setupSocketHandlers } from './socket/handlers';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../types/events';

const app = express();
const httpServer = createServer(app);

// CORS設定
app.use(cors());
app.use(express.json());

// Socket.IO設定
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// マネージャーのインスタンス作成
const roomManager = new RoomManager();
const gameFlowManager = new GameFlowManager();
const playerManager = new PlayerManager();
const templateManager = new TemplateManager();

// Socket.IOハンドラーのセットアップ
setupSocketHandlers(io, {
  roomManager,
  gameFlowManager,
  playerManager,
  templateManager,
});

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// テンプレート一覧
app.get('/api/templates', (_req, res) => {
  const templates = templateManager.getTemplateList();
  res.json({ templates });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
