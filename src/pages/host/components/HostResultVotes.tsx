import { useSocket } from '../../../contexts/SocketContext';
import type { ChoiceStatistics } from '../../../../types/game';
import { colors, choiceAccents, choiceColors, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  question: string;
  statistics: ChoiceStatistics[];
  phase: 'announce' | 'answer' | 'votes';
  hasMoreQuizzes: boolean;
  isHalfwayPoint?: boolean;
  explanation?: string;
}

export default function HostResultVotes({ quizNumber, question, statistics, phase, hasMoreQuizzes, isHalfwayPoint, explanation }: Props) {
  const { socket } = useSocket();

  const maxVotes = Math.max(...statistics.map(s => s.voteCount), 1);
  const totalVotes = statistics.reduce((a, s) => a + s.voteCount, 0);
  const showBars = phase !== 'announce';
  const showAnswer = phase === 'answer' || phase === 'votes';
  const showVoteCounts = phase === 'votes';

  const phaseLabel = phase === 'announce' ? '結果発表' : phase === 'answer' ? '正解発表' : '得票数';
  const buttonLabel = phase === 'announce' ? '答えを表示する'
    : phase === 'answer' ? '投票を表示する'
    : !hasMoreQuizzes ? '🏆 最終結果を見る'
    : isHalfwayPoint ? '途中経過を発表 →'
    : '次の問題へ →';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>問題 {quizNumber} 結果</span>
          <span style={styles.phaseLabel}>{phaseLabel}</span>
        </div>

        <div style={styles.questionBox}>
          <p style={styles.question}>{question}</p>
        </div>

        {showBars && (
          <div style={styles.bars}>
            {statistics.map((s, i) => {
              const isCorrectRevealed = showAnswer && s.isCorrect;
              const isSecondRevealed = showVoteCounts && s.isSecondPlace;
              const accentColor = choiceAccents[i];
              const barWidth = showVoteCounts && maxVotes > 0 ? (s.voteCount / maxVotes) * 100 : 0;
              const votePct = showVoteCounts && totalVotes > 0 ? Math.round((s.voteCount / totalVotes) * 100) : null;
              return (
                <div key={i} style={styles.barRow}>
                  <div style={styles.barLabel}>
                    <span style={{ ...styles.choiceIdx, background: choiceColors[i].bg, color: choiceColors[i].label }}>{String.fromCharCode(65 + i)}</span>
                    <span style={styles.choiceText}>{s.text}</span>
                    {isCorrectRevealed && <span style={styles.correctBadge}>✓ 正解</span>}
                    {isSecondRevealed && <span style={styles.secondBadge}>★ 2位</span>}
                  </div>
                  <div style={styles.barTrack}>
                    <div style={{ ...styles.barFill, width: `${barWidth}%`, background: accentColor }} />
                  </div>
                  {showVoteCounts && (
                    <div style={styles.voteStat}>
                      <span style={styles.votePct}>{votePct}%</span>
                      <span style={styles.voteCount}>{s.voteCount}票</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showAnswer && explanation && (
          <div style={styles.explanation}>
            <span style={styles.explanationLabel}>解説：</span>{explanation}
          </div>
        )}

        <button style={styles.button} onClick={() => socket?.emit('nextResultStep', {})}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: ui.cardWide,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing['5'] },
  badge: ui.quizBadge,
  phaseLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  questionBox: { ...ui.insetBox, padding: spacing['5'], marginBottom: spacing['7'] },
  explanation: { ...ui.insetBox, padding: `${spacing['3']} ${spacing['4']}`, marginBottom: spacing['5'], fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: '1.6' },
  explanationLabel: { fontWeight: 700, color: colors.textSecondary, marginRight: spacing['1'] },
  question: { fontSize: fontSize.lg, color: colors.textSecondary, lineHeight: '1.5', margin: 0 },
  bars: { display: 'flex', flexDirection: 'column', gap: spacing['4'], marginBottom: spacing['8'] },
  barRow: { display: 'flex', alignItems: 'center', gap: spacing['3'] },
  barLabel: { width: '220px', display: 'flex', alignItems: 'center', gap: spacing['2'], flexShrink: 0 },
  choiceIdx: { width: '24px', height: '24px', borderRadius: radius.circle, fontSize: fontSize.caption, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.3s, color 0.3s' },
  choiceText: { fontSize: fontSize.sm, color: colors.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  correctBadge: { background: colors.greenDeep, color: colors.greenLight, borderRadius: radius.sm, padding: '2px 6px', fontSize: fontSize.hint, fontWeight: 600, flexShrink: 0 },
  secondBadge: { background: colors.goldBg, color: colors.gold, borderRadius: radius.sm, padding: '2px 6px', fontSize: fontSize.hint, fontWeight: 600, flexShrink: 0 },
  barTrack: { flex: 1, height: spacing['8'], background: colors.bgDeep, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 0 0 3px #0d001a' },
  barFill: { height: '100%', borderRadius: '6px', transition: 'width 0.5s ease' },
  voteStat: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '2px', width: '52px', flexShrink: 0 },
  votePct: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: 600 },
  voteCount: { fontSize: fontSize.hint, color: colors.textMuted },
  button: { ...ui.buttonPrimary, padding: '14px', fontSize: fontSize.lg },
};
