import { colors, choiceAccents, choiceColors, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  myAnswer: number | null;
  correctIndex?: number;
  quizEarnedPoints?: number;
  totalScore?: number;
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D'];

export default function PlayerResultVotes({ quizNumber, myAnswer, correctIndex, quizEarnedPoints, totalScore }: Props) {
  const isCorrect = myAnswer !== null && correctIndex !== undefined && myAnswer === correctIndex;
  const isSecondPlace = quizEarnedPoints === 2 || quizEarnedPoints === 3;
  const isBoth = isCorrect && isSecondPlace;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>問題 {quizNumber} の結果</div>

        <div style={styles.choiceGrid}>
          {CHOICE_LABELS.map((label, i) => {
            const isMine = myAnswer === i;
            const col = choiceColors[i];
            return (
              <div
                key={i}
                style={{
                  ...styles.tile,
                  background: col.bg,
                  color: choiceAccents[i],
                  border: `2px solid ${isMine ? choiceAccents[i] : 'transparent'}`,
                }}
              >
                {label}
                {isMine && <div style={styles.dot} />}
              </div>
            );
          })}
        </div>

        {myAnswer !== null && (correctIndex !== undefined || isSecondPlace) && (
          <div style={{
            ...styles.verdict,
            background: isBoth ? '#1a1200' : isSecondPlace ? '#1a1200' : isCorrect ? '#052e16' : '#1c0a09',
            borderColor: isBoth ? colors.amber : isSecondPlace ? colors.amber : isCorrect ? '#16a34a' : '#991b1b',
          }}>
            {isBoth ? (
              <>
                <span style={{ fontSize: fontSize.xl }}>✓★</span>
                <span style={{ color: colors.amberLight, fontWeight: '600' }}>正解 ＆ 2位選択！</span>
              </>
            ) : isSecondPlace && !isCorrect ? (
              <>
                <span style={{ fontSize: fontSize.xl }}>★</span>
                <span style={{ color: colors.amberLight, fontWeight: '600' }}>2位選択！</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: fontSize.xl }}>{isCorrect ? '✓' : '✗'}</span>
                <span style={{ color: isCorrect ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                  {isCorrect ? '正解！' : '不正解'}
                </span>
              </>
            )}
          </div>
        )}

        <div style={styles.scoreSection}>
          {quizEarnedPoints !== undefined && (
            <div style={styles.scoreRow}>
              <span style={styles.scoreLabel}>獲得ポイント</span>
              <span style={{ ...styles.scoreValue, color: colors.textPrimary }}>
                +{quizEarnedPoints} pt
              </span>
            </div>
          )}
          {totalScore !== undefined && (
            <div style={{ ...styles.scoreRow, borderTop: `1px solid ${colors.border}`, paddingTop: spacing['3'] }}>
              <span style={styles.scoreLabel}>合計スコア</span>
              <span style={{ ...styles.scoreValue, color: colors.textPrimary }}>
                {totalScore} pt
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, padding: spacing['4'] },
  card: { ...ui.cardBordered, maxWidth: '340px', padding: `${spacing['8']} ${spacing['6']}` },
  badge: { ...ui.quizBadge, display: 'inline-block', padding: '5px 14px', marginBottom: spacing['6'] },
  choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing['3'], marginBottom: spacing['5'] },
  tile: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '64px', borderRadius: radius.md, fontSize: fontSize['2xl'], fontWeight: 'bold',
    position: 'relative',
  },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: '#fff', marginTop: '4px' },
  verdict: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: `${spacing['3']} ${spacing['4']}`, borderRadius: '10px', border: '1px solid',
    marginBottom: spacing['5'], fontSize: fontSize.base,
  },
  scoreSection: { display: 'flex', flexDirection: 'column', gap: spacing['2'] },
  scoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing['2']} 0` },
  scoreLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  scoreValue: { fontSize: fontSize['2xl'], fontWeight: 'bold' },
};
