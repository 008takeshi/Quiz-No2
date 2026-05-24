import { useSocket } from '../../../contexts/SocketContext';
import { colors, ui, spacing, fontSize, radius, fontFamily } from '../../../styles/theme';

export default function PlayerLobby() {
  const { roomCode, playerName } = useSocket();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.roomCode}>
          <span style={styles.roomCodeLabel}>ルーム</span>
          <span style={styles.roomCodeValue}>{roomCode}</span>
        </div>

        <div style={styles.playerInfo}>
          <p style={styles.playerLabel}>あなた</p>
          <p style={styles.playerName}>{playerName}</p>
        </div>

        <div style={styles.entryBadge}>
          <span style={styles.entryIcon}>✓</span>
          <span style={styles.entryText}>エントリー完了</span>
        </div>

        <div style={styles.waiting}>
          <div style={styles.spinner}></div>
          <p style={styles.waitingText}>
            ホストがゲームを
            <br />
            開始するまでお待ちください
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: ui.pageCenter,
  card: { ...ui.card, maxWidth: '400px', textAlign: 'center' as const },
  roomCode: { background: colors.bgDeep, borderRadius: radius.md, padding: spacing['4'], marginBottom: spacing['6'] },
  roomCodeLabel: { display: 'block', fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing['1'] },
  roomCodeValue: { display: 'block', fontSize: fontSize['2xl'], fontWeight: 'bold', letterSpacing: '2px', color: colors.textSecondary },
  entryBadge: { display: 'inline-flex', alignItems: 'center', gap: spacing['2'], background: colors.greenBg, border: `1px solid ${colors.greenDark}`, borderRadius: radius.full, padding: `${spacing['2']} ${spacing['5']}`, marginBottom: spacing['12'] },
  entryIcon: { fontSize: fontSize.base, color: colors.greenLight, fontWeight: 'bold' },
  entryText: { fontSize: fontSize.sm, fontWeight: 600, color: colors.greenLight },
  playerInfo: { marginBottom: spacing['6'] },
  playerLabel: { fontSize: fontSize.sm, color: colors.textDim, marginBottom: spacing['1'] },
  playerName: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: colors.textDim },
  waiting: { paddingTop: spacing['8'], borderTop: `1px solid ${colors.border}` },
  spinner: ui.spinner,
  waitingText: { fontSize: fontSize.base, color: colors.textDim, lineHeight: '1.5' },
};
