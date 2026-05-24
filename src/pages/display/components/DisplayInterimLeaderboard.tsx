import { colors, rankEmoji, ui, displayPage, displayFontSize, displaySpacing, radius } from '../../../styles/theme';

interface Props {
  completedQuizCount: number;
  totalQuizCount: number;
  topEntries: Array<{ rank: number; playerName: string | null; totalScore: number; hideScore: boolean }>;
}

export default function DisplayInterimLeaderboard({ completedQuizCount, totalQuizCount, topEntries }: Props) {
  const rankColors = [colors.gold, '#e2e8f0', colors.orange];

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <div style={styles.badgeRow}>
          <span style={styles.badge}>途中経過発表</span>
          <span style={styles.progress}>{completedQuizCount} / {totalQuizCount} 問終了時点</span>
        </div>

        <h1 style={styles.title}>現在の上位 {topEntries.length} 名</h1>

        <div style={styles.entries}>
          {topEntries.map((entry, i) => {
            const ci = entry.rank - 1;
            const color = rankColors[ci] ?? colors.textMuted;
            return (
              <div key={i} style={{ ...styles.entryRow, borderColor: color }}>
                <span style={{ ...styles.rankEmoji, color }}>
                  {entry.rank <= 3 ? rankEmoji[ci] : `${entry.rank}位`}
                </span>
                <span style={styles.anonymous}>{entry.playerName ?? '???'}</span>
                <span style={{ ...styles.score, color: entry.hideScore ? colors.textMuted : color }}>
                  {entry.hideScore ? '??? pt' : `${entry.totalScore} pt`}
                </span>
              </div>
            );
          })}
          {topEntries.length === 0 && (
            <p style={styles.empty}>まだデータがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    ...ui.pageCenter,
    ...displayPage,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  inner: {
    width: '100%',
    maxWidth: 'min(720px, 90vw)',
    maxHeight: '100%',
    padding: displaySpacing['10'],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  badgeRow: { display: 'flex', gap: displaySpacing['4'], alignItems: 'center', marginBottom: displaySpacing['6'] },
  badge: {
    background: '#7b2cbf', color: '#ffd60a', borderRadius: '999px',
    padding: `clamp(4px, 0.74vh, 8px) clamp(10px, 1.85vh, 20px)`,
    fontSize: displayFontSize.base, fontWeight: 700, border: '2px solid #ffd60a',
  },
  progress: { fontSize: displayFontSize.base, color: colors.textSecondary },
  title: {
    fontSize: displayFontSize.displayLg,
    fontWeight: 700,
    color: colors.textSecondary,
    textAlign: 'center',
    margin: `0 0 ${displaySpacing['8']}`,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
  },
  entries: { display: 'flex', flexDirection: 'column', gap: displaySpacing['4'], width: '100%' },
  entryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: displaySpacing['6'],
    padding: `${displaySpacing['5']} ${displaySpacing['7']}`,
    background: 'rgba(26,11,46,0.85)',
    borderRadius: radius.xl,
    border: '3px solid',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  rankEmoji: { fontSize: displayFontSize['4xl'], width: 'clamp(36px, 5.2vh, 56px)', textAlign: 'center', flexShrink: 0 },
  anonymous: {
    flex: 1,
    fontSize: displayFontSize['3xl'],
    color: colors.textMuted,
    letterSpacing: '0.15em',
    fontWeight: 700,
  },
  score: { fontSize: displayFontSize['3xl'], fontWeight: 700, flexShrink: 0 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: displayFontSize.xl },
};
