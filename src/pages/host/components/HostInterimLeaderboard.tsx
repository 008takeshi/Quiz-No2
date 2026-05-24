import { useSocket } from '../../../contexts/SocketContext';
import { colors, rankEmoji, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  completedQuizCount: number;
  totalQuizCount: number;
  topEntries: Array<{ rank: number; playerName: string | null; totalScore: number; hideScore: boolean }>;
}

export default function HostInterimLeaderboard({ completedQuizCount, totalQuizCount, topEntries }: Props) {
  const { socket } = useSocket();

  const rankColors = [colors.gold, '#e2e8f0', colors.orange];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>途中経過</span>
          <span style={styles.progress}>{completedQuizCount} / {totalQuizCount} 問終了</span>
        </div>

        <h2 style={styles.title}>現在の上位 {topEntries.length} 名</h2>
        <p style={styles.note}>名前は最終発表まで非公開です</p>

        <div style={styles.entries}>
          {topEntries.map((entry, i) => {
            const ci = entry.rank - 1;
            const color = rankColors[ci] ?? colors.textMuted;
            return (
              <div key={i} style={{ ...styles.entryRow, borderColor: color }}>
                <span style={{ ...styles.rankIcon, color }}>
                  {entry.rank <= 3 ? rankEmoji[ci] : `${entry.rank}位`}
                </span>
                <span style={styles.anonymous}>{entry.playerName ?? '???'}</span>
                <span style={{ ...styles.score, color }}>
                  {entry.totalScore} pt
                  {entry.hideScore && <span style={styles.hidden}>（共有画面では非表示）</span>}
                </span>
              </div>
            );
          })}
          {topEntries.length === 0 && (
            <p style={styles.empty}>まだデータがありません</p>
          )}
        </div>

        <button style={styles.button} onClick={() => socket?.emit('nextQuiz', {})}>
          次の問題へ →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.cardWide, maxWidth: '560px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['5'] },
  badge: ui.quizBadge,
  progress: { fontSize: fontSize.sm, color: colors.textMuted },
  title: { fontSize: fontSize['2xl'], fontWeight: 700, color: colors.textPrimary, textAlign: 'center', margin: `0 0 ${spacing['2']}` },
  note: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing['7'] },
  entries: { display: 'flex', flexDirection: 'column', gap: spacing['3'], marginBottom: spacing['8'] },
  entryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['4'],
    padding: `${spacing['4']} ${spacing['5']}`,
    background: colors.bgDeep,
    borderRadius: radius.lg,
    border: `2px solid`,
  },
  rankIcon: { fontSize: fontSize['2xl'], width: '36px', textAlign: 'center', flexShrink: 0 },
  anonymous: { flex: 1, fontSize: fontSize.lg, color: colors.textMuted, letterSpacing: '0.1em' },
  score: { fontSize: fontSize.xl, fontWeight: 700, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  hidden: { fontSize: fontSize.hint, color: colors.textAlert, fontWeight: 400 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.base },
  button: { ...ui.buttonPrimary, padding: '14px', fontSize: fontSize.lg },
};
