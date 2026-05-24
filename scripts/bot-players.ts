/**
 * bot-players.ts
 * Socket.io経由でプレイヤーBotを複数接続し、自動回答するテストスクリプト
 *
 * 使い方:
 *   tsx scripts/bot-players.ts --room <ROOM_CODE> [--count <N>] [--mode <random|correct|wrong|second>] [--delay <ms>]
 *
 * オプション:
 *   --room    参加するルームコード（必須）
 *   --count   Botの人数（デフォルト: 10）
 *   --mode    回答モード（デフォルト: random）
 *             random  : ランダムに回答
 *             correct : 正解を選ぶ（サーバー側で正解を受信した場合のみ）
 *             wrong   : 不正解をランダムに選ぶ
 *             second  : 2位の選択肢を狙う（サーバーが教えてくれた場合のみ、なければrandom）
 *   --delay   回答するまでのランダム遅延の最大値[ms]（デフォルト: 3000）
 *   --url     サーバーURL（デフォルト: http://localhost:3000）
 */

import { io, Socket } from 'socket.io-client';

// ============================================================
// 引数パース
// ============================================================

function parseArgs(): { roomCode: string; count: number; mode: string; delay: number; url: string } {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback?: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : fallback;
  };

  const roomCode = get('--room');
  if (!roomCode) {
    console.error('Usage: tsx scripts/bot-players.ts --room <ROOM_CODE> [--count N] [--mode random|correct|wrong] [--delay ms] [--url URL]');
    process.exit(1);
  }

  return {
    roomCode,
    count: parseInt(get('--count', '10')!, 10),
    mode: get('--mode', 'random')!,
    delay: parseInt(get('--delay', '3000')!, 10),
    url: get('--url', 'http://localhost:3000')!,
  };
}

// ============================================================
// Bot クラス
// ============================================================

class PlayerBot {
  private socket: Socket;
  private name: string;
  private mode: string;
  private maxDelay: number;
  private joined = false;
  private answeredQuizNumbers = new Set<number>();

  constructor(serverUrl: string, name: string, mode: string, maxDelay: number) {
    this.name = name;
    this.mode = mode;
    this.maxDelay = maxDelay;

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: false,
    });

    this.socket.on('connect', () => {
      this.log('接続完了');
    });

    this.socket.on('disconnect', (reason) => {
      this.log(`切断: ${reason}`);
    });

    this.socket.on('error', (err: { message: string }) => {
      this.log(`エラー: ${err.message}`);
    });

    // 回答受付開始 → 自動回答
    this.socket.on('quizActive', (data: {
      quiz: { quizNumber: number; correctIndex: number; choices: { text: string }[] };
      timeLimit: number;
    }) => {
      const { quiz } = data;
      if (this.answeredQuizNumbers.has(quiz.quizNumber)) return;
      this.answeredQuizNumbers.add(quiz.quizNumber);

      const choiceIndex = this.pickAnswer(quiz.correctIndex, quiz.choices.length);
      const delay = Math.floor(Math.random() * this.maxDelay);

      setTimeout(() => {
        if (this.socket.connected && this.joined) {
          this.socket.emit('submitAnswer', { choiceIndex });
          this.log(`Q${quiz.quizNumber}: 選択肢[${choiceIndex}]を回答 (${delay}ms後)`);
        }
      }, delay);
    });

    // 接続後に自動でルームコードをセットできるようにする
  }

  join(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinRoom', { roomCode, playerName: this.name }, (res: { playerId?: string; code?: string; message?: string }) => {
        if ('playerId' in res && res.playerId) {
          this.joined = true;
          this.log(`ルーム[${roomCode}]に参加完了 (ID: ${res.playerId})`);
          resolve();
        } else {
          this.log(`参加失敗: ${res.message ?? res.code}`);
          reject(new Error(res.message ?? res.code));
        }
      });
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  private pickAnswer(correctIndex: number, numChoices: number): number {
    switch (this.mode) {
      case 'correct':
        return correctIndex;
      case 'wrong': {
        const wrong = Array.from({ length: numChoices }, (_, i) => i).filter(i => i !== correctIndex);
        return wrong[Math.floor(Math.random() * wrong.length)];
      }
      default: // random
        return Math.floor(Math.random() * numChoices);
    }
  }

  private log(msg: string): void {
    console.log(`[${this.name}] ${msg}`);
  }
}

// ============================================================
// メイン
// ============================================================

async function main() {
  const { roomCode, count, mode, delay, url } = parseArgs();

  console.log(`=== Bot Player ===`);
  console.log(`  ルーム: ${roomCode}`);
  console.log(`  台数  : ${count}`);
  console.log(`  モード: ${mode}`);
  console.log(`  遅延  : 0〜${delay}ms`);
  console.log(`  URL   : ${url}`);
  console.log('');

  const bots: PlayerBot[] = [];

  for (let i = 1; i <= count; i++) {
    const name = `Bot${String(i).padStart(2, '0')}`;
    const bot = new PlayerBot(url, name, mode, delay);
    bots.push(bot);
  }

  // 接続が安定するまで少し待つ
  await new Promise(r => setTimeout(r, 500));

  // 全Bot並列でjoin
  const results = await Promise.allSettled(bots.map(bot => bot.join(roomCode)));
  const ok = results.filter(r => r.status === 'fulfilled').length;
  const ng = results.filter(r => r.status === 'rejected').length;

  console.log('');
  console.log(`参加結果: 成功 ${ok}人 / 失敗 ${ng}人`);
  console.log('quizActiveイベントを待機中... (Ctrl+C で終了)');

  // Ctrl+C で全Bot切断
  process.on('SIGINT', () => {
    console.log('\n全Botを切断します...');
    bots.forEach(b => b.disconnect());
    setTimeout(() => process.exit(0), 500);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
