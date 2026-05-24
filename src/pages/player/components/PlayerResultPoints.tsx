import { colors, ui, spacing, fontSize, radius } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  earnedPoints: number;
  wasCorrect: boolean;
  isSecondPlace: boolean;
  totalScore: number;
}

export default function PlayerResultPoints({ quizNumber, earnedPoints, wasCorrect, isSecondPlace, totalScore }: Props) {
  const pointsColor = earnedPoints >= 3 ? '#fbbf24' : earnedPoints >= 2 ? '#a78bfa' : earnedPoints >= 1 ? '#34d399' : '#94a3b8';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>問題 {quizNumber} ポイント</div>

        <div style={styles.pointsSection}>
          <div style={{ ...styles.pointsCircle, borderColor: pointsColor }}>
            <span style={{ ...styles.pointsNum, color: pointsColor }}>+{earnedPoints}</span>
            <span style={styles.pointsPt}>pt</span>
          </div>
          {earnedPoints === 3 && <p style={styles.bonusText}>🎉 最高得点！正解 & 2位選択！</p>}
          {earnedPoints === 2 && !wasCorrect && <p style={styles.bonusText}>🎯 2位選択ボーナス！</p>}
          {earnedPoints === 2 && wasCorrect && <p style={styles.bonusText}>⭐ 正解 & 2位選択！</p>}
          {earnedPoints === 1 && <p style={styles.bonusText}>✓ 正解！</p>}
          {earnedPoints === 0 && <p style={{ ...styles.bonusText, color: '#64748b' }}>今回はポイントなし</p>}
        </div>

        <div style={styles.tags}>
          {wasCorrect && <span style={styles.tagCorrect}>✓ 正解</span>}
          {isSecondPlace && <span style={styles.tagSecond}>2位選択</span>}
          {!wasCorrect && !isSecondPlace && <span style={styles.tagNone}>不正解</span>}
        </div>

        <div style={styles.scoreBox}>
          <span style={styles.scoreLabel}>累計スコア</span>
          <span style={styles.scoreValue}>{totalScore}pt</span>
        </div>

        <p style={styles.rankNote}>🔒 順位は最終結果で発表されます</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { ...ui.pageCenter, padding: spacing['4'] },
  card: { ...ui.cardBordered, maxWidth: '380px', padding: `${spacing['8']} ${spacing['6']}`, textAlign: 'center' },
  badge: { ...ui.quizBadge, display: 'inline-block', padding: '5px 14px', marginBottom: spacing['6'] },
  pointsSection: { marginBottom: spacing['5'] },
  pointsCircle: { width: '120px', height: '120px', borderRadius: radius.circle, border: '4px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: `0 auto ${spacing['3']}`, background: colors.bgDeep },
  pointsNum: { fontSize: fontSize.display, fontWeight: 'bold', lineHeight: 1 },
  pointsPt: { fontSize: fontSize.base, color: colors.textSecondary },
  bonusText: { fontSize: fontSize.base, color: colors.textPrimary, fontWeight: 600 },
  tags: { display: 'flex', justifyContent: 'center', gap: spacing['2'], marginBottom: spacing['7'] },
  tagCorrect: { background: colors.greenBg, color: colors.greenLight, border: `1px solid ${colors.greenDark}`, borderRadius: '6px', padding: `${spacing['1']} ${spacing['3']}`, fontSize: fontSize.caption, fontWeight: 600 },
  tagSecond: { background: colors.goldBg, color: colors.gold, border: `1px solid ${colors.goldDeep}`, borderRadius: '6px', padding: `${spacing['1']} ${spacing['3']}`, fontSize: fontSize.caption, fontWeight: 600 },
  tagNone: { background: colors.redBg, color: colors.timerUrgent, border: `1px solid ${colors.redDeep}`, borderRadius: '6px', padding: `${spacing['1']} ${spacing['3']}`, fontSize: fontSize.caption, fontWeight: 600 },
  scoreBox: { ...ui.insetBox, padding: `${spacing['4']} ${spacing['6']}`, marginBottom: spacing['4'], display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  scoreValue: { fontSize: fontSize['2xl'], fontWeight: 'bold', color: colors.textPrimary },
  rankNote: { fontSize: fontSize.caption, color: colors.neutral },
};
