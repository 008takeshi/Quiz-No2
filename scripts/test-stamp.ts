/**
 * test-stamp.ts
 * スタンプ機能の自動テストスクリプト
 *
 * テスト内容:
 *   1. ホストがルームを作成
 *   2. ディスプレイが参加
 *   3. プレイヤーが参加
 *   4. プレイヤーが全19種スタンプを順に送信
 *   5. ディスプレイが stampBroadcast を受信できることを確認
 *   6. クールダウン制限（3秒以内の連打を弾く）を確認
 */

import { io, Socket } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';

const STAMP_IDS = [
  'stamp_heart', 'stamp_thumbsup', 'stamp_clap', 'stamp_win', 'stamp_ok',
  'stamp_bakusho', 'stamp_no', 'stamp_thumbsdown_bad', 'stamp_face_cry',
  'stamp_face_sob', 'stamp_face_blank', 'stamp_broken_heart', 'stamp_ghost',
  'stamp_skull', 'stamp_bomb', 'stamp_btn_a', 'stamp_btn_b', 'stamp_btn_c',
  'stamp_btn_d',
];

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`\n🔌 接続先: ${SERVER_URL}\n`);

  // ── ソケット作成 ──────────────────────────────
  const hostSocket: Socket   = io(SERVER_URL, { transports: ['websocket'] });
  const displaySocket: Socket = io(SERVER_URL, { transports: ['websocket'] });
  const playerSocket: Socket  = io(SERVER_URL, { transports: ['websocket'] });

  const receivedStamps: Array<{ stampId: string; playerName: string }> = [];
  let roomCode = '';

  // ── 接続待ち ──────────────────────────────────
  await Promise.all([
    new Promise<void>(r => hostSocket.on('connect', r)),
    new Promise<void>(r => displaySocket.on('connect', r)),
    new Promise<void>(r => playerSocket.on('connect', r)),
  ]);
  console.log('✅ 全ソケット接続完了\n');

  // ── 1. ルーム作成 ─────────────────────────────
  console.log('── テスト1: ルーム作成 ──');
  await new Promise<void>((resolve, reject) => {
    hostSocket.emit('createRoom', {
      template: { source: 'server', templateId: 'default' },
    }, (res: Record<string, unknown>) => {
      if ('code' in res) { reject(new Error(String(res.message))); return; }
      roomCode = String(res.roomCode);
      assert(!!roomCode, `ルーム作成成功 (code: ${roomCode})`);
      resolve();
    });
  });

  // ── 2. ディスプレイ参加 ───────────────────────
  console.log('\n── テスト2: ディスプレイ参加 ──');
  displaySocket.on('stampBroadcast', (data: { stampId: string; playerName: string }) => {
    receivedStamps.push(data);
  });

  await new Promise<void>((resolve, reject) => {
    displaySocket.emit('joinAsDisplay', { roomCode }, (res: Record<string, unknown>) => {
      if ('code' in res) { reject(new Error(String(res.message))); return; }
      assert(!!res.displayId, 'ディスプレイ参加成功');
      resolve();
    });
  });

  // ── 3. プレイヤー参加 ─────────────────────────
  console.log('\n── テスト3: プレイヤー参加 ──');
  await new Promise<void>((resolve, reject) => {
    playerSocket.emit('joinRoom', { roomCode, playerName: 'スタンプBot' }, (res: Record<string, unknown>) => {
      if ('code' in res) { reject(new Error(String(res.message))); return; }
      assert(res.playerName === 'スタンプBot', 'プレイヤー参加成功');
      resolve();
    });
  });

  // ── 4. 全19種スタンプ送信（3秒間隔）─────────────
  console.log(`\n── テスト4: 全${STAMP_IDS.length}種スタンプ送信（3.2秒間隔）──`);
  console.log('   ※ クールダウン3秒のため時間がかかります...');

  for (const stampId of STAMP_IDS) {
    playerSocket.emit('sendStamp', { stampId });
    await sleep(3200); // クールダウン(3000ms) + 余裕
  }

  // 最後のスタンプの受信を待つ
  await sleep(500);

  assert(
    receivedStamps.length === STAMP_IDS.length,
    `全${STAMP_IDS.length}種受信 (実際: ${receivedStamps.length}件)`
  );

  const receivedIds = receivedStamps.map(s => s.stampId);
  for (const id of STAMP_IDS) {
    assert(receivedIds.includes(id), `${id} を受信`);
  }

  const allPlayerName = receivedStamps.every(s => s.playerName === 'スタンプBot');
  assert(allPlayerName, 'playerName が全件 "スタンプBot"');

  // ── 5. クールダウン制限テスト ─────────────────
  console.log('\n── テスト5: クールダウン制限（3秒以内の連打は弾かれる）──');
  const beforeCount = receivedStamps.length;

  // 連打（クールダウン無視）
  playerSocket.emit('sendStamp', { stampId: 'stamp_heart' });
  playerSocket.emit('sendStamp', { stampId: 'stamp_heart' });
  playerSocket.emit('sendStamp', { stampId: 'stamp_heart' });
  await sleep(500);

  assert(
    receivedStamps.length === beforeCount + 1,
    `連打3回のうち1回だけ通過 (受信数: ${receivedStamps.length - beforeCount})`
  );

  // ── 6. 不正 stampId テスト ───────────────────
  console.log('\n── テスト6: 不正 stampId は無視される ──');
  await sleep(3200); // クールダウンリセット
  const beforeCount2 = receivedStamps.length;

  playerSocket.emit('sendStamp', { stampId: 'invalid_stamp_xyz' });
  await sleep(500);

  assert(
    receivedStamps.length === beforeCount2,
    `不正ID は弾かれる (受信数変化なし: ${receivedStamps.length - beforeCount2}件)`
  );

  // ── 7. ホスト・他プレイヤーにスタンプが届いていないことをソケット側で確認 ──
  console.log('\n── テスト7: ホスト側に stampBroadcast が届いていない ──');
  let hostReceivedStamp = false;
  hostSocket.on('stampBroadcast', () => { hostReceivedStamp = true; });
  await sleep(3200);
  playerSocket.emit('sendStamp', { stampId: 'stamp_clap' });
  await sleep(500);
  assert(!hostReceivedStamp, 'ホストには届いていない（:display ルーム絞り込み有効）');

  // ── 結果 ─────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`結果: ${passed} passed / ${failed} failed`);
  console.log('══════════════════════════════════════\n');

  hostSocket.disconnect();
  displaySocket.disconnect();
  playerSocket.disconnect();

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('テスト実行エラー:', err);
  process.exit(1);
});
