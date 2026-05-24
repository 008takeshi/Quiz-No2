import { useState } from 'react';
import { useSocket } from '../../../contexts/SocketContext';
import type { FinalResult } from '../../../../types/game';
import { colors, rankColors, rankEmoji, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  finalResult: FinalResult;
}

export default function HostFinalResult({ finalResult }: Props) {
  const { socket } = useSocket();
  const { leaderboard } = finalResult;
  const [winnerRevealed, setWinnerRevealed] = useState(false);

  const handleRevealWinner = () => {
    socket?.emit('revealWinner', {});
    setWinnerRevealed(true);
  };

  const handleClose = () => socket?.emit('closeRoom', {});

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.rankingTitle}>結果発表！</h2>
        <div style={styles.list}>
          {leaderboard.map((entry) => {
            const isFirst = entry.rank === 1;
            return (
              <div
                key={entry.playerId}
                style={{
                  ...styles.listItem,
                  ...(isFirst ? styles.firstItem : {}),
                  background: isFirst ? '#1c1506' : '#0f172a',
                }}
              >
                <span
                  style={{
                    ...styles.rank,
                    ...(isFirst ? styles.firstRank : {}),
                    color: entry.rank <= 3 ? rankColors[entry.rank - 1] : '#64748b',
                  }}
                >
                  {entry.rank <= 3 ? rankEmoji[entry.rank - 1] : `${entry.rank}位`}
                </span>
                <span style={{ ...styles.name, ...(isFirst ? styles.firstName : {}) }}>
                  {entry.playerName}
                </span>
                <span style={{ ...styles.score, ...(isFirst ? styles.firstScore : {}) }}>
                  {entry.totalScore}pt
                </span>
              </div>
            );
          })}
        </div>

        {!winnerRevealed && (
          <button style={styles.revealButton} onClick={handleRevealWinner}>
            🥇 1位を発表する
          </button>
        )}
        <button style={styles.closeButton} onClick={handleClose}>
          ゲームを終了する
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenterGradient,
  card: { ...ui.cardBordered, maxWidth: '600px', padding: `${spacing['10']} ${spacing['10']}`, borderRadius: radius['2xl'], boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  rankingTitle: { fontSize: fontSize.xl, color: colors.textPrimary, marginBottom: spacing['5'], textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.05em' },
  list: { display: 'flex', flexDirection: 'column', gap: spacing['2'], marginBottom: spacing['8'] },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: `14px ${spacing['5']}`,
    borderRadius: '10px',
    border: '2px solid transparent',
  },
  firstItem: {
    border: `2px solid ${colors.goldDeep}`,
    boxShadow: '0 0 20px rgba(251,191,36,0.15)',
    padding: `${spacing['4']} ${spacing['5']}`,
  },
  rank: { width: spacing['12'], fontSize: fontSize.lg, fontWeight: 'bold' },
  firstRank: { fontSize: fontSize['3xl'], width: '56px' },
  name: { flex: 1, fontSize: fontSize.base, color: colors.textSecondary, fontWeight: 600 },
  firstName: { fontSize: fontSize['2xl'], color: colors.textSecondary, fontWeight: 'bold' },
  score: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.textSecondary },
  firstScore: { fontSize: fontSize['2xl'], color: colors.gold, fontWeight: 'bold' },
  revealButton: { ...ui.buttonPrimary, width: '100%', fontSize: fontSize.base, marginBottom: spacing['3'] },
  closeButton: { ...ui.buttonNeutral, width: '100%', color: colors.textSecondary, fontSize: fontSize.base },
};
