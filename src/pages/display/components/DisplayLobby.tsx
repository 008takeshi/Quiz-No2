import { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../../../contexts/SocketContext';
import type { Player } from '../../../../types/game';
import { colors, displayFontSize, displaySpacing, radius, fontFamily, gradients } from '../../../styles/theme';
import logoUrl from '../../../qno2_logo.png';

interface DisplayLobbyProps {
  players: Player[];
}

const SCROLL_SPEED = 30; // px/秒
const PAUSE_MS = 1500;   // 末尾・先頭で止まる時間

export default function DisplayLobby({ players }: DisplayLobbyProps) {
  const { roomCode } = useSocket();
  const publicOrigin = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const joinUrl = `${publicOrigin}/play?room=${roomCode}`;
  const qrSize = Math.max(120, Math.min(300, Math.round(window.innerHeight * 0.25)));
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let frameId: number;
    let prevTime: number | null = null;
    let pauseUntil = 0;
    let offset = 0;
    let direction = 1; // 1: 下向き、-1: 上向き
    inner.style.transform = 'translateY(0px)';

    const animate = (time: number) => {
      if (prevTime === null) prevTime = time;
      const dt = Math.min(time - prevTime, 100);
      prevTime = time;

      const maxScroll = inner.offsetHeight - outer.clientHeight;
      if (maxScroll > 0) {
        if (time >= pauseUntil) {
          // まず移動
          offset = Math.max(0, Math.min(offset + direction * SCROLL_SPEED * (dt / 1000), maxScroll));
          // 移動後に境界チェック
          if (direction === 1 && offset >= maxScroll) {
            direction = -1;
            pauseUntil = time + PAUSE_MS;
          } else if (direction === -1 && offset <= 0) {
            direction = 1;
            pauseUntil = time + PAUSE_MS;
          }
        }
        inner.style.transform = `translateY(-${offset}px)`;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [players.length]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src={logoUrl} alt="Quiz No.2" style={styles.logo} />
      </div>

      <div style={styles.playersSection}>
        <h2 style={styles.joinTitle}>参加はこちら！</h2>
        <div style={styles.joinBox}>
          <div style={styles.joinLeft}>
            <div style={styles.roomCode}>
              <span style={styles.roomCodeLabel}>ルームコード</span>
              <span style={styles.roomCodeValue}>{roomCode}</span>
            </div>
            <div style={styles.urlDisplay}>
              <p style={styles.urlText}>{joinUrl}</p>
            </div>
          </div>
          <div style={styles.qrContainer}>
            <QRCodeSVG value={joinUrl} size={qrSize} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
        </div>

        <h2 style={styles.playersTitle}>プレイヤー一覧 ({players.length}人)</h2>
        <div ref={outerRef} style={styles.playerGridOuter}>
          <div ref={innerRef} style={styles.playerGridInner}>
            {players.length === 0 ? (
              <p style={styles.emptyText}>参加者を待っています...</p>
            ) : (
              players.map((player, index) => (
                <div key={player.id} style={styles.playerCard}>
                  <span style={styles.playerIndex}>{index + 1}</span>
                  <span style={styles.playerName}>{player.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', overflow: 'hidden', background: gradients.bgPage, color: colors.textPrimary, padding: `${displaySpacing['10']} ${displaySpacing['15']}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  header: { textAlign: 'center', marginBottom: displaySpacing['5'], flexShrink: 0 },
  logo: { width: 'clamp(150px, 20vh, 270px)', display: 'block', margin: '0 auto' },
  joinBox: { marginBottom: displaySpacing['6'], display: 'flex', alignItems: 'center', gap: displaySpacing['10'] },
  joinLeft: { flex: 1, textAlign: 'center' },
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: displaySpacing['4'], flexShrink: 0 },
  joinTitle: { fontFamily: fontFamily.display, fontWeight: 'normal', textAlign: 'center', fontSize: displayFontSize['5xl'], marginBottom: displaySpacing['5'], color: colors.textPrimary },
  roomCode: { background: colors.bgDeep, borderRadius: radius.lg, padding: displaySpacing['6'], marginBottom: displaySpacing['4'] },
  roomCodeLabel: { display: 'block', fontSize: displayFontSize.base, fontWeight: 'bold', color: colors.textSecondary, marginBottom: displaySpacing['2'] },
  roomCodeValue: { display: 'block', fontSize: displayFontSize.displayXl, fontWeight: 'bold', letterSpacing: 'clamp(4px, 0.74vh, 8px)', color: colors.textSecondary },
  urlDisplay: { background: colors.bgDeep, borderRadius: radius.md, padding: displaySpacing['4'], marginTop: displaySpacing['4'] },
  urlText: { fontSize: displayFontSize.lg, color: colors.textSecondary, fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 },
  playersSection: { background: colors.bgCard, borderRadius: radius.xl, padding: displaySpacing['8'], flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  playersTitle: { fontSize: displayFontSize['3xl'], fontWeight: 600, marginBottom: displaySpacing['5'], color: colors.textPrimary, flexShrink: 0 },
  playerGridOuter: { flex: 1, minHeight: 0, overflow: 'hidden' },
  playerGridInner: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, clamp(140px, 15vw, 200px))', gap: displaySpacing['3'], alignContent: 'start' },
  playerCard: { background: colors.bgDeep, borderRadius: radius.md, padding: displaySpacing['3'], display: 'flex', alignItems: 'center', gap: displaySpacing['3'], height: 'clamp(36px, 5vh, 52px)', boxSizing: 'border-box' },
  playerIndex: { fontSize: displayFontSize.sm, color: colors.textSecondary, minWidth: '24px', fontWeight: 'bold' },
  playerName: { fontSize: displayFontSize.lg, color: colors.textSecondary, fontWeight: 'bold' },
  emptyText: { gridColumn: '1 / -1', textAlign: 'center', color: colors.textMuted, fontSize: displayFontSize.xl, padding: displaySpacing['12'] },
};
