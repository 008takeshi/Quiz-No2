import type { FinalResult } from '../../../../types/game';
import { colors, ui, spacing, fontSize, fontFamily } from '../../../styles/theme';

interface Props {
  finalResult: FinalResult;
  myPlayerId: string;
}

export default function PlayerFinalResult({ finalResult, myPlayerId }: Props) {
  const { leaderboard } = finalResult;
  const myEntry = leaderboard.find(e => e.playerId === myPlayerId);
  const isWinner = myEntry?.rank === 1;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>結果発表!</h1>
        {isWinner && (
          <>
            <div style={styles.trophyIcon}>🏆</div>
            <h1 style={styles.winTitle}>おめでとう！優勝！</h1>
          </>
        )}

        {myEntry && (
          <div style={styles.myResult}>
            <div style={styles.myName}>{myEntry.playerName}</div>
            <div style={styles.myRankScore}>
              <span style={styles.myRank}>{myEntry.rank}位</span>
              <span style={styles.myScore}>{myEntry.totalScore}pt</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, padding: spacing['4'] },
  card: { ...ui.cardBordered, maxWidth: '360px', padding: `${spacing['10']} ${spacing['6']}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['4'] },
  heading: { fontSize: fontSize['6xl'], fontFamily: fontFamily.display, fontWeight: 'normal', color: colors.textPrimary, margin: 0 },
  trophyIcon: { fontSize: '64px' },
  winTitle: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.textMuted },
  myResult: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing['2'], padding: spacing['5'], marginTop: spacing['2'] },
  myName: { fontSize: fontSize['4xl'],  fontFamily: fontFamily.display, fontWeight: 'normal', color: colors.textDim },
  myRankScore: { display: 'flex', gap: spacing['8'] },
  myRank: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.textMuted },
  myScore: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.textMuted },
  footer: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing['4'] },
};
