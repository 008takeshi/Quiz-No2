import { useSocket } from '../../../contexts/SocketContext';
import type { Player } from '../../../../types/game';
import { colors, ui, spacing, fontSize, radius, fontFamily } from '../../../styles/theme';

interface HostLobbyProps {
  players: Player[];
}

export default function HostLobby({ players }: HostLobbyProps) {
  const { socket, roomCode, playerName } = useSocket();

  const canStartGame = players.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{playerName}</h1>
        </div>
        <div style={styles.roomCode}>
          <span style={styles.roomCodeLabel}>ルームコード</span>
          <span style={styles.roomCodeValue}>{roomCode}</span>
        </div>
        <p style={styles.hint}>
          プレイヤーにルームコード <strong>{roomCode}</strong> を共有してください
        </p>
        
        <div style={styles.urlBox}>
          <p style={styles.urlLabel}>プレイヤー参加URL:</p>
          <input
            type="text"
            readOnly
            value={`${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/play?room=${roomCode}`}
            style={styles.urlInput}
            onClick={(e) => {
              e.currentTarget.select();
              navigator.clipboard.writeText(e.currentTarget.value);
            }}
          />
          <p style={styles.urlHint}>クリックでコピー</p>
          <div style={styles.links}>
            <button onClick={() => window.open(`/play?room=${roomCode}`, '_blank')} style={styles.displayButton}>
              📺 プレイヤー画面を開く
            </button>
          </div>
        </div>
        
        <div style={styles.urlBox}>
          <p style={styles.urlLabel}>共有画面URL:</p>
          <input
            type="text"
            readOnly
            value={`${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/display/${roomCode}`}
            style={styles.urlInput}
            onClick={(e) => {
              e.currentTarget.select();
              navigator.clipboard.writeText(e.currentTarget.value);
            }}
          />
          <p style={styles.urlHint}>クリックでコピー</p>

          <div style={styles.links}>
          <button onClick={() => window.open(`/display/${roomCode}`, '_blank')} style={styles.displayButton}>
            📺 共有画面を開く
          </button>
        </div>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>参加者 ({players.length}人)</h2>
          <div style={styles.playerList}>
            {players.length === 0 ? (
              <p style={styles.emptyText}>参加者を待っています...</p>
            ) : (
              players.map((player, index) => (
                <div key={player.id} style={styles.playerItem}>
                  <span style={styles.playerNumber}>{index + 1}.</span>
                  <span style={styles.playerName}>{player.name}</span>
                  {player.name === playerName && (
                    <span style={styles.hostBadge}>ホスト</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.actions}>
          <button
            style={{ ...styles.button, ...(!canStartGame ? styles.buttonDisabled : {}) }}
            disabled={!canStartGame}
            onClick={() => {
              if (socket && canStartGame) {
                socket.emit('startGame', {});
              }
            }}
          >
            ゲームを開始
          </button>
          {players.length === 0 && (
            <p style={styles.startHint}>参加者が必要です</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.card, maxWidth: '600px', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: spacing['6'] },
  title: { fontFamily: fontFamily.display, fontSize: fontSize['4xl'], textAlign: 'center', margin: 0, color: colors.textPrimary },
  roomCode: { ...ui.insetBox, padding: spacing['5'], textAlign: 'center' },
  roomCodeLabel: { display: 'block', fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing['2'] },
  roomCodeValue: { display: 'block', fontSize: fontSize['5xl'], fontWeight: 'bold', letterSpacing: '4px', color: colors.textSecondary },
  links: { marginBottom: spacing['2'] },
  displayButton: { width: '100%', padding: spacing['3'], borderRadius: radius.md, border: 'none', background: colors.blueDark, color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: 600, cursor: 'pointer' },
  section: { marginBottom: spacing['8'] },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: 600, marginBottom: spacing['4'], color: colors.textDim },
  playerList: { background: colors.bgDeep, borderRadius: radius.md, padding: spacing['4'], maxHeight: '200px', overflowY: 'auto' },
  playerItem: { display: 'flex', alignItems: 'center', padding: '10px', borderBottom: `1px solid ${colors.bgCard}`, gap: spacing['3'] },
  playerNumber: { color: colors.textMuted, fontSize: fontSize.sm, minWidth: '24px' },
  playerName: { flex: 1, fontSize: fontSize.base, color: colors.textSecondary },
  hostBadge: { padding: `${spacing['1']} ${spacing['2']}`, borderRadius: radius.sm, background: colors.blue, color: '#fff', fontSize: '12px', fontWeight: 600 },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: spacing['4'], margin: 0 },
  actions: { display: 'flex', flexDirection: 'column', gap: spacing['3'] },
  button: { ...ui.buttonBlue, padding: '14px', fontSize: fontSize.base, fontWeight: 600 },
  buttonDisabled: { background: colors.neutral, cursor: 'not-allowed' },
  startHint: { textAlign: 'center', fontSize: fontSize.caption, color: colors.textAlert, margin: 0 },
  hint: { textAlign: 'center', fontSize: fontSize.sm, color: colors.textDim, marginBottom: spacing['8'],  },
  urlBox: { ...ui.insetBox, padding: spacing['4'], marginBottom: spacing['8'],  },
  urlLabel: { fontSize: '12px', color: colors.textSecondary, marginBottom: spacing['2'], textAlign: 'left' },
  urlInput: { width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bgCard, color: colors.textDim, fontSize: fontSize.sm, fontFamily: 'monospace', cursor: 'pointer' },
  urlHint: { fontSize: fontSize.hint, color: colors.textSecondary, marginBottom: spacing['2'], textAlign: 'center' },
};
