import { useSocket } from '../../../contexts/SocketContext';
import { colors, gradients, ui, spacing, fontSize, fontFamily } from '../../../styles/theme';

interface HostIntroProps {
  playerCount: number;
  totalQuizCount: number;
}

export default function HostIntro({ playerCount, totalQuizCount }: HostIntroProps) {
  const { socket } = useSocket();

  const handleNext = () => {
    if (socket) {
      socket.emit('goToQuizPrep', {});
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.content}>
          <h1 style={styles.title}>ルール説明</h1>
          <p style={styles.subtitle}>クイズNo.2！のルール説明をしてゲームを開始しましょう</p>

          <div style={styles.infoBox}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>参加者数</span>
              <span style={styles.infoValue}>{playerCount}人</span>
            </div>
            <div style={{ ...styles.infoItem, marginTop: spacing['3'] }}>
              <span style={styles.infoLabel}>問題数</span>
              <span style={styles.infoValue}>{totalQuizCount}問</span>
            </div>
          </div>

          <div style={styles.rules}>
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

          <button style={styles.button} onClick={handleNext}>
            問題へ進む
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenter,
  card: { ...ui.card, maxWidth: '600px', padding: `${spacing['12']} ${spacing['10']}` },
  content: { textAlign: 'center' },
  iconContainer: { marginBottom: spacing['6'] },
  icon: { fontSize: fontSize.displayLg, display: 'inline-block', animation: 'bounce 1s ease-in-out infinite' },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['5xl'],
    fontWeight: 'normal',
    marginBottom: spacing['2'],
    color: colors.textPrimary,
    background: gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: { fontSize: fontSize.lg, color: colors.textDim, marginBottom: spacing['8'] },
  infoBox: { ...ui.insetBox, marginBottom: spacing['8'] },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: fontSize.base, color: colors.textSecondary },
  infoValue: { fontSize: fontSize['2xl'], fontWeight: 'bold', color: colors.textSecondary },
  rules: { ...ui.insetBox, marginBottom: spacing['8'] },
  infoText: { flex: 1 },
  rulesTitle: { fontSize: fontSize.lg, fontWeight: 600, color: colors.textSecondary, marginBottom: spacing['3'] },
  rulesList: { margin: 0, paddingLeft: '20px', fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: '1.8', textAlign: 'left' },
  button: ui.buttonPrimary,
};

