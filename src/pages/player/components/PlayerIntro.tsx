import { colors, gradients, ui, spacing, fontSize, radius, fontFamily } from '../../../styles/theme';

export default function PlayerIntro() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          <h1 style={styles.title}>ルール</h1>

          <div style={styles.infoBox}>
            <div style={styles.infoText}>
              <ul style={styles.rulesList}>
                <li>4択のクイズが出題されます</li>
                <li>時間内に回答を選んでください</li>
                <li>正解を選ぶ → 1pt</li>
                <li>2番目に多く選ばれた選択肢 → 2pt</li>
                <li>正解かつ2位の選択肢 → 3pt（最高点！）</li>
                <li>全問の中でより多くの得点を稼いだプレイヤーの勝利</li>
                <li>戦略的に回答を選ぼう</li>
              </ul>
            </div>
          </div>

          <div style={styles.dots}>
            <span style={{ ...styles.dot, animationDelay: '0s' }}></span>
            <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
            <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: ui.card,
  content: { textAlign: 'center' },
  iconContainer: { marginBottom: spacing['6'] },
  icon: { fontSize: fontSize.displayLg, display: 'inline-block', animation: 'bounce 2s ease-in-out infinite' },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['4xl'],
    fontWeight: 'normal',
    marginBottom: spacing['6'],
    color: colors.textPrimary,
    background: gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  infoBox: { ...ui.insetBox, marginBottom: spacing['6'], display: 'flex', gap: spacing['4'] },
  infoText: { flex: 1 },
  infoTitle: { fontSize: fontSize.base, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing['3'] },
  rulesList: { margin: 0, paddingLeft: '20px', fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: '1.8', textAlign: 'left' },
  dots: { display: 'flex', justifyContent: 'center', gap: spacing['2'] },
  dot: { width: spacing['2'], height: spacing['2'], background: colors.blue, borderRadius: radius.circle, display: 'inline-block', animation: 'pulse 1.4s ease-in-out infinite' },
};
