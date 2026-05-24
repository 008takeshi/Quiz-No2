import { useSocket } from '../../../contexts/SocketContext';
import { colors, ui, spacing, fontSize } from '../../../styles/theme';

interface Props {
  quizNumber: number;
  totalQuizCount: number;
}

export default function HostQuizPrepare({ quizNumber, totalQuizCount }: Props) {
  const { socket } = useSocket();

  const handleStart = () => {
    socket?.emit('startQuizShow', {});
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>問題 {quizNumber} / {totalQuizCount}</div>
        <div style={styles.icon}>📝</div>
        <h1 style={styles.title}>問題 {quizNumber} の準備</h1>
        <p style={styles.subtitle}>準備ができたら出題を開始してください</p>
        <button style={styles.button} onClick={handleStart}>
          出題開始
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: ui.pageCenterGradient,
  card: { ...ui.cardBordered, padding: `${spacing['12']} ${spacing['10']}`, textAlign: 'center' },
  badge: { ...ui.quizBadge, display: 'inline-block', padding: `6px ${spacing['5']}`, fontSize: fontSize.sm, marginBottom: spacing['6'] },
  icon: { fontSize: fontSize.displayLg, marginBottom: spacing['4'], display: 'block' },
  title: { fontSize: fontSize['4xl'], fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing['3'] },
  subtitle: { fontSize: fontSize.base, color: colors.textDim, marginBottom: spacing['10'] },
  button: { ...ui.buttonPrimary, fontSize: fontSize.xl, fontWeight: 700 },
};
